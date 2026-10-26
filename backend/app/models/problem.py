from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    language = Column(String(50), nullable=False)        # python, cpp, java
    topic = Column(String(100), index=True, nullable=False)
    difficulty = Column(String(50), nullable=False)     # easy, medium, hard
    statement = Column(Text, nullable=False)
    constraints = Column(JSON, default=list)            # List[str]
    input_format = Column(Text, default="")
    output_format = Column(Text, default="")
    examples = Column(JSON, default=list)               # List[{input, output, explanation}]
    starter_code = Column(Text, default="")
    test_cases = Column(JSON, default=list)             # List[{id, input, expected_output, is_hidden}]
    hints = Column(JSON, default=list)                  # List[str]
    is_ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    attempts = relationship("ProblemAttempt", back_populates="problem", cascade="all, delete-orphan")

class ProblemAttempt(Base):
    __tablename__ = "problem_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)         # passed, failed, syntax_error, runtime_error, timeout
    execution_time_ms = Column(Float, default=0.0)
    hints_used = Column(Integer, default=0)
    test_results = Column(JSON, default=list)
    ai_feedback = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="attempts")
    problem = relationship("Problem", back_populates="attempts")
