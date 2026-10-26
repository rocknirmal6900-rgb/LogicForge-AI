from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, ConfigDict

class TestCaseSchema(BaseModel):
    id: int
    input: str
    expected_output: str
    is_hidden: bool = False

class ExampleSchema(BaseModel):
    input: str
    output: str
    explanation: Optional[str] = None

class CodingProblemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    language: str
    topic: str
    difficulty: str
    statement: str
    constraints: List[str] = []
    input_format: str = ""
    output_format: str = ""
    examples: List[ExampleSchema] = []
    starter_code: str = ""
    test_cases: List[TestCaseSchema] = []
    hints: List[str] = []
    is_ai_generated: bool = False
    solved: bool = False

class QuestionGenRequest(BaseModel):
    language: str = "python"
    topic: str = "Arrays & Hashing"
    difficulty: Optional[Literal["easy", "medium", "hard"]] = None
    count: int = 1
    adapt_to_user_history: bool = True
