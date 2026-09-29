"""
Conversational multi-turn interview API.

Manages a spoken conversational interview flow where the AI presents
4-5 questions sequentially, evaluates each response, and provides
a consolidated session summary at the end.
"""

import json
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.entities import (
    CandidateProfile,
    InterviewSession,
    CandidateResponse,
    CoachingFeedback,
)
from app.agents.question_agent import QuestionAgent

router = APIRouter(prefix="/api", tags=["Conversational Interviews"])


def _ensure_candidate(candidate_id: str, db: Session, target_role: str = "SDE") -> CandidateProfile:
    profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not profile:
        if candidate_id == "candidate_001":
            from app.database.connection import seed_defaults
            seed_defaults()
            profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
        if not profile:
            profile = CandidateProfile(
                candidate_id=candidate_id,
                name="Candidate",
                email=f"{candidate_id}@example.com",
                target_role=target_role,
                experience_years=2,
                target_competencies=json.dumps([
                    "Problem Solving",
                    "Communication & Clarity",
                    "Technical Depth & Domain Mastery",
                    "Ownership & Accountability",
                ]),
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
    return profile


@router.post("/interviews/conversational")
def start_conversational_interview(
    candidate_id: str,
    mode: str = "role_practice",
    target_role: str = "SDE",
    difficulty: Optional[str] = None,
    competency: Optional[str] = None,
    topics: Optional[str] = None,
    question_count: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Start a conversational multi-turn interview session.
    The number of questions and adaptive difficulty are autonomously decided by the LLM.
    """
    profile = _ensure_candidate(candidate_id, db, target_role=target_role)

    topics_list = None
    if topics:
        try:
            topics_list = json.loads(topics) if topics.startswith("[") else [t.strip() for t in topics.split(",")]
        except Exception:
            topics_list = [topics]

    q_agent = QuestionAgent(db_session=db)
    # LLM autonomously decides interview length & adaptive difficulty based on profile
    plan = q_agent.determine_interview_plan(
        mode=mode,
        target_role=target_role or "SDE",
        candidate_profile=profile.to_dict(),
        resume_text=profile.bio or "",
    )
    llm_diff = plan["initial_difficulty"]
    llm_count = plan["question_count"]

    session_id = f"conv_{uuid.uuid4().hex[:10]}"
    session = InterviewSession(
        session_id=session_id,
        candidate_id=candidate_id,
        mode=mode,
        target_role=target_role,
        difficulty=llm_diff,
        competency=competency,
        topics=json.dumps(topics_list) if topics_list else None,
        status="active",
        question_count=llm_count,
        questions_asked=1,
        is_conversational=True,
    )
    db.add(session)
    db.commit()

    # Generate first question
    q_output = q_agent.select_or_generate_question(
        mode=mode,
        target_role=target_role,
        difficulty=llm_diff,
        competency=competency,
        topics=topics_list,
        candidate_profile=profile.to_dict(),
        previous_questions=[],
    )

    session.current_question = q_output.question
    session.questions_history = json.dumps([q_output.question])
    session.difficulty = q_output.difficulty or llm_diff
    db.commit()

    return {
        "session_id": session_id,
        "mode": mode,
        "target_role": target_role,
        "difficulty": session.difficulty,
        "question": q_output.model_dump(),
        "question_number": 1,
        "total_questions": session.question_count,
        "is_conversational": True,
    }


@router.post("/interviews/{session_id}/next")
def get_next_conversational_question(session_id: str, db: Session = Depends(get_db)):
    """
    Advance the conversational interview to the next question.
    Increments the questions_asked counter and returns the next question.
    If all questions have been asked, marks the session as completed.
    """
    session = db.query(InterviewSession).filter_by(session_id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    total = session.question_count or 5
    asked = (session.questions_asked or 0) + 1

    if asked > total:
        session.status = "completed"
        db.commit()
        return {
            "session_id": session_id,
            "completed": True,
            "question_number": asked - 1,
            "total_questions": total,
            "message": "All questions completed. View the session summary.",
        }

    session.questions_asked = asked

    # Aggregate all previously asked questions to prevent repetition
    previous_questions = []
    if session.questions_history:
        try:
            previous_questions.extend(json.loads(session.questions_history))
        except Exception:
            pass
    for r in session.responses:
        if r.question_text and r.question_text not in previous_questions:
            previous_questions.append(r.question_text)
    if session.current_question and session.current_question not in previous_questions:
        previous_questions.append(session.current_question)

    # Also include questions from candidate's recent sessions
    prior_sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.candidate_id == session.candidate_id, InterviewSession.session_id != session_id)
        .order_by(InterviewSession.created_at.desc())
        .limit(3)
        .all()
    )
    for ps in prior_sessions:
        if ps.questions_history:
            try:
                for q in json.loads(ps.questions_history):
                    if q not in previous_questions:
                        previous_questions.append(q)
            except Exception:
                pass

    q_agent = QuestionAgent(db_session=db)
    q_output = q_agent.select_or_generate_question(
        mode=session.mode,
        target_role=session.target_role,
        difficulty=session.difficulty,
        competency=session.competency,
        topics=json.loads(session.topics) if session.topics else None,
        candidate_profile=session.candidate.to_dict() if session.candidate else None,
        resume_text=session.resume_text,
        jd_text=session.jd_text,
        previous_questions=previous_questions,
    )

    q_hist = json.loads(session.questions_history) if session.questions_history else []
    if q_output.question not in q_hist:
        q_hist.append(q_output.question)
    session.questions_history = json.dumps(q_hist)
    session.current_question = q_output.question
    session.difficulty = q_output.difficulty or session.difficulty
    db.commit()

    return {
        "session_id": session_id,
        "completed": False,
        "question": q_output.model_dump(),
        "question_number": asked,
        "total_questions": total,
    }


@router.get("/interviews/{session_id}/summary")
def get_session_summary(session_id: str, db: Session = Depends(get_db)):
    """
    Return a consolidated summary of the entire conversational session,
    including all questions, responses, individual scores, and aggregate metrics.
    """
    session = db.query(InterviewSession).filter_by(session_id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    responses = session.responses
    if not responses:
        return {
            "session_id": session_id,
            "total_questions": 0,
            "questions": [],
            "aggregate": {},
        }

    questions_data = []
    total_overall = 0.0
    total_clarity = 0.0
    total_content = 0.0
    total_star = 0.0
    count = 0

    for resp in responses:
        q_entry = {
            "question_number": count + 1,
            "question_text": resp.question_text,
            "response_text": resp.response_text,
            "response_type": resp.response_type,
        }

        if resp.coaching_feedback:
            fb = resp.coaching_feedback
            q_entry["overall_score"] = fb.overall_score
            q_entry["strengths"] = json.loads(fb.strengths) if fb.strengths else []
            q_entry["improvement_areas"] = json.loads(fb.improvement_areas) if fb.improvement_areas else []
            q_entry["follow_up_question"] = fb.follow_up_question
            q_entry["improved_answer_structure"] = fb.improved_answer_structure
            total_overall += fb.overall_score or 0
        else:
            q_entry["overall_score"] = 0

        if resp.communication_evaluation:
            ce = resp.communication_evaluation
            clarity_avg = (ce.clarity_score + ce.conciseness_score + ce.structure_score + ce.communication_quality_score) / 4
            q_entry["communication_score"] = round(clarity_avg, 1)
            total_clarity += clarity_avg
        else:
            q_entry["communication_score"] = 0

        if resp.content_evaluation:
            cte = resp.content_evaluation
            content_avg = (cte.relevance_score + cte.correctness_score + cte.completeness_score + cte.technical_depth_score + cte.evidence_quality_score) / 5
            q_entry["content_score"] = round(content_avg, 1)
            total_content += content_avg
        else:
            q_entry["content_score"] = 0

        if resp.star_evaluation:
            se = resp.star_evaluation
            if se.applicable:
                star_avg = (se.situation_score + se.task_score + se.action_score + se.result_score) / 4
                q_entry["star_score"] = round(star_avg, 1)
                total_star += star_avg
            else:
                q_entry["star_score"] = None
        else:
            q_entry["star_score"] = 0

        questions_data.append(q_entry)
        count += 1

    # Aggregate metrics
    aggregate = {}
    if count > 0:
        aggregate = {
            "average_overall_score": round(total_overall / count, 1),
            "average_communication_score": round(total_clarity / count, 1),
            "average_content_score": round(total_content / count, 1),
            "average_star_score": round(total_star / count, 1) if total_star > 0 else None,
            "total_questions_answered": count,
            "total_questions_planned": session.question_count or 5,
        }

        # Overall session grade
        avg = aggregate["average_overall_score"]
        if avg >= 85:
            aggregate["grade"] = "Excellent"
            aggregate["grade_color"] = "green"
        elif avg >= 70:
            aggregate["grade"] = "Good"
            aggregate["grade_color"] = "blue"
        elif avg >= 55:
            aggregate["grade"] = "Developing"
            aggregate["grade_color"] = "yellow"
        else:
            aggregate["grade"] = "Needs Work"
            aggregate["grade_color"] = "red"

    return {
        "session_id": session_id,
        "mode": session.mode,
        "target_role": session.target_role,
        "difficulty": session.difficulty,
        "total_questions": count,
        "questions": questions_data,
        "aggregate": aggregate,
    }
