from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserPreference
from app.models.problem import ProblemAttempt
from app.models.mastery import TopicMastery
from app.models.chat import ChatMessage, LearningSession
from app.models.topic import UserLessonProgress
from app.schemas.auth import UserPreferenceUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users & Preferences"])

@router.post("/preferences", response_model=UserResponse)
def update_user_preferences(
    data: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            preferred_language=data.preferred_language,
            experience_level=data.experience_level,
            goal=data.goal,
            explanation_language=data.explanation_language,
        )
        db.add(pref)
    else:
        pref.preferred_language = data.preferred_language
        pref.experience_level = data.experience_level
        pref.goal = data.goal
        pref.explanation_language = data.explanation_language
        pref.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.post("/reset-history")
def reset_learning_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Resets all problem attempts, quiz scores, and topic mastery for the user."""
    db.query(ProblemAttempt).filter(ProblemAttempt.user_id == current_user.id).delete()
    db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).delete()
    db.query(UserLessonProgress).filter(UserLessonProgress.user_id == current_user.id).delete()
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.query(LearningSession).filter(LearningSession.user_id == current_user.id).delete()
    db.commit()

    return {"message": "Learning history successfully reset.", "user_id": current_user.id}
