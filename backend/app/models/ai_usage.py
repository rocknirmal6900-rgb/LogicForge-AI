from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from app.core.database import Base

class AIUsageRecord(Base):
    __tablename__ = "ai_usage_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    feature = Column(String(50), nullable=False)        # tutor, code_analysis, question_gen, rag
    tokens_prompt = Column(Integer, default=0)
    tokens_completion = Column(Integer, default=0)
    latency_ms = Column(Float, default=0.0)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
