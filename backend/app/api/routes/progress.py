from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.problem import ProblemAttempt, Problem
from app.models.mastery import TopicMastery
from app.models.topic import Topic, UserLessonProgress
from app.schemas.progress import (
    ProgressSummaryResponse,
    TopicMasterySchema,
    RecentActivityItem,
    WeakTopicRecommendation,
)
from app.services.adaptive.mastery_calc import MASTERY_EXPLANATION

router = APIRouter(prefix="/progress", tags=["Progress & Analytics"])

def calculate_real_streak(db: Session, user_id: int) -> int:
    """Calculates active daily streak from real timestamps in attempts and completed lessons."""
    attempts = db.query(ProblemAttempt.created_at).filter(ProblemAttempt.user_id == user_id).all()
    completions = db.query(UserLessonProgress.completed_at).filter(
        UserLessonProgress.user_id == user_id,
        UserLessonProgress.completed == True,
        UserLessonProgress.completed_at != None
    ).all()

    dates = set()
    for (dt,) in attempts:
        if dt:
            dates.add(dt.date())
    for (dt,) in completions:
        if dt:
            dates.add(dt.date())

    if not dates:
        return 0

    sorted_dates = sorted(list(dates), reverse=True)
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)

    # Streak is active only if user had activity today or yesterday
    if sorted_dates[0] != today and sorted_dates[0] != yesterday:
        return 0

    streak = 1
    current = sorted_dates[0]
    for next_date in sorted_dates[1:]:
        if next_date == current - timedelta(days=1):
            streak += 1
            current = next_date
        elif next_date == current:
            continue
        else:
            break

    return streak

@router.get("/summary", response_model=ProgressSummaryResponse)
def get_progress_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Real solved problems
    solved_problem_ids = (
        db.query(ProblemAttempt.problem_id)
        .filter(ProblemAttempt.user_id == current_user.id, ProblemAttempt.status == "passed")
        .distinct()
        .all()
    )
    problems_solved = len(solved_problem_ids)

    # Real total attempts
    total_attempts = db.query(ProblemAttempt).filter(ProblemAttempt.user_id == current_user.id).count()

    # Accuracy percentage
    accuracy = round((problems_solved / total_attempts * 100.0), 1) if total_attempts > 0 else 0.0

    # Streak
    streak_days = calculate_real_streak(db, current_user.id)

    # Learning hours estimated from attempts and lessons (e.g. 5 mins per attempt + 15 mins per lesson)
    completed_lessons = (
        db.query(UserLessonProgress)
        .filter(UserLessonProgress.user_id == current_user.id, UserLessonProgress.completed == True)
        .count()
    )
    est_minutes = (total_attempts * 6) + (completed_lessons * 15)
    learning_hours = round(est_minutes / 60.0, 1)

    # Recent activity for past 7 days from real records
    today = datetime.now(timezone.utc).date()
    recent_activity = []
    for day_offset in range(6, -1, -1):
        target_date = today - timedelta(days=day_offset)
        day_label = target_date.strftime("%a")

        # Count problems attempted on this date
        start_dt = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
        end_dt = datetime.combine(target_date, datetime.max.time(), tzinfo=timezone.utc)

        day_attempts = (
            db.query(ProblemAttempt)
            .filter(
                ProblemAttempt.user_id == current_user.id,
                ProblemAttempt.created_at >= start_dt,
                ProblemAttempt.created_at <= end_dt
            )
            .count()
        )

        day_hours = round(day_attempts * 0.1, 1)
        recent_activity.append(
            RecentActivityItem(
                day=day_label,
                hours=day_hours,
                problems=day_attempts
            )
        )

    # Topic mastery from real records
    masteries = db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    topic_mastery_list = []
    weak_topics = []

    for tm in masteries:
        topic_obj = db.query(Topic).filter(Topic.id == tm.topic_id).first()
        topic_title = topic_obj.title if topic_obj else "Topic"
        topic_lang = topic_obj.language if topic_obj else "python"

        topic_mastery_list.append(
            TopicMasterySchema(
                topic=topic_title,
                score=tm.mastery_score,
                language=topic_lang,
                problems_solved=tm.problems_solved,
                total_attempts=tm.total_attempts,
            )
        )

        if tm.mastery_score < 50.0 and tm.total_attempts > 0:
            weak_topics.append(
                WeakTopicRecommendation(
                    topic=topic_title,
                    reason=f"Current mastery is {tm.mastery_score}% across {tm.total_attempts} attempts.",
                    suggested_action=f"Review the line-by-line dry runs in '{topic_title}' and request progressive hints.",
                )
            )

    return ProgressSummaryResponse(
        streak_days=streak_days,
        problems_solved=problems_solved,
        total_attempts=total_attempts,
        accuracy_percentage=accuracy,
        learning_hours=learning_hours,
        recent_activity=recent_activity,
        topic_mastery=topic_mastery_list,
        weak_topics=weak_topics,
        mastery_formula_explanation=MASTERY_EXPLANATION,
    )
