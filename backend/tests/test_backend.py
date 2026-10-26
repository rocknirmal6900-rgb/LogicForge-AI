import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.services.code_exec.safe_runner import code_runner
from app.services.adaptive.curator import seed_curriculum_if_needed

# Use StaticPool with sqlite:///:memory: so all connections share the same in-memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables and seed starter curriculum
Base.metadata.create_all(bind=engine)
test_db = TestingSessionLocal()
seed_curriculum_if_needed(test_db)
test_db.close()

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_healthcheck():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_registration_and_login():
    email = "tester@logicforge.dev"
    password = "SecurePassword123!"
    full_name = "Dev Tester"

    # Register
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "full_name": full_name,
    })
    assert reg_res.status_code == 200
    token_data = reg_res.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == email

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Get profile
    token = login_res.json()["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

def test_preferences_update():
    token = create_access_token(data={"sub": "tester@logicforge.dev"})
    res = client.post(
        "/api/users/preferences",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "preferred_language": "cpp",
            "experience_level": "intermediate",
            "goal": "dsa",
            "explanation_language": "hinglish"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["preferences"]["preferred_language"] == "cpp"
    assert data["preferences"]["explanation_language"] == "hinglish"

def test_safe_code_runner_python():
    code = "x = 10\ny = 25\nprint(x + y)"
    res = code_runner.execute_python(code)
    assert res["status"] == "passed"
    assert res["stdout"].strip() == "35"
    assert res["exit_code"] == 0

def test_safe_code_runner_timeout_infinite_loop():
    code = "while True: pass"
    old_timeout = code_runner.timeout
    code_runner.timeout = 1
    res = code_runner.execute_python(code)
    code_runner.timeout = old_timeout
    assert res["status"] == "timeout"
    assert "timed out" in res["stderr"]

def test_ai_tutor_chat_and_dry_run():
    res = client.post("/api/tutor/chat", json={
        "message": "Explain binary search and show a dry run with array [2, 4, 6, 8, 10]",
        "language": "python",
        "preferred_language_style": "english"
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert data["model_used"] != ""

def test_code_analysis_endpoint():
    code = "def add(a, b):\n    return a + b\n"
    res = client.post("/api/analysis/submit", json={
        "code": code,
        "language": "python"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["execution"]["status"] == "passed"
    assert "analysis" in data
    assert data["analysis"]["time_complexity"] != ""

def test_rag_knowledge_base():
    res = client.post("/api/rag/query", json={
        "query": "What is Python memory model and object identity?",
        "language": "python"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["grounded"] is True
    assert len(data["citations"]) > 0
    assert data["citations"][0]["doc_id"] == "py-doc-memory-01"

def test_practice_question_list():
    res = client.get("/api/questions/list")
    assert res.status_code == 200
    problems = res.json()
    assert isinstance(problems, list)
    assert len(problems) > 0
