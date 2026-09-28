# Deployment & Operations Guide

## 1. Quick Local Development Setup

### Prerequisites
- Python 3.10+ (Tested on Python 3.11 - 3.14)
- Node.js 18+ & npm

### Backend Setup
```bash
# 1. Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Seed question bank and default demo candidate
python scripts/seed_database.py

# 4. Start FastAPI server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App will be accessible at http://localhost:5173
```

---

## 2. Docker & Containerized Deployment

The application includes production multi-stage Dockerfiles and a `docker-compose.yml` orchestrating PostgreSQL, FastAPI, and Nginx.

### Start with Docker Compose
```bash
docker-compose up --build -d
```

### Services Started:
- **`frontend`:** React static bundle served via Nginx on port `80` (and `5173`).
- **`backend`:** FastAPI + LangGraph container on port `8000`.
- **`postgres`:** PostgreSQL 15 database on port `5432`.

### Verify Services:
```bash
docker-compose ps
curl http://localhost:8000/health
```

---

## 3. Environment Variables Reference

Create a `.env` file in the project root:

| Variable | Default | Purpose |
|---|---|---|
| `APP_ENV` | `development` | Environment mode (`development`, `production`) |
| `DATABASE_URL` | `sqlite:///./interview_coach.db` | Relational database connection string |
| `LLM_PROVIDER` | `mock` | Selected LLM backend (`gemini`, `openai`, `mock`) |
| `LLM_MODEL` | `gemini-1.5-flash` | Model identifier |
| `GOOGLE_API_KEY` | *(empty)* | Google GenAI API Key |
| `OPENAI_API_KEY` | *(empty)* | OpenAI API Key for GPT & Whisper |
| `WHISPER_PROVIDER` | `mock` | Speech-to-text engine (`openai`, `mock`) |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins for API requests |

---

## 4. Database Migrations & Seeding

To re-initialize or seed the question catalog in PostgreSQL:
```bash
# Set PostgreSQL DATABASE_URL in environment, then run:
python scripts/seed_database.py
```
This populates:
- 19+ curated questions across all 9 roles and HR behavioral tracks.
- Standard competency taxonomy with 4-tier evaluation rubrics.
- Demo candidate `candidate_001` (Alex Taylor, SDE).
