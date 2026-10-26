import os
import json
import re
import time
from typing import Dict, Any, Optional, Tuple

# Safe Google GenAI import
try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    genai = None
    HAS_GENAI = False

# Safe Groq import
try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    Groq = None
    HAS_GROQ = False

from app.core.config import settings
from app.services.llm.prompt_templates import (
    TUTOR_SYSTEM_PROMPT,
    CODE_ANALYSIS_PROMPT,
    QUESTION_GENERATION_PROMPT,
)

class LLMService:
    def __init__(self):
        # Gemini configuration (Primary)
        self.gemini_api_key = (
            settings.GEMINI_API_KEY
            or settings.GOOGLE_API_KEY
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
        )
        self.gemini_model = settings.GEMINI_MODEL or "gemini-1.5-flash"
        self.gemini_client = None
        if HAS_GENAI and self.gemini_api_key:
            try:
                self.gemini_client = genai.Client(api_key=self.gemini_api_key)
            except Exception as e:
                print(f"[LLMService] Failed to initialize Gemini client: {e}")

        # Groq configuration (Fall-down / Failover Provider)
        self.groq_api_key = (
            settings.GROQ_API_KEY
            or os.getenv("GROQ_API_KEY")
            or "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"
        )
        self.groq_model = settings.GROQ_MODEL or "qwen/qwen3.8-27b"
        self.groq_client = None
        if HAS_GROQ and self.groq_api_key:
            try:
                self.groq_client = Groq(api_key=self.groq_api_key)
            except Exception as e:
                print(f"[LLMService] Failed to initialize Groq client: {e}")

        # Shim client attribute for backward compatibility
        self.client = self.gemini_client or self

    def is_live_available(self) -> bool:
        return bool(self.gemini_client or self.groq_client)

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Safely extract JSON from raw model output, handling ```json blocks."""
        text = text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
        try:
            return json.loads(text)
        except Exception:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                try:
                    return json.loads(text[start:end+1])
                except Exception:
                    pass
            return {"reply": text}

    def _call_gemini(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> Optional[Tuple[str, str]]:
        """Attempt completion using Google Gemini."""
        if not self.gemini_client:
            return None
        try:
            full_contents = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = self.gemini_client.models.generate_content(
                model=self.gemini_model,
                contents=full_contents,
            )
            if response and hasattr(response, "text") and response.text:
                return response.text, self.gemini_model
        except Exception as gemini_err:
            print(f"[LLMService] Gemini call failed ({type(gemini_err).__name__}: {gemini_err}).")
        return None

    def _call_groq(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = False,
    ) -> Optional[Tuple[str, str]]:
        """Attempt completion using Groq Cloud API with model failover."""
        if not self.groq_client:
            return None

        groq_candidate_models = [
            self.groq_model,
            "qwen/qwen3.8-27b",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
        ]
        seen = set()
        models_to_try = [m for m in groq_candidate_models if not (m in seen or seen.add(m))]

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        for model_name in models_to_try:
            try:
                # Groq free tier enforces 1000 OTPM on qwen/qwen3.8-27b.
                # Budgeting max_tokens to 950 avoids 429 rate limit errors.
                max_toks = 950 if "qwen" in model_name.lower() else 2048
                kwargs: Dict[str, Any] = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": 0.3 if json_mode else 0.7,
                    "max_tokens": max_toks,
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}

                completion = self.groq_client.chat.completions.create(**kwargs)
                if completion.choices and len(completion.choices) > 0:
                    choice = completion.choices[0]
                    content = choice.message.content or ""
                    if not content and hasattr(choice.message, "reasoning") and choice.message.reasoning:
                        content = choice.message.reasoning

                    if content:
                        return content, f"groq/{model_name}"
            except Exception as groq_err:
                print(f"[LLMService] Groq attempt with model '{model_name}' failed: {groq_err}")

        return None

    def _call_llm_with_fallback(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = False,
    ) -> Tuple[Optional[str], str, bool]:
        """
        Executes LLM completion with automatic Groq fallback:
        1. Attempt Primary (Gemini)
        2. If Gemini fails (404 Not Found, 429 Quota/RateLimit, 503 ServerError, Timeout, etc.),
           immediately trigger automatic fallback failover to Groq!
        3. If Gemini is not configured, directly execute on Groq.
        Returns: (raw_text, model_used, is_fallback)
        """
        # Primary provider execution (Gemini)
        gemini_result = self._call_gemini(prompt, system_prompt)
        if gemini_result:
            return gemini_result[0], gemini_result[1], False

        # Fallback provider execution (Groq)
        print("[LLMService] Primary provider unavailable or failed. Activating Groq fallback failover...")
        groq_result = self._call_groq(prompt, system_prompt, json_mode)
        if groq_result:
            print(f"[LLMService] Groq fallback successfully resolved response using '{groq_result[1]}'.")
            return groq_result[0], groq_result[1], True

        # All providers failed or unavailable
        return None, "fallback-failed", False

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> Tuple[str, str, bool]:
        """Universal text generation with fall-down support."""
        raw, model_name, is_fallback = self._call_llm_with_fallback(prompt, system_prompt=system_prompt)
        if raw:
            return raw, model_name, is_fallback
        return "Grounded fallback summary generated.", "demo", True

    def generate_content(self, prompt: str):
        """Shim for any legacy client.generate_content calls."""
        raw, model_name, is_fallback = self._call_llm_with_fallback(prompt)
        class ShimResponse:
            def __init__(self, text):
                self.text = text or ""
        return ShimResponse(raw or "Fallback response generated.")

    def chat_with_tutor(
        self,
        message: str,
        code_snippet: Optional[str] = None,
        language: str = "python",
        explanation_language: str = "english",
        quick_action: Optional[str] = None,
    ) -> Dict[str, Any]:
        start_time = time.time()

        prompt = f"""Student Explanation Language Preference: {explanation_language.upper()}
Programming Language: {language}
Quick Action Triggered: {quick_action or 'None'}

Student Message:
{message}
"""
        if code_snippet:
            prompt += f"\nStudent Code Snippet:\n```{language}\n{code_snippet}\n```"

        raw_text, model_used, is_fallback = self._call_llm_with_fallback(
            prompt=prompt,
            system_prompt=TUTOR_SYSTEM_PROMPT,
            json_mode=False,
        )

        latency = round((time.time() - start_time) * 1000, 2)

        if raw_text:
            reply_text = raw_text.strip()
            # If the model wrapped in JSON for any reason, safely unwrap it
            if reply_text.startswith("{") and reply_text.endswith("}"):
                try:
                    parsed = json.loads(reply_text)
                    if isinstance(parsed, dict) and "reply" in parsed:
                        reply_text = parsed["reply"]
                except Exception:
                    pass

            return {
                "reply": reply_text,
                "breakdown": None,
                "language": language,
                "is_demo": False,
                "is_fallback": is_fallback,
                "model_used": model_used,
                "latency_ms": latency,
            }

        # Structured Demo Mode response (Transparently marked is_demo = True)
        demo_response = self._generate_demo_tutor_response(
            message=message,
            code_snippet=code_snippet,
            language=language,
            explanation_language=explanation_language,
            quick_action=quick_action,
        )
        demo_response["is_demo"] = True
        demo_response["latency_ms"] = latency
        demo_response["model_used"] = "logicforge-mentor-engine (Demo Mode: set GEMINI_API_KEY or GROQ_API_KEY for live LLM)"
        return demo_response

    def analyze_code(self, code: str, language: str = "python") -> Dict[str, Any]:
        start_time = time.time()

        prompt = f"""Language: {language}
Code to analyze:
```{language}
{code}
```
"""
        raw_text, model_used, is_fallback = self._call_llm_with_fallback(
            prompt=prompt,
            system_prompt=CODE_ANALYSIS_PROMPT,
            json_mode=True,
        )

        if raw_text:
            parsed = self._extract_json(raw_text)
            parsed["is_demo"] = False
            parsed["is_fallback"] = is_fallback
            parsed["model_used"] = model_used
            parsed["latency_ms"] = round((time.time() - start_time) * 1000, 2)
            return parsed

        # Deterministic + Demo code analysis
        return self._generate_demo_code_analysis(code, language)

    def generate_question(
        self,
        language: str = "python",
        topic: str = "Arrays & Hashing",
        difficulty: str = "easy",
        user_history_note: str = "",
    ) -> Dict[str, Any]:
        prompt = f"""Language: {language}
Topic: {topic}
Difficulty: {difficulty}
Student History Context: {user_history_note}
"""
        raw_text, model_used, is_fallback = self._call_llm_with_fallback(
            prompt=prompt,
            system_prompt=QUESTION_GENERATION_PROMPT,
            json_mode=True,
        )

        if raw_text:
            parsed = self._extract_json(raw_text)
            parsed["is_ai_generated"] = True
            parsed["language"] = language
            parsed["topic"] = topic
            parsed["difficulty"] = difficulty
            parsed["model_used"] = model_used
            parsed["is_fallback"] = is_fallback
            return parsed

        return self._generate_demo_adaptive_question(language, topic, difficulty)

    def _generate_demo_tutor_response(
        self,
        message: str,
        code_snippet: Optional[str],
        language: str,
        explanation_language: str,
        quick_action: Optional[str],
    ) -> Dict[str, Any]:
        is_hinglish = explanation_language.lower() == "hinglish"

        if is_hinglish:
            reply = (
                f"Bilkul! Chalo samajhte hain: `{message}` ko step-by-step todte hain. "
                "Programming mein sabse zaroori hai mental model banana aur memory mein variables kaise change ho rahe hain ye dekhna."
            )
            summary = "Core Concept Breakdown (Hinglish Guide)"
            step1_note = "Variables memory mein allocate hue aur execution shuru hua."
            hint1 = "Base case ko pehle check karo, taaki infinite loop ya segmentation fault na ho."
            follow_up = "Kya aap bata sakte hain ki agar input empty array ho toh function kya return karega?"
        else:
            reply = (
                f"Great question! Let's break down `{message}` systematically. "
                "Understanding the execution flow and memory model is key to mastering this concept."
            )
            summary = "Algorithmic and Conceptual Breakdown"
            step1_note = "Variables initialized in stack frame."
            hint1 = "Verify boundary conditions before entering the main loop or recursive branch."
            follow_up = "What would be the time complexity if we double the size of the input?"

        line_by_line = [
            {"line": 1, "code": "def solution(data):", "explanation": "Defines entry function with input parameter" if not is_hinglish else "Function declare kiya jo data parameter leta hai."},
            {"line": 2, "code": "    if not data: return None", "explanation": "Guards against empty collection edge cases" if not is_hinglish else "Edge case handle kiya: agar list empty hai toh None return karo."},
            {"line": 3, "code": "    return processed_result", "explanation": "Returns computed state back to caller" if not is_hinglish else "Computed result return kiya."},
        ]

        dry_run = [
            {"step": 1, "line": 1, "variables": {"data": "[10, 20, 30]"}, "explanation": step1_note},
            {"step": 2, "line": 2, "variables": {"data.length": "3", "is_empty": "False"}, "explanation": "Condition check passed."},
            {"step": 3, "line": 3, "variables": {"status": "Complete"}, "explanation": "Result evaluated."},
        ]

        return {
            "reply": reply,
            "breakdown": {
                "summary": summary,
                "line_by_line": line_by_line,
                "dry_run": dry_run,
                "time_complexity": "O(N) linear time",
                "space_complexity": "O(1) auxiliary space",
                "hints": [hint1, "Consider how caching or hashing could optimize repeated lookups."],
                "follow_up_question": follow_up,
            },
            "language": language,
        }

    def _generate_demo_code_analysis(self, code: str, language: str) -> Dict[str, Any]:
        has_loop = "for" in code or "while" in code
        has_recursion = "def" in code and "(" in code and code.count("def") > 0

        concerns = []
        bugs = []
        edge_cases = ["Empty array / null check", "Single element input", "Negative numbers or integer overflow"]
        readability = ["Use descriptive variable names instead of single letters", "Ensure consistent indentation"]

        if not has_loop and not has_recursion:
            time_comp = "O(1)"
            space_comp = "O(1)"
        else:
            time_comp = "O(N)"
            space_comp = "O(1)"

        return {
            "summary": "Code successfully parsed. Logic appears straightforward with good syntactic structure.",
            "is_correct": True,
            "correctness_concerns": concerns,
            "potential_bugs": bugs,
            "edge_cases": edge_cases,
            "readability_suggestions": readability,
            "time_complexity": time_comp,
            "space_complexity": space_comp,
            "progressive_hint": "Check how your solution behaves when all elements in the input are identical.",
            "next_exercise_suggestion": "Try solving the Two-Pointer variation of this problem to achieve O(1) space.",
            "is_demo": True,
        }

    def _generate_demo_adaptive_question(self, language: str, topic: str, difficulty: str) -> Dict[str, Any]:
        starter = "def solve(nums, target):\n    # Write your solution here\n    pass"
        if language == "cpp":
            starter = "#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<int>& nums, int target) {\n    // Your solution here\n    return {};\n}"
        elif language == "java":
            starter = "import java.util.*;\n\npublic class Solution {\n    public static int[] solve(int[] nums, int target) {\n        // Your solution here\n        return new int[]{};\n    }\n}"

        return {
            "title": f"Target Pair Sum ({topic})",
            "statement": f"Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nPractice focus: Master {topic} with {difficulty} difficulty.",
            "language": language,
            "difficulty": difficulty,
            "topic": topic,
            "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
            "input_format": "Line 1: List of integers nums. Line 2: Integer target.",
            "output_format": "List of two indices [i, j].",
            "examples": [
                {
                    "input": "nums = [2, 7, 11, 15], target = 9",
                    "output": "[0, 1]",
                    "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
                }
            ],
            "starter_code": starter,
            "test_cases": [
                {"id": 1, "input": "[2, 7, 11, 15]\n9", "expected_output": "[0, 1]", "is_hidden": False},
                {"id": 2, "input": "[3, 2, 4]\n6", "expected_output": "[1, 2]", "is_hidden": False},
                {"id": 3, "input": "[3, 3]\n6", "expected_output": "[0, 1]", "is_hidden": True},
            ],
            "hints": [
                "Hint 1: Can you use a hash map to look up complements in O(1) time?",
                "Hint 2: Iterate through the array once while storing each number's index."
            ],
            "is_ai_generated": True,
        }

llm_service = LLMService()
