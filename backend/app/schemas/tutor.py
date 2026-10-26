from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel

class LineExplanation(BaseModel):
    line: int
    code: str
    explanation: str

class DryRunStep(BaseModel):
    step: int
    line: int
    variables: Dict[str, Any]
    explanation: str

class ExplanationBreakdown(BaseModel):
    summary: str
    line_by_line: Optional[List[LineExplanation]] = None
    dry_run: Optional[List[DryRunStep]] = None
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    hints: Optional[List[str]] = None
    follow_up_question: Optional[str] = None

class TutorChatRequest(BaseModel):
    message: str
    code_snippet: Optional[str] = None
    language: Optional[str] = "python"
    session_id: Optional[str] = "default"
    quick_action: Optional[Literal[
        "explain_simply",
        "give_example",
        "show_dry_run",
        "give_hint",
        "ask_question",
        "explain_error"
    ]] = None
    preferred_language_style: Optional[Literal["english", "hinglish"]] = None

class TutorChatResponse(BaseModel):
    reply: str
    breakdown: Optional[ExplanationBreakdown] = None
    language: str = "python"
    is_demo: bool = False
    is_fallback: bool = False
    model_used: str = "gemini-1.5-flash"
    tokens_used: Optional[int] = None
