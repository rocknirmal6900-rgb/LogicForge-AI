from typing import List, Optional
from pydantic import BaseModel

class CitationSchema(BaseModel):
    doc_id: str
    title: str
    section: str
    snippet: str
    url: Optional[str] = None

class RAGSearchRequest(BaseModel):
    query: str
    language: Optional[str] = "python"
    max_citations: int = 3

class RAGQueryResponse(BaseModel):
    answer: str
    citations: List[CitationSchema] = []
    grounded: bool
    is_demo: bool = False
