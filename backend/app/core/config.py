import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "LogicForge — AI Coding Mentor"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Database: SQLite fallback for instant zero-dependency local run; PostgreSQL supported
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./logicforge.db")

    # JWT Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "logicforge-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # LLM Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "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")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # "gemini" | "groq" | "openai" | "demo"
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # Code Execution Sandbox
    SANDBOX_ENABLED: bool = True
    EXECUTION_TIMEOUT_SECONDS: int = 5
    MAX_OUTPUT_BYTES: int = 10240  # 10 KB

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

settings = Settings()
