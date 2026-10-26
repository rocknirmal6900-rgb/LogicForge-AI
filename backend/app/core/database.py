import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

database_url = settings.DATABASE_URL
if os.getenv("VERCEL"):
    if database_url.startswith("sqlite"):
        raise RuntimeError("Vercel deployments require a persistent PostgreSQL DATABASE_URL.")
    if settings.SECRET_KEY == "logicforge-super-secret-key-change-in-production-2026":
        raise RuntimeError("Set a unique SECRET_KEY in the Vercel environment before deploying.")

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Configure SQLite or PostgreSQL engine parameters
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
