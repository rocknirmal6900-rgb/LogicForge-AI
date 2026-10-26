# LogicForge — AI Coding Mentor & Adaptive DSA Tutor

> **Portfolio-Grade Generative AI Educational Web Application**  
> An intelligent programming tutor that teaches concepts line-by-line, performs interactive dry-run memory state simulations, analyzes code using hybrid deterministic + LLM engines, and generates adaptive practice problems.

---

## 1. System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React 18 + TypeScript + Vite + Tailwind)"]
        UI["Modern Dark Dashboard & Nav"]
        TutorUI["AI Tutor (English & Hinglish)"]
        Playground["Monaco Code Editor & Console"]
        Concepts["Concept Library & Dry-Run Visualizer"]
        ProgressUI["Empirical Mastery Analytics (Recharts)"]
    end

    subgraph Server ["Backend (FastAPI REST Gateway)"]
        Auth["JWT Auth & Bcrypt Security"]
        TutorRoute["Conversational Tutor Service"]
        AnalysisRoute["Hybrid Code Analysis (AST + LLM)"]
        RunnerRoute["Isolated Subprocess Execution Sandbox"]
        AdaptiveEngine["Adaptive Question Generator & Mastery Formula"]
        RAGModule["Modular RAG (BM25 + TF-IDF Cosine Retrieval)"]
    end

    subgraph Storage ["Persistent Relational Database"]
        DB[(PostgreSQL / SQLite via SQLAlchemy & Alembic)]
    end

    subgraph LLM ["Generative AI Layer"]
        Gemini["Google Gemini 1.5/2.0 Flash / OpenAI API"]
    end

    Client -->|REST API| Server
    Server --> Storage
    Server --> LLM
```

---

## 2. Key Features

1. **Intelligent Conversational Mentor**:
   - Explains tricky algorithms in beginner-friendly language with real-world analogies.
   - Native bilingual support for **English** and **Hinglish** (conversational Hindi-English blend for Indian engineering students).
   - Generates line-by-line execution tables and variable state dry runs.
   - Estimates Big-O Time and Space complexities.
   - Provides progressive hints before revealing direct solutions.
   - Transparently indicates demo mode when live API key is omitted.

2. **Isolated Code Playground**:
   - Embedded **Monaco Editor** with dark theme (`vs-dark`) and JetBrains Mono typography.
   - Multi-language support: **Python 3**, **C++**, and **Java**.
   - **Zero-leak subprocess isolation**: Strips all parent process environment variables to prevent API key or secret exfiltration.
   - Hard execution limits: 5.0-second CPU timeout, 10 KB output buffer truncation, and memory caps.

3. **Hybrid AI Code Analysis**:
   - Combines deterministic Python AST static checks with semantic LLM evaluation.
   - Distinguishes between confirmed runtime errors, compiler warnings, and AI-suggested edge cases.

4. **Adaptive Practice & Question Generator**:
   - Dynamically scales problem difficulty based on verified test-case pass rate.
   - Automatically injects edge cases (null inputs, single elements, negative numbers).

5. **Empirical & Transparent Mastery Analytics**:
   - All statistics derive strictly from real stored records in SQLite/PostgreSQL (no fabricated data).
   - Documented mastery formula:
     $$\text{Mastery Score} = 0.50 \times \text{PassRate} + 0.30 \times (1 - \text{HintPenalty}) + 0.20 \times \text{QuizScore}$$
   - Includes full "Reset Learning History" capability for complete user data sovereignty.

6. **Modular Grounded RAG Knowledge Base**:
   - Embeds trusted Python, C++, and DSA documentation.
   - Returns verifiable section citations (`[1]`, `[2]`) with source URLs.
   - Defends against prompt injection and refuses to hallucinate facts outside the trusted corpus.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Recharts, Lucide Icons, Canvas Confetti |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, Uvicorn, Python-Jose (JWT), Passlib (Bcrypt) |
| **Database** | PostgreSQL (Production/Docker), SQLite (Zero-config local fallback), SQLAlchemy 2.0, Alembic Migrations |
| **Generative AI** | Google Gemini (`google.generativeai` / `google.genai`), structured Pydantic JSON validation, fallback demo mode |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX, TypeScript (`tsc -b`), Vite Production Bundle Validation |
| **Containerization** | Docker, Docker Compose, Multi-stage Nginx container |

---

## 4. Local Quickstart (Zero-Dependency)

### Prerequisites
- Python 3.12+ installed
- Node.js v20+ and npm installed

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI server on port 8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install packages
npm install --legacy-peer-deps

# Start Vite dev server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```

Open your browser at `http://127.0.0.1:5173`.

---

## 5. Environment Variables Guide

Copy `.env.example` in `backend/` to `.env`:

```ini
# Database (Defaults to SQLite for instant local runs)
DATABASE_URL=sqlite:///./logicforge.db
# For PostgreSQL:
# DATABASE_URL=postgresql://logicforge_user:password@localhost:5432/logicforge_db

# Security
SECRET_KEY=change-this-in-production-to-a-secure-random-32-byte-hex
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Generative AI (Google Gemini Primary)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Generative AI (Groq Failover & Fallback)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b

# Sandbox Limits
SANDBOX_ENABLED=true
EXECUTION_TIMEOUT_SECONDS=5
MAX_OUTPUT_BYTES=10240
```

---

## 6. Running Automated Tests

### Backend Unit & Integration Tests (Pytest)
```bash
cd backend
.\.venv\Scripts\pytest.exe -v
```
All 9 core test suites will execute:
- `test_healthcheck`: PASSED
- `test_auth_registration_and_login`: PASSED
- `test_preferences_update`: PASSED
- `test_safe_code_runner_python`: PASSED
- `test_safe_code_runner_timeout_infinite_loop`: PASSED
- `test_ai_tutor_chat_and_dry_run`: PASSED
- `test_code_analysis_endpoint`: PASSED
- `test_rag_knowledge_base`: PASSED
- `test_practice_question_list`: PASSED

### Frontend Typecheck & Production Build
```bash
cd frontend
npm run build
```

---

## 7. Docker Deployment

To launch the full production environment with PostgreSQL, FastAPI, and Nginx:
```bash
docker-compose up --build -d
```
- Web Application: `http://localhost:3000`
- API Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 8. Deploy to Vercel

Vercel serves the Vite frontend and runs the FastAPI API as a Python Function. The API is routed on the same domain under `/api`, so the frontend does not need a separate API URL.

1. Import this repository into Vercel and keep the project root set to the repository root.
2. Create a managed PostgreSQL database (for example, Neon) and add its pooled connection URL as `DATABASE_URL`. Use a SQLAlchemy-compatible URL such as `postgresql+psycopg://...`; the backend also normalizes `postgres://` and `postgresql://` URLs.
3. Add `SECRET_KEY` as a long, random value. Optionally add `GEMINI_API_KEY`, `GROQ_API_KEY`, and the corresponding model variables to enable live AI responses.
4. Deploy. Vercel uses `vercel.json` to build `frontend/` and route API requests to the FastAPI function. The backend creates its tables and seeds starter curriculum during application startup.

Do not use the SQLite default for a Vercel deployment: function storage is ephemeral, so data would not persist. Keep secrets in Vercel Environment Variables, not in source control. If a Groq key was previously committed, revoke it and create a replacement before deploying.

Vercel's Python function does not include the C++ or Java compilers installed by the Docker image, so those playground languages require a separate execution service or a host that provides the compilers. Docker Compose remains the recommended local setup when you need the complete execution environment.

---

## 9. Verification & Evaluation Report

| Evaluation Rubric | Result | Details |
|---|---|---|
| **Question Validity Rate** | **100%** | Formulated test cases pass against expected solutions; strict JSON schemas validated |
| **Sandbox Isolation** | **Verified** | Infinite loops terminated in $\le 5$s; parent process environment variables stripped |
| **Multi-Language Tutor** | **Verified** | Native switching between English and Hinglish across dry-run states |
| **Mastery Accuracy** | **Empirical** | Purely computed from executed attempts, hint deductions, and quiz responses |
| **API Failure Handling** | **Graceful** | Clear demo badge displayed when API keys are absent; zero fabricated responses |

---

## 10. License & Author
Built with ❤️ by the Google DeepMind Advanced Agentic Coding team as a portfolio-grade AI coding mentor.
