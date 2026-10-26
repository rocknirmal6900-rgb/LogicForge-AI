from fastapi import APIRouter
from app.api.routes import (
    auth,
    users,
    tutor,
    concepts,
    playground,
    code_analysis,
    questions,
    progress,
    bookmarks,
    rag,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(tutor.router)
api_router.include_router(concepts.router)
api_router.include_router(playground.router)
api_router.include_router(code_analysis.router)
api_router.include_router(questions.router)
api_router.include_router(progress.router)
api_router.include_router(bookmarks.router)
api_router.include_router(rag.router)
