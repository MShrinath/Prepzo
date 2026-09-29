import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import init_db

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_get_preset_roles():
    resp = client.get("/api/interview-modes/role-practice/roles")
    assert resp.status_code == 200
    roles = resp.json()["roles"]
    assert "SDE" in roles
    assert "Full Stack Developer" in roles
    assert "Product Manager" in roles


def test_candidate_profile_crud():
    import uuid
    cand_id = f"test_cand_{uuid.uuid4().hex[:6]}"
    # Create
    create_payload = {
        "candidate_id": cand_id,
        "name": "Jordan Smith",
        "email": "jordan@example.com",
        "target_role": "AI/ML Engineer",
        "experience_years": 3,
        "skills": [
            {"skill_name": "PyTorch", "proficiency": "Advanced", "category": "Technical"},
            {"skill_name": "Docker", "proficiency": "Intermediate", "category": "Technical"}
        ],
        "projects": [
            {"name": "LLM Fine-tuning", "description": "Trained LoRA adapters on domain corpus."}
        ]
    }
    res = client.post("/api/candidates", json=create_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["candidate_id"] == cand_id
    assert len(data["skills"]) == 2

    # Get
    res = client.get(f"/api/candidates/{cand_id}")
    assert res.status_code == 200
    assert res.json()["name"] == "Jordan Smith"


def test_role_practice_flow():
    # 1. Start role practice session
    start_payload = {
        "candidate_id": "candidate_001",
        "role": "SDE",
        "difficulty": "medium"
    }
    res = client.post("/api/interviews/role-practice", json=start_payload)
    assert res.status_code == 200
    session_data = res.json()
    session_id = session_data["session_id"]
    question = session_data["question"]["question"]
    assert len(session_id) > 0
    assert len(question) > 0

    # 2. Submit response
    resp_payload = {
        "question_text": question,
        "response": "I would profile the code first using cProfile, find slow functions, introduce Redis caching, and optimize the SQL query execution plans."
    }
    res = client.post(f"/api/interviews/{session_id}/response", json=resp_payload)
    assert res.status_code == 200
    eval_data = res.json()
    assert "coaching_feedback" in eval_data
    assert eval_data["coaching_feedback"]["overall_score"] > 0
    assert "communication_evaluation" in eval_data
    assert "content_evaluation" in eval_data

    # 3. Check feedback endpoint
    res = client.get(f"/api/interviews/{session_id}/feedback")
    assert res.status_code == 200
    feedbacks = res.json()
    assert len(feedbacks) >= 1

    # 4. Check candidate progress endpoint
    res = client.get("/api/candidates/candidate_001/progress")
    assert res.status_code == 200
    progress = res.json()
    assert progress["total_sessions"] >= 1

    # 5. Test next question in session (POST /api/interviews/{session_id}/question)
    res = client.post(f"/api/interviews/{session_id}/question")
    assert res.status_code == 200
    next_q_data = res.json()
    assert "question" in next_q_data
    assert "question" in next_q_data["question"]


def test_generic_interview_and_response():
    # Test POST /api/interviews
    start_payload = {
        "candidate_id": "candidate_001",
        "target_role": "Full Stack Developer",
        "difficulty": "medium",
        "mode": "role_practice"
    }
    res = client.post("/api/interviews", json=start_payload)
    assert res.status_code == 200
    session_id = res.json()["session_id"]

    # Test POST /api/responses/text
    resp_payload = {
        "session_id": session_id,
        "response": "I use Zustand for lightweight global state and TanStack Query for caching server state in React.",
        "question_text": "How do you manage client-side state in React?"
    }
    res = client.post("/api/responses/text", json=resp_payload)
    assert res.status_code == 200
    assert "coaching_feedback" in res.json()


def test_candidate_login_and_capabilities():
    # 1. Login with new ID (auto-registers)
    login_payload = {
        "candidate_id": "taylor_swift_eng",
        "name": "Taylor Swift",
        "target_role": "Backend Engineer",
        "experience_years": 4
    }
    res = client.post("/api/candidates/login", json=login_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["candidate_id"] == "taylor_swift_eng"
    assert data["name"] == "Taylor Swift"

    # 2. Get capabilities endpoint
    res = client.get("/api/candidates/taylor_swift_eng/capabilities")
    assert res.status_code == 200
    caps = res.json()
    assert "capabilities" in caps
    assert isinstance(caps["capabilities"], list)
    assert len(caps["capabilities"]) >= 5
    assert "project_stats" in caps


def test_candidate_resume_text_upload():
    cand_id = "resume_test_cand"
    # Seed candidate
    client.post("/api/candidates/login", json={"candidate_id": cand_id, "name": "Resume Tester"})

    resume_text = """
    Alex Rivera - Senior Cloud & Backend Engineer
    Skills: Python, Go, Docker, Kubernetes, AWS, PostgreSQL, Redis, FastAPI, Terraform
    
    Experience & Projects:
    High-Throughput Ingestion Engine
    Architected an event-driven streaming pipeline processing 15,000 RPS using FastAPI, Kafka, and Redis.
    Decreased latency by 60% and scaled data throughput across 3 Kubernetes clusters.
    """

    res = client.post(
        f"/api/candidates/{cand_id}/resume",
        data={"resume_text": resume_text}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["candidate_id"] == cand_id
    assert "capabilities" in data
    assert "profile_summary" in data
    assert len(data["skills"]) >= 3
    # Check that role matches include Backend and Cloud
    roles = [rm["role_name"] for rm in data["capabilities"]]
    assert "Software Development Engineer (SDE / Backend)" in roles
    assert "DevOps & Cloud Engineer" in roles


