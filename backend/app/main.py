from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.api_router import api_router
from app.services.adaptive.curator import seed_curriculum_if_needed

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if not exist
    Base.metadata.create_all(bind=engine)

    # Seed curriculum topics and practice questions
    db = SessionLocal()
    try:
        seed_curriculum_if_needed(db)
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Portfolio-grade Generative AI coding mentor backend.",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": settings.DATABASE_URL.split("://")[0],
    }

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX,
    }
