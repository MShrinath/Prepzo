# AI-Powered Communication & Interview Coaching System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/Orchestrator-LangGraph-orange.svg?style=flat)](https://github.com/langchain-ai/langgraph)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb.svg?style=flat&logo=react)](https://react.dev)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED.svg?style=flat&logo=docker)](https://www.docker.com)
[![Tests](https://img.shields.io/badge/Tests-22%2F22%20Passing-brightgreen.svg?style=flat)]()
[![Benchmark](https://img.shields.io/badge/Benchmark-100%25%20Pass%20Rate-success.svg?style=flat)]()
[![Defense Guide](https://img.shields.io/badge/Review%20Guide-Available-blue.svg?style=flat)](PREPZO_SYSTEM_REVIEW_GUIDE.md)

An advanced, production-grade AI platform that transforms traditional static mock interviews into an adaptive, multi-agent coaching experience. Built using **LangGraph**, **FastAPI**, **React 19**, and **PostgreSQL/SQLite**, the system evaluates candidate spoken and written answers across communication clarity, technical depth, and STAR behavioral structure.

---

## 🌟 Key Features

### 1. Dual-Mode Engine & Circuit Breaker (Zero-Downtime Guarantee)
- **Live AI Mode:** Deep qualitative reasoning powered by LLMs (OpenAI `gpt-4o-mini`, Gemini, or compatible proxy gateways) with strict 12.0s timeouts and native JSON schema enforcement.
- **Deterministic Heuristic Fallback Engine:** Automatic failover to local speech signal algorithms, NLP regex tokenizers, skills taxonomies, and weighted scoring matrices if an API key is invalid (401), rate-limited (429), or times out.
- **Circuit Breaker Pattern (`LLMStatusTracker`):** Bypasses dead network calls in $< 2\text{ ms}$ once a key failure is detected, eliminating 12s user-facing freezes. Recovers automatically after a 60s cooldown or via manual probe.
- **Real-Time Diagnostics HUD:** The TopBar renders a live status pill (`🟢 AI Live` or `🟡 Heuristic Mode`) with an interactive diagnostics popover and an instant "Test AI Connection" verification trigger.

### 2. Four Core Interview Modes with Autonomous LLM Calibration & Crisp 1-2 Line Questions
- **Autonomous LLM Session Planning:** The LLM independently determines the optimal number of questions (3 to 6) and dynamic difficulty progression (easy, medium, hard) based on candidate experience, role depth, and detected skill gaps with zero manual intervention required.
- **Strict 1 to 2 Line Question Length:** Every generated question is strictly enforced to be punchy, direct, and between 1 to 2 lines (~15–35 words), eliminating chatty preambles and robotic fluff.
- **Mode 1 — Role Practice:** Select from 9 preset roles (*SDE, Full Stack, AI/ML, Cloud, DevOps, Data Analyst, Product Manager, Sales, Customer Success*) with LLM-generated questions tailored to core engineering competencies.
- **Mode 2 — Resume + Job Description:** Direct PDF/TXT parsing with automated gap analysis. Probes claimed resume projects, production experience, and unaddressed JD requirements without hallucinations.
- **Mode 3 — HR Behavioral Round:** Role-agnostic situational practice evaluated strictly against the STAR framework (weighted at 35% Communication + 35% STAR/Leadership).
- **Mode 4 — Company Archetypes:** Rigorous practice for Amazon Leadership Principles, Google Scale & Engineering, and McKinsey Case Frameworks.

### 3. Interview Preparation & Skill Improvement Roadmap
- **Curated Problem Bank (LeetCode & CodeChef):** Algorithmic problems organized by pattern (*Two Pointers, Sliding Window, Monotonic Stack, Graphs / 0-1 BFS, Dynamic Programming, 0-1 Knapsack*) with direct platform links, difficulty badges, and architectural pattern hints.
- **Interactive Completion Tracker:** Candidate checklist with real-time completion percentages and `localStorage` state persistence.
- **Curated Reference Curriculum:** Direct links and summaries to foundational engineering references (*Designing Data-Intensive Applications*, *System Design Primer*, Stripe Idempotency, Rate Limiting, Kafka, PostgreSQL Indexing).

### 4. Profile & Resume Intelligence Center
- **Candidate Login & Switcher:** Seamlessly log in, switch candidates, or auto-register using Candidate ID, email, or name.
- **Direct Resume Upload & Auto-Sync:** Upload `.pdf` or `.txt` resumes directly. Automatically extracts skills, project experiences, metrics, and bio via PyPDF and intelligent heuristics, syncing them into the database.
- **Profile Executive Summary:** Real-time synthesized candidate profile overview highlighting seniority tier, background, and core technology stack.
- **Production Portfolio & Project Stats:** Tracks candidate projects, technologies employed, and quantifiable impact metrics (e.g. *3,200 RPS, 95% latency reduction, 99.9% uptime*).
- **Role Capability & Readiness Matrix:** Evaluates readiness across 7 industry disciplines with fit percentages, status badges, matched capabilities, and prioritized skills to learn.

### 5. LangGraph Multi-Agent Orchestration
Coordinates specialized agents over a shared `InterviewState` typed dictionary with conditional routing:
- **Question Agent:** Dynamically retrieves or generates questions tailored to role, difficulty, resume facts, and candidate history.
- **Communication Agent:** Evaluates clarity, conciseness, structural cohesion, filler words (`um`, `like`, `basically`), and delivery cadence.
- **Content Agent:** Assesses technical depth, correctness, completeness, and evidence quality.
- **STAR Structure Agent:** Evaluates Situation, Task, Action (personal ownership vs passive "we"), and Result (quantifiable metrics).
- **Coach Agent:** Synthesizes findings into balanced overall scores, prioritized evidence items, improved answer restructuring, adaptive follow-up questions, and longitudinal improvement roadmaps.
- **Conditional Agent Handoff:** Triggers deeper specialist diagnostics when clarity or technical depth falls below threshold.

### 6. Cadence Shadowing Studio & Voice Pipeline
- Whisper-compatible audio ingestion supporting microphone recording in the browser.
- Analyzes physical delivery metrics (speaking rate in WPM, pause frequencies, filler word counts) while rejecting pseudo-scientific psychological inference.
- **Cadence Shadowing Studio:** Practice rephrasing answers thought-by-thought against the 135 WPM executive standard (120–150 WPM) with real-time audio playback and pacing scoring.

### 7. Longitudinal Progress & Adaptive Growth
- **Recurring Weakness Detection:** Automatically tracks recurring gaps that appear across multiple sessions (e.g. "Missing Measurable Outcomes").
- **7-Day Personalized Improvement Plan:** Generates targeted day-by-day practice schedules tailored to the candidate's historical gaps.
- **Interactive Analytics:** Visualizes score trends, communication clarity, and technical mastery over time using Recharts.

---

## 🏛️ System Architecture

Detailed architecture documentation is available at [`docs/architecture.md`](docs/architecture.md).

```
[Candidate: Voice/Text] ──> [FastAPI Backend] ──> [Circuit Breaker Layer]
                                                          │
                                     ┌────────────────────┴────────────────────┐
                                     ▼                                         ▼
                           [DirectOpenAILLM (Live)]              [Heuristic Engine (Fallback)]
                                     │                                         │
                                     └────────────────────┬────────────────────┘
                                                          ▼
                                              [LangGraph State Machine]
                                                          │
                       ┌──────────────────────────────────┼──────────────────────────────────┐
                       ▼                                  ▼                                  ▼
              [Communication Agent]                [Content Agent]                     [STAR Agent]
                       │                                  │                                  │
                       └──────────────────────────────────┼──────────────────────────────────┘
                                                          │
                                              [Conditional Handoff]
                                                          │
                                                          ▼
                                                    [Coach Agent]
                                                          │
                       ┌──────────────────────────────────┼──────────────────────────────────┐
                       ▼                                  ▼                                  ▼
             [Evidence-Based Feedback]           [Follow-Up Question]              [7-Day Action Plan]
```

---

## 📐 Evaluation & Scoring Formulas

### 1. Speaking Rate (Words Per Minute — WPM)
$$\text{Minutes} = \max\left(\frac{\text{Duration}_{\text{sec}}}{60.0}, \; 0.1\right), \qquad \text{WPM} = \text{round}\left(\frac{\text{Word Count}}{\text{Minutes}}, \; 1\right)$$

### 2. HR / Behavioral Overall Score
$$\text{Score}_{\text{HR}} = (\text{comm\_score} \times 3.5) + (\text{structure\_score} \times 3.5) + (\text{relevance} \times 2.0) + (\text{content\_score} \times 1.0)$$
*Prioritizes Communication (35%) and STAR Leadership Ownership (35%).*

### 3. Technical Overall Score
$$\text{Score}_{\text{Tech}} = (\text{content\_score} \times 4.0) + (\text{comm\_score} \times 3.0) + (\text{structure\_score} \times 2.0) + (\text{completeness} \times 1.0)$$
*Prioritizes Technical Content & Depth (40%) and Structured Communication (30%).*

### 4. Resume vs. JD Match Score
$$\text{Match Ratio} = \frac{|\text{Matched Skills}|}{\max(1, \; |\text{Matched Skills}| + |\text{Missing Skills}|)}$$
$$\text{Match Score} = \max\left(35, \; \min\left(95, \; \text{round}(\text{Match Ratio} \times 100)\right)\right)$$

*For complete formula derivations and coordinate geometry, see [PREPZO_SYSTEM_REVIEW_GUIDE.md](PREPZO_SYSTEM_REVIEW_GUIDE.md).*

---

## 🚀 Quickstart Guide

### Option A: Local Development

#### 1. Clone & Set Up Backend
```bash
# Activate virtual environment
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

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
```bash
docker-compose up --build -d
```
- Web Application: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- LLM Status Probe: `http://localhost:8000/api/llm/status`

---

## 🧪 Testing & Verification

### Run Backend Unit & Integration Tests (22 Tests)
```bash
cd backend
python -m pytest tests -v
```
*Result: 22 passed across:*
- [`tests/test_fallback.py`](backend/tests/test_fallback.py) (Circuit breaker, invalid key handling, heuristic agent fallbacks, status endpoints)
- [`tests/test_api.py`](backend/tests/test_api.py) (REST routes, candidate profile sync, session lifecycle)
- [`tests/test_graph.py`](backend/tests/test_graph.py) (LangGraph workflow, state compilation, conditional routing)
- [`tests/test_agents.py`](backend/tests/test_agents.py) (QuestionAgent, CommunicationAgent, ContentAgent, STARAgent, CoachAgent, ResumeJDService)

---

## 📚 Documentation Deliverables

- [**Comprehensive System Review & Defense Guide** (`PREPZO_SYSTEM_REVIEW_GUIDE.md`)](PREPZO_SYSTEM_REVIEW_GUIDE.md) — *Step-by-step viva prep, complete mathematical formulas, and 15+ ready defense answers.*
- [System Architecture & Multi-Agent Design (`docs/architecture.md`)](docs/architecture.md)
- [System Design & Engineering Decisions (`docs/design.md`)](docs/design.md)
- [Specialist Agents Reference (`docs/agents.md`)](docs/agents.md)
- [REST API Reference (`docs/api.md`)](docs/api.md)
- [Database Schema & Relationships (`docs/database.md`)](docs/database.md)
- [Evaluation Methodology & Benchmark Results (`docs/evaluation.md`)](docs/evaluation.md)
- [Deployment & Operations Guide (`docs/deployment.md`)](docs/deployment.md)

---

## 📝 License
MIT License. Built for the Google DeepMind Antigravity Advanced Agentic Coding Assessment.
