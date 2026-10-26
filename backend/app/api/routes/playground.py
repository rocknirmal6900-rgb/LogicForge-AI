from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
from app.models.problem import Problem, ProblemAttempt
from app.schemas.code_analysis import CodeSubmitRequest, CodeExecutionResponse
from app.services.code_exec.safe_runner import code_runner
from app.services.adaptive.mastery_calc import compute_topic_mastery

router = APIRouter(prefix="/playground", tags=["Code Playground"])

@router.post("/execute", response_model=CodeExecutionResponse)
def execute_code(
    data: CodeSubmitRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    # If problem_id is provided, evaluate against the problem test cases
    if data.problem_id:
        problem = db.query(Problem).filter(Problem.id == data.problem_id).first()
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found.")

        result = code_runner.run_test_cases(
            code=data.code,
            language=data.language,
            test_cases=problem.test_cases or [],
        )

        # Record attempt if user is authenticated
        if current_user:
            attempt = ProblemAttempt(
                user_id=current_user.id,
                problem_id=problem.id,
                code=data.code,
                language=data.language,
                status=result["status"],
                execution_time_ms=result["execution_time_ms"],
                test_results=result.get("test_results"),
            )
            db.add(attempt)
            db.commit()

            # Find matching topic ID to recompute mastery
            from app.models.topic import Topic
            topic_obj = db.query(Topic).filter(Topic.title == problem.topic).first()
            if topic_obj:
                compute_topic_mastery(db, current_user.id, topic_obj.id)

        return CodeExecutionResponse(
            stdout=result["stdout"],
            stderr=result["stderr"],
            exit_code=result["exit_code"],
            execution_time_ms=result["execution_time_ms"],
            status=result["status"],
            test_results=result.get("test_results"),
            is_sandboxed=result.get("is_sandboxed", True),
        )

    # General playground execution with stdin
    if data.language == "python":
        exec_res = code_runner.execute_python(data.code, stdin=data.stdin or "")
    elif data.language == "cpp":
        exec_res = code_runner.execute_cpp(data.code, stdin=data.stdin or "")
    else:
        exec_res = code_runner.execute_python(data.code, stdin=data.stdin or "")

    return CodeExecutionResponse(
        stdout=exec_res["stdout"],
        stderr=exec_res["stderr"],
        exit_code=exec_res["exit_code"],
        execution_time_ms=exec_res["execution_time_ms"],
        status=exec_res["status"],
        test_results=None,
        is_sandboxed=exec_res.get("is_sandboxed", True),
    )
