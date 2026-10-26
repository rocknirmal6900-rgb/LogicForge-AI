from fastapi import APIRouter, Depends
from app.schemas.rag import RAGSearchRequest, RAGQueryResponse, CitationSchema
from app.services.rag.knowledge_base import rag_service

router = APIRouter(prefix="/rag", tags=["RAG Knowledge Base"])

@router.post("/query", response_model=RAGQueryResponse)
def query_rag_knowledge(data: RAGSearchRequest):
    result = rag_service.query_rag(
        query=data.query,
        language=data.language or "python",
    )

    citations = [
        CitationSchema(
            doc_id=c["doc_id"],
            title=c["title"],
            section=c["section"],
            snippet=c["snippet"],
            url=c.get("url"),
        )
        for c in result.get("citations", [])
    ]

    return RAGQueryResponse(
        answer=result["answer"],
        citations=citations,
        grounded=result["grounded"],
        is_demo=result.get("is_demo", False),
    )

@router.get("/documents")
def list_knowledge_documents():
    return [
        {
            "doc_id": d["doc_id"],
            "title": d["title"],
            "section": d["section"],
            "url": d["url"],
            "preview": d["content"][:160] + "...",
        }
        for d in rag_service.documents
    ]
