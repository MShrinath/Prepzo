# AI-Powered Communication & Interview Coaching System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/Orchestrator-LangGraph-orange.svg?style=flat)](https://github.com/langchain-ai/langgraph)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb.svg?style=flat&logo=react)](https://react.dev)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED.svg?style=flat&logo=docker)](https://www.docker.com)
[![Tests](https://img.shields.io/badge/Tests-14%2F14%20Passing-brightgreen.svg?style=flat)]()
[![Benchmark](https://img.shields.io/badge/Benchmark-100%25%20Pass%20Rate-success.svg?style=flat)]()

An advanced, production-grade AI platform that transforms traditional static mock interviews into an adaptive, multi-agent coaching experience. Built using **LangGraph**, **FastAPI**, **React**, and **PostgreSQL/SQLite**, the system evaluates candidate spoken and written answers across communication clarity, technical depth, and STAR behavioral structure.

---

## 🌟 Key Features

### 1. Three Core Interview Modes
- **Mode 1 — Role Practice:** Select from 9 preset roles (*SDE, Full Stack, AI/ML, Cloud, DevOps, Data Analyst, Product Manager, Sales, Customer Success*) with curated, tagged questions.
- **Mode 2 — Resume + Job Description:** Upload your resume (PDF/TXT) and paste a target job description. The system executes automated gap analysis and generates questions strictly grounded in resume facts, probing JD gaps without hallucinating experience.
- **Mode 3 — HR Behavioral Round:** Role-agnostic practice emphasizing conflict resolution, receiving feedback, stress management, motivation, and culture fit.

### 2. LangGraph Multi-Agent Orchestration
Coordinates specialized agents over a shared `InterviewState` typed dictionary with conditional routing:
- **Question Agent:** Dynamically retrieves or generates questions tailored to role, difficulty, and candidate history.
- **Communication Agent:** Evaluates clarity, conciseness, structural cohesion, filler words (`um`, `like`, `basically`), and delivery cadence.
- **Content Agent:** Assesses technical depth, correctness, completeness, and evidence quality.
- **STAR Structure Agent:** Evaluates Situation, Task, Action (personal ownership vs passive "we"), and Result (quantifiable metrics).
- **Coach Agent:** Synthesizes findings into balanced overall scores, prioritized evidence items, improved answer restructuring, adaptive follow-up questions, and longitudinal improvement roadmaps.
- **Conditional Agent Handoff:** Triggers deeper specialist diagnostics when clarity or technical depth falls below threshold.

### 3. Voice & Speech-to-Text Pipeline
- Whisper-compatible audio ingestion supporting microphone recording in the browser.
- Analyzes physical delivery metrics (speaking rate in WPM, pause frequencies, filler word counts) while rejecting pseudo-scientific psychological inference.

### 4. Longitudinal Progress & Adaptive Growth
- **Recurring Weakness Detection:** Automatically tracks recurring gaps that appear across multiple sessions (e.g. "Missing Measurable Outcomes").
- **7-Day Personalized Improvement Plan:** Generates targeted day-by-day practice schedules tailored to the candidate's historical gaps.
- **Interactive Analytics:** Visualizes score trends, communication clarity, and technical mastery over time using Recharts.

---

## 🏛️ System Architecture

![Architecture Diagram](docs/architecture.svg)

```
[Candidate: Voice/Text] ──> [FastAPI Backend] ──> [LangGraph State Machine]
                                                        │
                      ┌─────────────────────────────────┼─────────────────────────────────┐
                      ▼                                 ▼                                 ▼
             [Communication Agent]               [Content Agent]                    [STAR Agent]
                      │                                 │                                 │
                      └─────────────────────────────────┼─────────────────────────────────┘
                                                        │
                                            [Conditional Handoff]
                                                        │
                                                        ▼
                                                  [Coach Agent]
                                                        │
                      ┌─────────────────────────────────┼─────────────────────────────────┐
                      ▼                                 ▼                                 ▼
            [Evidence-Based Feedback]          [Follow-Up Question]             [7-Day Action Plan]
```

---

## 🚀 Quickstart Guide

### Option A: Local Development (Recommended for quick testing)

#### 1. Clone & Set Up Backend
```bash
# Activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

# Seed question bank and default demo candidate
python scripts/seed_database.py

# Start FastAPI server (runs on port 8000)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Set Up Frontend
```bash
# In a new terminal:
cd frontend
npm install
npm run dev
# Open browser at http://localhost:5173
```

---

### Option B: Docker Compose Deployment

Run the complete multi-container stack (PostgreSQL + FastAPI Backend + Nginx Frontend):
```bash
docker-compose up --build -d
```
- Web Application: `http://localhost:5173` (or `http://localhost:80`)
- Backend API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

## 🧪 Testing & Verification

### Run Backend Unit & Integration Tests (14 Tests)
```bash
$env:PYTHONPATH="backend"
pytest backend/tests -v
```
*Result: 14 passed (covers QuestionAgent, CommunicationAgent, ContentAgent, STARAgent, CoachAgent, ResumeJDService, LangGraph workflow, conditional routing, and FastAPI REST endpoints).*

### Run Automated Multi-Agent Benchmark Suite
```bash
$env:PYTHONPATH="backend"
python scripts/evaluate_agents.py
```
*Result: 100% Pass Rate across benchmark dataset with 0.0 points score variance (deterministic consistency).*

---

## 📚 Documentation Deliverables

Detailed technical documentation is available in the [`docs/`](docs/) directory:
- [Architecture & Workflow (`docs/architecture.md`)](docs/architecture.md)
- [System Architecture Vector Diagram (`docs/architecture.svg`)](docs/architecture.svg)
- [System Design & Engineering Decisions (`docs/design.md`)](docs/design.md)
- [Specialist Agents Reference (`docs/agents.md`)](docs/agents.md)
- [REST API Reference (`docs/api.md`)](docs/api.md)
- [Database Schema & Relationships (`docs/database.md`)](docs/database.md)
- [Evaluation Methodology & Benchmark Results (`docs/evaluation.md`)](docs/evaluation.md)
- [Deployment & Operations Guide (`docs/deployment.md`)](docs/deployment.md)
- [10-Minute Presentation & Demo Script (`docs/demo-script.md`)](docs/demo-script.md)

---

## 📝 License
MIT License. Built for the Google DeepMind Antigravity Advanced Agentic Coding Assessment.
