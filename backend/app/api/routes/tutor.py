from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.chat import ChatMessage
from app.models.ai_usage import AIUsageRecord
from app.schemas.tutor import TutorChatRequest, TutorChatResponse
from app.services.llm.provider import llm_service

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])

@router.post("/chat", response_model=TutorChatResponse)
def chat_with_ai_tutor(
    data: TutorChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    explanation_lang = data.preferred_language_style or "english"
    if current_user and current_user.preferences:
        explanation_lang = data.preferred_language_style or current_user.preferences.explanation_language

    # Save user message to database if user is logged in
    if current_user:
        user_msg = ChatMessage(
            user_id=current_user.id,
            session_id=data.session_id or "default",
            role="user",
            content=data.message,
            code_snippet=data.code_snippet,
            language=data.language or "python",
        )
        db.add(user_msg)
        db.commit()

    # Call LLM service
    result = llm_service.chat_with_tutor(
        message=data.message,
        code_snippet=data.code_snippet,
        language=data.language or "python",
        explanation_language=explanation_lang,
        quick_action=data.quick_action,
    )

    # Save assistant reply to database
    if current_user:
        bot_msg = ChatMessage(
            user_id=current_user.id,
            session_id=data.session_id or "default",
            role="assistant",
            content=result.get("reply", ""),
            breakdown_json=result.get("breakdown"),
            language=data.language or "python",
        )
        db.add(bot_msg)

        # Record AI usage
        usage = AIUsageRecord(
            user_id=current_user.id,
            feature="tutor",
            latency_ms=result.get("latency_ms", 0.0),
            is_demo=result.get("is_demo", False),
        )
        db.add(usage)
        db.commit()

    return TutorChatResponse(
        reply=result.get("reply", ""),
        breakdown=result.get("breakdown"),
        language=result.get("language", "python"),
        is_demo=result.get("is_demo", False),
        is_fallback=result.get("is_fallback", False),
        model_used=result.get("model_used", "gemini-1.5-flash"),
        tokens_used=result.get("tokens_used"),
    )

@router.get("/history")
def get_tutor_history(
    session_id: str = "default",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id, ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "code_snippet": m.code_snippet,
            "language": m.language,
            "explanation_breakdown": m.breakdown_json,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]
