from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class CodeSubmitRequest(BaseModel):
    code: str
    language: str = "python"
    problem_id: Optional[int] = None
    stdin: Optional[str] = ""

class TestResultSchema(BaseModel):
    test_case_id: int
    passed: bool
    input: str
    expected: str
    actual: str

class CodeExecutionResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: float
    status: str  # passed, failed, syntax_error, runtime_error, timeout, sandbox_disabled
    test_results: Optional[List[TestResultSchema]] = None
    is_sandboxed: bool = True

class CodeAnalysisFeedback(BaseModel):
    summary: str
    is_correct: bool
    correctness_concerns: List[str] = []
    potential_bugs: List[str] = []
    edge_cases: List[str] = []
    readability_suggestions: List[str] = []
    time_complexity: str = "O(1)"
    space_complexity: str = "O(1)"
    progressive_hint: str = ""
    next_exercise_suggestion: str = ""
    is_demo: bool = False
    is_fallback: bool = False
    model_used: Optional[str] = None

class CodeSubmitResponse(BaseModel):
    execution: CodeExecutionResponse
    analysis: Optional[CodeAnalysisFeedback] = None
    static_checks: List[str] = []
