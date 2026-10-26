import ast
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
from app.models.ai_usage import AIUsageRecord
from app.schemas.code_analysis import (
    CodeSubmitRequest,
    CodeSubmitResponse,
    CodeExecutionResponse,
    CodeAnalysisFeedback,
)
from app.services.code_exec.safe_runner import code_runner
from app.services.llm.provider import llm_service

router = APIRouter(prefix="/analysis", tags=["AI Code Analysis"])

def run_static_ast_checks(code: str, language: str) -> List[str]:
    """Perform deterministic AST syntax and code quality checks without AI."""
    findings = []
    if language == "python":
        try:
            tree = ast.parse(code)
            # Check for bare excepts
            for node in ast.walk(tree):
                if isinstance(node, ast.ExceptHandler) and node.type is None:
                    findings.append("Static check: Bare 'except:' clause detected. Specify explicit exception types.")
                if isinstance(node, ast.FunctionDef) and not node.body:
                    findings.append(f"Static check: Empty function body in '{node.name}'.")
        except SyntaxError as e:
            findings.append(f"Static syntax failure: Line {e.lineno} - {e.msg}")
        except Exception:
            pass
    return findings

@router.post("/submit", response_model=CodeSubmitResponse)
def submit_and_analyze_code(
    data: CodeSubmitRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    # 1. Deterministic AST checks
    static_findings = run_static_ast_checks(data.code, data.language)

    # 2. Deterministic execution
    if data.language == "python":
        exec_res = code_runner.execute_python(data.code, stdin=data.stdin or "")
    elif data.language == "cpp":
        exec_res = code_runner.execute_cpp(data.code, stdin=data.stdin or "")
    else:
        exec_res = code_runner.execute_python(data.code, stdin=data.stdin or "")

    execution = CodeExecutionResponse(
        stdout=exec_res["stdout"],
        stderr=exec_res["stderr"],
        exit_code=exec_res["exit_code"],
        execution_time_ms=exec_res["execution_time_ms"],
        status=exec_res["status"],
        is_sandboxed=exec_res.get("is_sandboxed", True),
    )

    # 3. LLM semantic analysis
    ai_raw = llm_service.analyze_code(data.code, data.language)

    analysis = CodeAnalysisFeedback(
        summary=ai_raw.get("summary", "Code analysis complete."),
        is_correct=ai_raw.get("is_correct", execution.status == "passed"),
        correctness_concerns=ai_raw.get("correctness_concerns", []),
        potential_bugs=ai_raw.get("potential_bugs", []),
        edge_cases=ai_raw.get("edge_cases", []),
        readability_suggestions=ai_raw.get("readability_suggestions", []),
        time_complexity=ai_raw.get("time_complexity", "O(1)"),
        space_complexity=ai_raw.get("space_complexity", "O(1)"),
        progressive_hint=ai_raw.get("progressive_hint", "Check boundary edge cases."),
        next_exercise_suggestion=ai_raw.get("next_exercise_suggestion", "Try the optimized variation."),
        is_demo=ai_raw.get("is_demo", False),
        is_fallback=ai_raw.get("is_fallback", False),
        model_used=ai_raw.get("model_used"),
    )

    if current_user:
        usage = AIUsageRecord(
            user_id=current_user.id,
            feature="code_analysis",
            latency_ms=ai_raw.get("latency_ms", 0.0),
            is_demo=ai_raw.get("is_demo", False),
        )
        db.add(usage)
        db.commit()

    return CodeSubmitResponse(
        execution=execution,
        analysis=analysis,
        static_checks=static_findings,
    )
