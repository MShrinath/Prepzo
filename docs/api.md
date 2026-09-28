# REST API Reference Specification

Base URL: `http://localhost:8000`

---

## 1. System & Health

### Health Check
- **Endpoint:** `GET /health`
- **Response:**
```json
{
  "status": "healthy",
  "env": "development",
  "llm_provider": "gemini",
  "whisper_provider": "openai",
  "database": "sqlite"
}
```

---

## 2. Interview Modes

### Get Preset Roles
- **Endpoint:** `GET /api/interview-modes/role-practice/roles`
- **Response:**
```json
{
  "roles": [
    "SDE",
    "Full Stack Developer",
    "AI/ML Engineer",
    "Cloud Engineer",
    "DevOps Engineer",
    "Data Analyst",
    "Product Manager",
    "Sales",
    "Customer Success"
  ]
}
```

### Start Role Practice (Mode 1)
- **Endpoint:** `POST /api/interviews/role-practice`
- **Request:**
```json
{
  "candidate_id": "candidate_001",
  "role": "SDE",
  "difficulty": "medium",
  "competency": "Problem Solving"
}
```
- **Response:**
```json
{
  "session_id": "sess_8f2b7a912e",
  "mode": "role_practice",
  "target_role": "SDE",
  "difficulty": "medium",
  "question": {
    "question_id": "sde_perf_001",
    "question": "How would you optimize a Python API endpoint that is experiencing high latency under heavy traffic?",
    "competency": "Problem Solving",
    "difficulty": "medium",
    "question_type": "technical"
  }
}
```

### Start Resume + JD Interview (Mode 2)
- **Endpoint:** `POST /api/interviews/resume-jd`
- **Format:** `multipart/form-data`
- **Fields:**
  - `candidate_id`: string
  - `target_role`: string
  - `difficulty`: string
  - `job_description`: string
  - `resume_file`: (optional file, .pdf or .txt)
  - `resume_text`: (optional string)
- **Response:**
```json
{
  "session_id": "sess_39d10e8fa7",
  "mode": "resume_jd",
  "target_role": "SDE",
  "difficulty": "medium",
  "gap_analysis": {
    "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
    "missing_skills": ["AWS", "Kubernetes"],
    "experience_level_match": "Mid-Level",
    "tailored_focus_areas": ["AWS", "Kubernetes", "Deep dive into Python"]
  },
  "question": {
    "question": "Your profile highlights experience with FastAPI. Can you walk me through how you structured the API and what bottlenecks you encountered?",
    "competency": "Problem Solving"
  }
}
```

### Start HR Round (Mode 3)
- **Endpoint:** `POST /api/interviews/hr`
- **Request:**
```json
{
  "candidate_id": "candidate_001",
  "difficulty": "medium",
  "topics": ["conflict_resolution", "receiving_feedback"]
}
```

---

## 3. Response Submission & Evaluation

### Submit Text Response
- **Endpoint:** `POST /api/interviews/{session_id}/response`
- **Request:**
```json
{
  "response": "I would use cProfile to find slow functions, introduce Redis caching, and optimize database indexes.",
  "question_text": "How would you optimize a Python API?",
  "question_id": "sde_perf_001"
}
```
- **Response:** Contains complete multi-agent evaluation output, including Communication analysis, Content quality, STAR breakdown, overall score, and follow-up question.

### Submit Spoken Voice Response
- **Endpoint:** `POST /api/interviews/{session_id}/response/voice`
- **Format:** `multipart/form-data`
- **Fields:**
  - `audio_file`: audio blob (.wav, .webm, .mp3)
  - `question_text`: string
  - `question_id`: (optional string)
- **Response:** Transcribes audio via Whisper, computes acoustic delivery metrics, runs LangGraph evaluation, and returns complete structured report.

### Submit Follow-Up Answer
- **Endpoint:** `POST /api/interviews/{session_id}/follow-up`
- **Request:**
```json
{
  "response": "Our database had an unindexed foreign key join which resulted in sequential scans.",
  "follow_up_question": "What specific metrics or profiling tools did you check first?"
}
```

---

## 4. Candidate & Longitudinal Analytics

### Get Progress & Timeline
- **Endpoint:** `GET /api/candidates/{id}/progress`
- **Response:**
```json
{
  "candidate_id": "candidate_001",
  "candidate_name": "Alex Taylor",
  "total_sessions": 4,
  "average_overall_score": 78.4,
  "average_communication_score": 81.2,
  "average_content_score": 77.0,
  "timeline": [
    { "session_id": "sess_1", "date": "Sep 28, 14:00", "overall_score": 72.0 },
    { "session_id": "sess_2", "date": "Sep 28, 14:30", "overall_score": 84.5 }
  ]
}
```

### Get Recurring Gaps
- **Endpoint:** `GET /api/candidates/{id}/recurring-gaps`

### Get 7-Day Personalized Improvement Plan
- **Endpoint:** `GET /api/candidates/{id}/improvement-plan`
