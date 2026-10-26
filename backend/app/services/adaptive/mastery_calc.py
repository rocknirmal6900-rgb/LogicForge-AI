from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.problem import ProblemAttempt, Problem
from app.models.topic import UserLessonProgress, Lesson, Topic
from app.models.mastery import TopicMastery

MASTERY_EXPLANATION = (
    "Mastery Score = (50% * Test Pass Rate) + (30% * (1 - Hint Penalty)) + (20% * Concept Quiz Score). "
    "Penalties scale gently with hint usage (15% per hint, max 60% penalty) to encourage independent problem solving."
)

def compute_topic_mastery(db: Session, user_id: int, topic_id: int) -> float:
    """Computes transparent mastery score for a given topic."""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        return 0.0

    # 1. Problem attempts on this topic
    attempts = (
        db.query(ProblemAttempt)
        .join(Problem)
        .filter(ProblemAttempt.user_id == user_id, Problem.topic == topic.title)
        .all()
    )

    total_attempts = len(attempts)
    passed_attempts = sum(1 for a in attempts if a.status == "passed")
    pass_rate = (passed_attempts / total_attempts * 100.0) if total_attempts > 0 else 0.0

    # Hint penalty calculation
    total_hints = sum(a.hints_used for a in attempts)
    avg_hints = (total_hints / total_attempts) if total_attempts > 0 else 0.0
    hint_penalty = min(0.60, avg_hints * 0.15)
    hint_component = max(0.0, 1.0 - hint_penalty) * 100.0

    # 2. Quiz scores on lessons in this topic
    lesson_ids = [l.id for l in topic.lessons]
    progresses = (
        db.query(UserLessonProgress)
        .filter(
            UserLessonProgress.user_id == user_id,
            UserLessonProgress.lesson_id.in_(lesson_ids)
        )
        .all()
    )

    quiz_scores = [p.quiz_score for p in progresses if p.quiz_score > 0]
    avg_quiz = (sum(quiz_scores) / len(quiz_scores)) if quiz_scores else (50.0 if progresses else 0.0)

    # If user hasn't attempted problems yet, base score on quiz/completed lessons
    if total_attempts == 0 and not progresses:
        mastery = 0.0
    elif total_attempts == 0:
        mastery = round(avg_quiz * 0.8, 1)
    else:
        mastery = round(
            (0.50 * pass_rate) + (0.30 * hint_component) + (0.20 * avg_quiz),
            1
        )

    mastery = max(0.0, min(100.0, mastery))

    # Update or insert TopicMastery record
    tm = db.query(TopicMastery).filter(
        TopicMastery.user_id == user_id,
        TopicMastery.topic_id == topic_id
    ).first()

    if not tm:
        tm = TopicMastery(
            user_id=user_id,
            topic_id=topic_id,
            mastery_score=mastery,
            problems_solved=passed_attempts,
            total_attempts=total_attempts,
            quiz_score=avg_quiz
        )
        db.add(tm)
    else:
        tm.mastery_score = mastery
        tm.problems_solved = passed_attempts
        tm.total_attempts = total_attempts
        tm.quiz_score = avg_quiz

    db.commit()
    return mastery
