import pytest
from app.agents.question_agent import QuestionAgent
from app.agents.communication_agent import CommunicationAgent
from app.agents.content_agent import ContentAgent
from app.agents.star_agent import STARAgent
from app.agents.coach_agent import CoachAgent
from app.services.resume_parser import ResumeJDService
from app.database.connection import SessionLocal, init_db


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_question_agent_role_practice(db_session):
    agent = QuestionAgent(db_session=db_session)
    result = agent.select_or_generate_question(
        mode="role_practice",
        target_role="SDE",
        difficulty="medium",
    )
    assert result.question is not None
    assert len(result.question) > 10
    assert result.difficulty == "medium"


def test_question_agent_hr_round(db_session):
    agent = QuestionAgent(db_session=db_session)
    result = agent.select_or_generate_question(
        mode="hr",
        target_role="HR",
        difficulty="medium",
        topics=["conflict_resolution"],
    )
    assert result.question is not None
    assert result.question_type == "behavioral"


def test_resume_parser_gap_analysis():
    resume = "Alex Taylor. Skills: Python, FastAPI, Docker, PostgreSQL. Built a high-throughput microservice."
    jd = "Role: Backend Engineer. Requirements: Python, FastAPI, Kubernetes, AWS, Docker."
    analysis = ResumeJDService.analyze_gap(resume, jd)

    assert "Python" in analysis["matched_skills"] or "FASTAPI" in [s.upper() for s in analysis["matched_skills"]]
    assert "Kubernetes" in analysis["missing_skills"] or "AWS" in analysis["missing_skills"]
    assert len(analysis["recommended_technical_questions"]) > 0
    assert len(analysis["recommended_gap_probing_questions"]) > 0


def test_communication_agent():
    agent = CommunicationAgent()
    text = "In my last role, um, basically I led the refactoring of our payment pipeline. It was, like, very complex."
    eval_result = agent.analyze(
        question="Tell me about a challenging project.",
        response_text=text
    )
    assert eval_result.clarity >= 1
    assert eval_result.filler_words >= 2  # "um", "basically", "like" detected
    assert len(eval_result.strengths) > 0 or len(eval_result.weaknesses) > 0


def test_content_agent():
    agent = ContentAgent()
    eval_result = agent.evaluate(
        question="How do you optimize a slow database query?",
        response_text="I use EXPLAIN ANALYZE to identify sequential scans, add B-Tree or composite indexes, and avoid N+1 queries using prefetching.",
        competency="Technical Depth & Domain Mastery"
    )
    assert eval_result.relevance >= 5
    assert eval_result.technical_depth >= 5


def test_star_agent_behavioral():
    agent = STARAgent()
    resp = "Situation: Production database was locking up. Task: I was on-call. Action: I killed blocked connections and adjusted max_connections. Result: Latency restored to 50ms."
    eval_result = agent.evaluate(
        question="Tell me about a time you handled a critical outage.",
        question_type="behavioral",
        response_text=resp
    )
    assert eval_result.applicable is True
    assert eval_result.situation.score >= 5
    assert eval_result.result.score >= 5


def test_star_agent_technical_non_applicable():
    agent = STARAgent()
    eval_result = agent.evaluate(
        question="What is the difference between TCP and UDP?",
        question_type="technical",
        response_text="TCP is connection-oriented with guaranteed delivery, while UDP is connectionless with lower latency."
    )
    assert eval_result.applicable is False


def test_coach_agent_synthesis():
    coach = CoachAgent()
    comm = CommunicationAgent().analyze("Q", "Good answer with clear steps.")
    content = ContentAgent().evaluate("Q", "Good answer with clear steps.")
    star = STARAgent().evaluate("Q", "behavioral", "Good answer with clear steps.")

    feedback = coach.synthesize_feedback("Q", "Good answer with clear steps.", comm, content, star)
    assert 0 <= feedback.overall_score <= 100
    assert len(feedback.actionable_advice) > 0
    assert feedback.follow_up_question is not None


def test_question_agent_determine_interview_plan(db_session):
    agent = QuestionAgent(db_session=db_session)
    plan = agent.determine_interview_plan(
        mode="role_practice",
        target_role="SDE",
        candidate_profile={"experience_years": 3},
    )
    assert "question_count" in plan
    assert "initial_difficulty" in plan
    assert 3 <= plan["question_count"] <= 6
    assert plan["initial_difficulty"] in ["easy", "medium", "hard"]


def test_question_agent_concise_question_enforcement():
    # Should strip conversational preamble and keep it 1-2 lines
    long_raw = "Sure! Here is a great interview question for you: How do you design an idempotent payment processing API to prevent duplicate charges when network timeouts occur?"
    concise = QuestionAgent._enforce_concise_question(long_raw)
    assert not concise.startswith("Sure!")
    assert not concise.startswith("Here is")
    # Verify line count is <= 2
    lines = [line.strip() for line in concise.strip().split("\n") if line.strip()]
    assert 1 <= len(lines) <= 2
    assert "idempotent" in concise

