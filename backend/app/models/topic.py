from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)  # python, cpp, java
    icon = Column(String(50), default="Code")
    sort_order = Column(Integer, default=0)

    lessons = relationship("Lesson", back_populates="topic", cascade="all, delete-orphan", order_by="Lesson.sort_order")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    language = Column(String(50), nullable=False)
    objectives = Column(JSON, default=list)            # List[str]
    content_markdown = Column(Text, nullable=False)
    code_example = Column(Text, default="")
    line_by_line = Column(JSON, default=list)          # List[{line: int, code: str, explanation: str}]
    dry_run_data = Column(JSON, default=list)          # List[{step: int, state: dict, note: str}]
    common_mistakes = Column(JSON, default=list)       # List[str]
    quiz = Column(JSON, default=list)                  # List[{id, question, options, correct_index, explanation}]
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    topic = relationship("Topic", back_populates="lessons")

class UserLessonProgress(Base):
    __tablename__ = "user_lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    completed = Column(Boolean, default=False)
    quiz_score = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
