import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.problem import Problem, ProblemAttempt
from app.models.ai_usage import AIUsageRecord
from app.schemas.question import (
    CodingProblemResponse,
    QuestionGenRequest,
    ExampleSchema,
    TestCaseSchema,
)
from app.services.llm.provider import llm_service

router = APIRouter(prefix="/questions", tags=["Practice & Adaptive Questions"])

@router.get("/list", response_model=List[CodingProblemResponse])
def list_practice_problems(
    language: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Problem)
    if language:
        query = query.filter(Problem.language == language)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)

    problems = query.order_by(Problem.id.asc()).all()

    solved_ids = set()
    if current_user:
        passed_attempts = (
            db.query(ProblemAttempt.problem_id)
            .filter(ProblemAttempt.user_id == current_user.id, ProblemAttempt.status == "passed")
            .distinct()
            .all()
        )
        solved_ids = {p[0] for p in passed_attempts}

    result = []
    for p in problems:
        result.append(
            CodingProblemResponse(
                id=p.id,
                title=p.title,
                slug=p.slug,
                language=p.language,
                topic=p.topic,
                difficulty=p.difficulty,
                statement=p.statement,
                constraints=p.constraints or [],
                input_format=p.input_format or "",
                output_format=p.output_format or "",
                examples=[ExampleSchema(**e) for e in (p.examples or [])],
                starter_code=p.starter_code or "",
                test_cases=[TestCaseSchema(**tc) for tc in (p.test_cases or [])],
                hints=p.hints or [],
                is_ai_generated=p.is_ai_generated or False,
                solved=p.id in solved_ids,
            )
        )
    return result

@router.get("/{problem_id}", response_model=CodingProblemResponse)
def get_problem_by_id(
    problem_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(Problem).filter(Problem.id == problem_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Problem not found.")

    is_solved = False
    if current_user:
        is_solved = (
            db.query(ProblemAttempt)
            .filter(
                ProblemAttempt.user_id == current_user.id,
                ProblemAttempt.problem_id == p.id,
                ProblemAttempt.status == "passed"
            )
            .count() > 0
        )

    return CodingProblemResponse(
        id=p.id,
        title=p.title,
        slug=p.slug,
        language=p.language,
        topic=p.topic,
        difficulty=p.difficulty,
        statement=p.statement,
        constraints=p.constraints or [],
        input_format=p.input_format or "",
        output_format=p.output_format or "",
        examples=[ExampleSchema(**e) for e in (p.examples or [])],
        starter_code=p.starter_code or "",
        test_cases=[TestCaseSchema(**tc) for tc in (p.test_cases or [])],
        hints=p.hints or [],
        is_ai_generated=p.is_ai_generated or False,
        solved=is_solved,
    )

@router.post("/generate", response_model=CodingProblemResponse)
def generate_adaptive_question(
    data: QuestionGenRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    # Determine adaptive difficulty from user history
    target_difficulty = data.difficulty or "easy"
    user_context = "New student session"

    if current_user and data.adapt_to_user_history:
        attempts = (
            db.query(ProblemAttempt)
            .filter(ProblemAttempt.user_id == current_user.id)
            .order_by(ProblemAttempt.created_at.desc())
            .limit(5)
            .all()
        )
        if attempts:
            passed = sum(1 for a in attempts if a.status == "passed")
            if passed >= 4:
                target_difficulty = "medium" if target_difficulty == "easy" else "hard"
                user_context = f"Student has high success rate ({passed}/5 recent passed). Increasing difficulty."
            elif passed <= 1:
                target_difficulty = "easy"
                user_context = f"Student had recent challenges ({passed}/5 recent passed). Providing foundational reinforcement."

    # Generate question from LLM service
    gen = llm_service.generate_question(
        language=data.language,
        topic=data.topic,
        difficulty=target_difficulty,
        user_history_note=user_context,
    )

    # Validate generated question structure
    title = gen.get("title", f"Challenge on {data.topic}")
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    slug = f"{slug}-{int(db.query(Problem).count() + 1)}"

    problem = Problem(
        title=title,
        slug=slug,
        language=data.language,
        topic=data.topic,
        difficulty=target_difficulty,
        statement=gen.get("statement", "Solve the challenge described below."),
        constraints=gen.get("constraints", []),
        input_format=gen.get("input_format", ""),
        output_format=gen.get("output_format", ""),
        examples=gen.get("examples", []),
        starter_code=gen.get("starter_code", ""),
        test_cases=gen.get("test_cases", []),
        hints=gen.get("hints", []),
        is_ai_generated=True,
    )
    db.add(problem)

    if current_user:
        usage = AIUsageRecord(
            user_id=current_user.id,
            feature="question_gen",
            is_demo=not llm_service.is_live_available(),
        )
        db.add(usage)

    db.commit()
    db.refresh(problem)

    return CodingProblemResponse(
        id=problem.id,
        title=problem.title,
        slug=problem.slug,
        language=problem.language,
        topic=problem.topic,
        difficulty=problem.difficulty,
        statement=problem.statement,
        constraints=problem.constraints or [],
        input_format=problem.input_format or "",
        output_format=problem.output_format or "",
        examples=[ExampleSchema(**e) for e in (problem.examples or [])],
        starter_code=problem.starter_code or "",
        test_cases=[TestCaseSchema(**tc) for tc in (problem.test_cases or [])],
        hints=problem.hints or [],
        is_ai_generated=True,
        solved=False,
    )
