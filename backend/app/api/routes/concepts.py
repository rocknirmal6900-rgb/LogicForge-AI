from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.topic import Topic, Lesson, UserLessonProgress
from app.models.mastery import TopicMastery
from app.services.adaptive.mastery_calc import compute_topic_mastery

router = APIRouter(prefix="/concepts", tags=["Learn Concepts"])

@router.get("/topics")
def list_topics(
    language: Optional[str] = Query(None, description="python, cpp, or java"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Topic)
    if language:
        query = query.filter(Topic.language == language)
    topics = query.order_by(Topic.sort_order.asc()).all()

    result = []
    for t in topics:
        completed_count = 0
        mastery_score = 0.0

        if current_user:
            lesson_ids = [l.id for l in t.lessons]
            completed_count = (
                db.query(UserLessonProgress)
                .filter(
                    UserLessonProgress.user_id == current_user.id,
                    UserLessonProgress.lesson_id.in_(lesson_ids),
                    UserLessonProgress.completed == True,
                )
                .count()
            )
            tm = db.query(TopicMastery).filter(
                TopicMastery.user_id == current_user.id,
                TopicMastery.topic_id == t.id
            ).first()
            if tm:
                mastery_score = tm.mastery_score

        result.append({
            "id": t.id,
            "slug": t.slug,
            "title": t.title,
            "description": t.description,
            "language": t.language,
            "icon": t.icon,
            "lessons_count": len(t.lessons),
            "completed_lessons_count": completed_count,
            "mastery_percentage": mastery_score,
            "lessons": [
                {"id": l.id, "slug": l.slug, "title": l.title}
                for l in t.lessons
            ]
        })
    return result

@router.get("/lessons/{slug}")
def get_lesson_detail(
    slug: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    lesson = db.query(Lesson).filter(Lesson.slug == slug).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    is_completed = False
    quiz_score = 0
    if current_user:
        prog = db.query(UserLessonProgress).filter(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson.id,
        ).first()
        if prog:
            is_completed = prog.completed
            quiz_score = prog.quiz_score

    return {
        "id": lesson.id,
        "topic_id": lesson.topic_id,
        "topic_title": lesson.topic.title,
        "slug": lesson.slug,
        "title": lesson.title,
        "language": lesson.language,
        "objectives": lesson.objectives or [],
        "content_markdown": lesson.content_markdown,
        "code_example": lesson.code_example or "",
        "line_by_line": lesson.line_by_line or [],
        "dry_run_data": lesson.dry_run_data or [],
        "common_mistakes": lesson.common_mistakes or [],
        "quiz": lesson.quiz or [],
        "is_completed": is_completed,
        "quiz_score": quiz_score,
    }

@router.post("/lessons/{lesson_id}/complete")
def mark_lesson_complete(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    prog = db.query(UserLessonProgress).filter(
        UserLessonProgress.user_id == current_user.id,
        UserLessonProgress.lesson_id == lesson_id,
    ).first()

    if not prog:
        prog = UserLessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            completed=True,
            completed_at=datetime.now(timezone.utc),
        )
        db.add(prog)
    else:
        prog.completed = True
        prog.completed_at = datetime.now(timezone.utc)

    db.commit()
    compute_topic_mastery(db, current_user.id, lesson.topic_id)
    return {"message": "Lesson marked as completed", "lesson_id": lesson_id}

@router.post("/lessons/{lesson_id}/quiz")
def submit_quiz_answer(
    lesson_id: int,
    answers: dict,  # {question_id: selected_index}
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson or not lesson.quiz:
        raise HTTPException(status_code=404, detail="Lesson or quiz not found.")

    total_q = len(lesson.quiz)
    correct_count = 0
    feedback = []

    for q in lesson.quiz:
        qid_str = str(q.get("id"))
        user_choice = answers.get(qid_str)
        is_correct = (user_choice == q.get("correct_index"))
        if is_correct:
            correct_count += 1
        feedback.append({
            "question_id": q.get("id"),
            "is_correct": is_correct,
            "correct_index": q.get("correct_index"),
            "explanation": q.get("explanation"),
        })

    score_pct = round((correct_count / total_q) * 100.0, 1)

    prog = db.query(UserLessonProgress).filter(
        UserLessonProgress.user_id == current_user.id,
        UserLessonProgress.lesson_id == lesson_id,
    ).first()

    if not prog:
        prog = UserLessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            quiz_score=int(score_pct),
            completed=score_pct >= 70,
            completed_at=datetime.now(timezone.utc) if score_pct >= 70 else None,
        )
        db.add(prog)
    else:
        prog.quiz_score = max(prog.quiz_score, int(score_pct))
        if score_pct >= 70:
            prog.completed = True

    db.commit()
    compute_topic_mastery(db, current_user.id, lesson.topic_id)

    return {
        "score_percentage": score_pct,
        "correct_count": correct_count,
        "total_questions": total_q,
        "feedback": feedback,
    }
