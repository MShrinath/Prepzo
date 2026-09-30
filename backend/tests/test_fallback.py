import pytest
from app.config import settings
from app.llm.provider import (
    status_tracker,
    verify_llm_connection,
    get_llm,
    parse_structured_output,
    DirectOpenAILLM,
    MockLLM,
)
from app.agents.question_agent import QuestionAgent
from app.agents.communication_agent import CommunicationAgent
from app.agents.content_agent import ContentAgent
from app.agents.star_agent import STARAgent
from app.agents.coach_agent import CoachAgent
from app.services.resume_parser import ResumeJDService
from app.database.connection import SessionLocal, init_db


@pytest.fixture(autouse=True)
def reset_status_tracker():
    # Save original settings
    orig_key = settings.openai_api_key
    orig_provider = settings.llm_provider
    yield
    # Restore original settings
    settings.openai_api_key = orig_key
    settings.llm_provider = orig_provider
    status_tracker.circuit_open = False
    status_tracker.last_error = None
    status_tracker.last_error_type = None
    status_tracker.consecutive_failures = 0


def test_circuit_breaker_trips_on_invalid_key():
    settings.openai_api_key = "sk-invalid-testing-key-12345"
    settings.llm_provider = "openai"

    status = verify_llm_connection()
    assert status["status"] == "fallback"
    assert status["fallback_mode"] is True
    assert status["circuit_open"] is True
    assert "invalid" in status["last_error"].lower() or "401" in status["last_error"]


def test_agents_gracefully_fallback_with_broken_key():
    settings.openai_api_key = "sk-invalid-testing-key-12345"
    settings.llm_provider = "openai"
    status_tracker.circuit_open = True
    status_tracker.last_error = "Mock invalid key fallback test"

    # 1. Question Agent
    init_db()
    db = SessionLocal()
    try:
        q_agent = QuestionAgent(db_session=db)
        q = q_agent.select_or_generate_question(
            mode="role_practice",
            target_role="SDE",
            difficulty="medium",
        )
        assert q.question is not None
        assert len(q.question) > 10
        assert q.difficulty == "medium"
    finally:
        db.close()

    # 2. Communication Agent
    comm_agent = CommunicationAgent()
    comm_out = comm_agent.analyze(
        question=q.question,
        response_text="I used Redis and query batching to reduce latency by 45%.",
    )
    assert comm_out.clarity >= 1
    assert comm_out.communication_quality >= 1
    assert len(comm_out.strengths) > 0 or len(comm_out.weaknesses) > 0

    # 3. Content Agent
    content_agent = ContentAgent()
    content_out = content_agent.evaluate(
        question=q.question,
        response_text="I implemented Redis caching and query batching to reduce latency by 45%.",
    )
    assert content_out.relevance >= 1
    assert content_out.technical_depth >= 1

    # 4. STAR Agent
    star_agent = STARAgent()
    star_out = star_agent.evaluate(
        question="Tell me about a time you resolved a major production incident.",
        question_type="behavioral",
        response_text="As primary on-call, I analyzed query metrics and deployed a hotfix that reduced latency by 45%.",
    )
    assert star_out.applicable is True
    assert star_out.situation.score >= 1
    assert star_out.action.score >= 1
    assert star_out.result.score >= 1

    # 5. Coach Agent
    coach_agent = CoachAgent()
    coach_out = coach_agent.synthesize_feedback(
        question=q.question,
        response_text="I implemented Redis caching and query batching to reduce latency by 45%.",
        communication=comm_out,
        content=content_out,
        star=star_out,
    )
    assert coach_out.overall_score >= 10.0
    assert len(coach_out.actionable_advice) > 0
    assert coach_out.improved_answer_structure is not None

    # 6. 7-Day Improvement Plan
    plan_out = coach_agent.generate_improvement_plan(
        target_role="SDE",
        recurring_gaps=[],
        candidate_name="Tester",
    )
    assert len(plan_out.items) == 7

    # 7. Resume & JD Service
    gap_out = ResumeJDService.analyze_gap(
        resume_text="Skills: Python, FastAPI, Docker, PostgreSQL. Built a high-throughput microservice.",
        jd_text="Requirements: Python, FastAPI, Kubernetes, AWS, Docker.",
        target_role="SDE",
    )
    assert gap_out["overall_match_score"] > 0
    assert len(gap_out["recommended_technical_questions"]) > 0
    assert len(gap_out["improvement_roadmap"]) > 0


def test_api_status_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    res = client.get("/api/llm/status")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "fallback_mode" in data
    assert "circuit_open" in data
