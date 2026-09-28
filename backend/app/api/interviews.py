import json
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.entities import (
    CandidateProfile,
    InterviewSession,
    CandidateResponse,
    CommunicationEvaluation,
    ContentEvaluation,
    STAREvaluation,
    CoachingFeedback,
    FollowUpQuestion,
    RecurringGap,
    ImprovementPlan,
)
from app.agents.question_agent import QuestionAgent
from app.services.resume_parser import ResumeJDService
from app.services.voice_service import VoiceService
from app.graph.workflow import interview_graph
from app.schemas.interview import (
    RolePracticeStartRequest,
    ResumeJDStartRequest,
    HRStartRequest,
    TextResponseSubmitRequest,
    FollowUpSubmitRequest,
    SessionResponse,
)

router = APIRouter(prefix="/api", tags=["Interviews"])

PRESET_ROLES = [
    "SDE",
    "Full Stack Developer",
    "AI/ML Engineer",
    "Cloud Engineer",
    "DevOps Engineer",
    "Data Analyst",
    "Product Manager",
    "Sales",
    "Customer Success",
]


@router.get("/interview-modes/role-practice/roles")
def get_available_roles():
    return {"roles": PRESET_ROLES}


@router.post("/interviews/role-practice")
def start_role_practice(req: RolePracticeStartRequest, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter_by(candidate_id=req.candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")

    session_id = f"sess_{uuid.uuid4().hex[:10]}"
    session = InterviewSession(
        session_id=session_id,
        candidate_id=req.candidate_id,
        mode="role_practice",
        target_role=req.role,
        difficulty=req.difficulty,
        competency=req.competency,
        status="active",
    )
    db.add(session)
    db.commit()

    # Select initial question
    q_agent = QuestionAgent(db_session=db)
    q_output = q_agent.select_or_generate_question(
        mode="role_practice",
        target_role=req.role,
        difficulty=req.difficulty,
        competency=req.competency,
        candidate_profile=profile.to_dict(),
    )

    return {
        "session_id": session_id,
        "mode": "role_practice",
        "target_role": req.role,
        "difficulty": req.difficulty,
        "question": q_output.model_dump(),
    }


@router.post("/interviews/resume-jd")
async def start_resume_jd_interview(
    candidate_id: str = Form(...),
    target_role: Optional[str] = Form("SDE"),
    difficulty: Optional[str] = Form("medium"),
    job_description: str = Form(...),
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")

    extracted_resume_text = resume_text or ""
    if resume_file:
        content = await resume_file.read()
        if resume_file.filename.lower().endswith(".pdf"):
            extracted_resume_text = ResumeJDService.extract_text_from_pdf(content)
        else:
            extracted_resume_text = content.decode("utf-8", errors="ignore")

    if not extracted_resume_text:
        # Fall back to candidate profile data
        skills_str = ", ".join([s.skill_name for s in profile.skills])
        extracted_resume_text = f"Candidate: {profile.name}\nTarget Role: {target_role}\nSkills: {skills_str}\nBio: {profile.bio}"

    # Perform Gap Analysis
    gap_analysis = ResumeJDService.analyze_gap(extracted_resume_text, job_description)

    session_id = f"sess_{uuid.uuid4().hex[:10]}"
    session = InterviewSession(
        session_id=session_id,
        candidate_id=candidate_id,
        mode="resume_jd",
        target_role=target_role,
        difficulty=difficulty,
        resume_text=extracted_resume_text,
        jd_text=job_description,
        gap_analysis=json.dumps(gap_analysis),
        status="active",
    )
    db.add(session)
    db.commit()

    q_agent = QuestionAgent(db_session=db)
    q_output = q_agent.select_or_generate_question(
        mode="resume_jd",
        target_role=target_role,
        difficulty=difficulty,
        resume_text=extracted_resume_text,
        jd_text=job_description,
        candidate_profile=profile.to_dict(),
    )

    return {
        "session_id": session_id,
        "mode": "resume_jd",
        "target_role": target_role,
        "difficulty": difficulty,
        "gap_analysis": gap_analysis,
        "question": q_output.model_dump(),
    }


@router.post("/interviews/hr")
def start_hr_interview(req: HRStartRequest, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter_by(candidate_id=req.candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")

    session_id = f"sess_{uuid.uuid4().hex[:10]}"
    session = InterviewSession(
        session_id=session_id,
        candidate_id=req.candidate_id,
        mode="hr",
        target_role="HR Behavioral",
        difficulty=req.difficulty,
        topics=json.dumps(req.topics),
        status="active",
    )
    db.add(session)
    db.commit()

    q_agent = QuestionAgent(db_session=db)
    q_output = q_agent.select_or_generate_question(
        mode="hr",
        target_role="HR",
        difficulty=req.difficulty,
        topics=req.topics,
        candidate_profile=profile.to_dict(),
    )

    return {
        "session_id": session_id,
        "mode": "hr",
        "difficulty": req.difficulty,
        "topics": req.topics,
        "question": q_output.model_dump(),
    }


@router.get("/interviews/{session_id}")
def get_interview_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter_by(session_id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session": session.to_dict(),
        "responses": [r.to_dict() for r in session.responses],
    }


@router.post("/interviews/{session_id}/response")
def submit_text_response(session_id: str, req: TextResponseSubmitRequest, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter_by(session_id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    candidate = session.candidate
    candidate_dict = candidate.to_dict() if candidate else {}

    # Retrieve prior session history for this candidate
    prior_responses = []
    prior_sessions = db.query(InterviewSession).filter_by(candidate_id=session.candidate_id).all()
    for s in prior_sessions:
        for r in s.responses:
            prior_responses.append(r.to_dict())

    # Build input state for LangGraph workflow
    initial_state = {
        "candidate_id": session.candidate_id,
        "candidate_profile": candidate_dict,
        "target_role": session.target_role,
        "competency": session.competency or "Problem Solving",
        "difficulty": session.difficulty,
        "question_type": "behavioral" if session.mode == "hr" else "technical",
        "current_question": req.question_text or "General interview question",
        "candidate_response": req.response,
        "session_history": prior_responses,
    }

    # Execute LangGraph workflow
    graph_result = interview_graph.invoke(initial_state)

    # Persist CandidateResponse and Evaluations
    resp_obj = CandidateResponse(
        session_id=session.session_id,
        question_id=req.question_id,
        question_text=req.question_text or "General Question",
        response_type="text",
        response_text=req.response,
        filler_words_count=graph_result["communication_analysis"].get("filler_words", 0),
    )
    db.add(resp_obj)
    db.flush()

    comm_data = graph_result["communication_analysis"]
    comm_eval = CommunicationEvaluation(
        response_id=resp_obj.id,
        clarity_score=comm_data.get("clarity", 7),
        conciseness_score=comm_data.get("conciseness", 7),
        structure_score=comm_data.get("structure", 7),
        communication_quality_score=comm_data.get("communication_quality", 7),
        filler_words_score=comm_data.get("filler_words", 0),
        strengths=json.dumps(comm_data.get("strengths", [])),
        weaknesses=json.dumps(comm_data.get("weaknesses", [])),
        evidence=json.dumps(comm_data.get("evidence", [])),
        audio_metrics=json.dumps(comm_data.get("audio_metrics", {})),
    )
    db.add(comm_eval)

    content_data = graph_result["content_evaluation"]
    content_eval = ContentEvaluation(
        response_id=resp_obj.id,
        relevance_score=content_data.get("relevance", 7),
        correctness_score=content_data.get("correctness", 7),
        completeness_score=content_data.get("completeness", 7),
        technical_depth_score=content_data.get("technical_depth", 7),
        evidence_quality_score=content_data.get("evidence_quality", 7),
        strengths=json.dumps(content_data.get("strengths", [])),
        gaps=json.dumps(content_data.get("gaps", [])),
    )
    db.add(content_eval)

    star_data = graph_result["star_analysis"]
    star_eval = STAREvaluation(
        response_id=resp_obj.id,
        applicable=star_data.get("applicable", True),
        situation_score=star_data.get("situation", {}).get("score", 7),
        situation_evidence=star_data.get("situation", {}).get("evidence"),
        task_score=star_data.get("task", {}).get("score", 7),
        task_evidence=star_data.get("task", {}).get("evidence"),
        action_score=star_data.get("action", {}).get("score", 7),
        action_evidence=star_data.get("action", {}).get("evidence"),
        result_score=star_data.get("result", {}).get("score", 7),
        result_evidence=star_data.get("result", {}).get("evidence"),
        restructuring_recommendation=star_data.get("restructuring_recommendation"),
    )
    db.add(star_eval)

    coach_data = graph_result["final_feedback"]
    coaching = CoachingFeedback(
        response_id=resp_obj.id,
        session_id=session.session_id,
        overall_score=coach_data.get("overall_score", 75.0),
        strengths=json.dumps(coach_data.get("strengths", [])),
        improvement_areas=json.dumps(coach_data.get("improvement_areas", [])),
        evidence_items=json.dumps(coach_data.get("evidence_items", [])),
        actionable_advice=json.dumps(coach_data.get("actionable_advice", [])),
        improved_answer_structure=coach_data.get("improved_answer_structure"),
        follow_up_question=coach_data.get("follow_up_question"),
    )
    db.add(coaching)

    # Save Follow Up Question record
    if coach_data.get("follow_up_question"):
        fq = FollowUpQuestion(
            response_id=resp_obj.id,
            question=coach_data.get("follow_up_question"),
            reason="Follow-up generated directly from candidate's answer",
        )
        db.add(fq)

    # Update recurring gaps
    recurring_list = graph_result.get("recurring_gaps", [])
    for rg in recurring_list:
        existing_gap = db.query(RecurringGap).filter_by(
            candidate_id=session.candidate_id,
            gap_category=rg["category"]
        ).first()
        if existing_gap:
            existing_gap.occurrence_count += 1
        else:
            new_gap = RecurringGap(
                candidate_id=session.candidate_id,
                gap_category=rg["category"],
                description=rg["description"],
                occurrence_count=rg["count"],
            )
            db.add(new_gap)

    # Save or update personalized improvement plan
    plan_data = graph_result.get("improvement_plan")
    if plan_data:
        plan = ImprovementPlan(
            candidate_id=session.candidate_id,
            title=plan_data.get("title", "7-Day Personalized Improvement Plan"),
            duration_days=plan_data.get("duration_days", 7),
            overview=plan_data.get("overview"),
            items=json.dumps(plan_data.get("items", [])),
        )
        db.add(plan)

    db.commit()
    db.refresh(resp_obj)

    return resp_obj.to_dict()


@router.post("/interviews/{session_id}/response/voice")
async def submit_voice_response(
    session_id: str,
    audio_file: UploadFile = File(...),
    question_id: Optional[str] = Form(None),
    question_text: Optional[str] = Form("General interview question"),
    db: Session = Depends(get_db),
):
    session = db.query(InterviewSession).filter_by(session_id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    # Read audio bytes
    audio_bytes = await audio_file.read()
    transcript, audio_metrics = VoiceService.process_audio(audio_bytes, audio_file.filename)

    candidate = session.candidate
    candidate_dict = candidate.to_dict() if candidate else {}

    prior_responses = []
    for s in db.query(InterviewSession).filter_by(candidate_id=session.candidate_id).all():
        for r in s.responses:
            prior_responses.append(r.to_dict())

    # Invoke LangGraph
    initial_state = {
        "candidate_id": session.candidate_id,
        "candidate_profile": candidate_dict,
        "target_role": session.target_role,
        "competency": session.competency or "Communication",
        "difficulty": session.difficulty,
        "question_type": "behavioral" if session.mode == "hr" else "technical",
        "current_question": question_text,
        "candidate_response": transcript,
        "transcript": transcript,
        "audio_metrics": audio_metrics,
        "session_history": prior_responses,
    }

    graph_result = interview_graph.invoke(initial_state)

    # Persist CandidateResponse with audio metadata
    resp_obj = CandidateResponse(
        session_id=session.session_id,
        question_id=question_id,
        question_text=question_text,
        response_type="voice",
        response_text=transcript,
        transcript=transcript,
        audio_url=f"/uploads/audio/{audio_file.filename}",
        duration_seconds=audio_metrics.get("duration_seconds"),
        speaking_rate=audio_metrics.get("speaking_rate_wpm"),
        filler_words_count=audio_metrics.get("filler_words_count", 0),
    )
    db.add(resp_obj)
    db.flush()

    comm_data = graph_result["communication_analysis"]
    comm_eval = CommunicationEvaluation(
        response_id=resp_obj.id,
        clarity_score=comm_data.get("clarity", 7),
        conciseness_score=comm_data.get("conciseness", 7),
        structure_score=comm_data.get("structure", 7),
        communication_quality_score=comm_data.get("communication_quality", 7),
        filler_words_score=audio_metrics.get("filler_words_count", 0),
        strengths=json.dumps(comm_data.get("strengths", [])),
        weaknesses=json.dumps(comm_data.get("weaknesses", [])),
        evidence=json.dumps(comm_data.get("evidence", [])),
        audio_metrics=json.dumps(audio_metrics),
    )
    db.add(comm_eval)

    content_data = graph_result["content_evaluation"]
    content_eval = ContentEvaluation(
        response_id=resp_obj.id,
        relevance_score=content_data.get("relevance", 7),
        correctness_score=content_data.get("correctness", 7),
        completeness_score=content_data.get("completeness", 7),
        technical_depth_score=content_data.get("technical_depth", 7),
        evidence_quality_score=content_data.get("evidence_quality", 7),
        strengths=json.dumps(content_data.get("strengths", [])),
        gaps=json.dumps(content_data.get("gaps", [])),
    )
    db.add(content_eval)

    star_data = graph_result["star_analysis"]
    star_eval = STAREvaluation(
        response_id=resp_obj.id,
        applicable=star_data.get("applicable", True),
        situation_score=star_data.get("situation", {}).get("score", 7),
        situation_evidence=star_data.get("situation", {}).get("evidence"),
        task_score=star_data.get("task", {}).get("score", 7),
        task_evidence=star_data.get("task", {}).get("evidence"),
        action_score=star_data.get("action", {}).get("score", 7),
        action_evidence=star_data.get("action", {}).get("evidence"),
        result_score=star_data.get("result", {}).get("score", 7),
        result_evidence=star_data.get("result", {}).get("evidence"),
        restructuring_recommendation=star_data.get("restructuring_recommendation"),
    )
    db.add(star_eval)

    coach_data = graph_result["final_feedback"]
    coaching = CoachingFeedback(
        response_id=resp_obj.id,
        session_id=session.session_id,
        overall_score=coach_data.get("overall_score", 75.0),
        strengths=json.dumps(coach_data.get("strengths", [])),
        improvement_areas=json.dumps(coach_data.get("improvement_areas", [])),
        evidence_items=json.dumps(coach_data.get("evidence_items", [])),
        actionable_advice=json.dumps(coach_data.get("actionable_advice", [])),
        improved_answer_structure=coach_data.get("improved_answer_structure"),
        follow_up_question=coach_data.get("follow_up_question"),
    )
    db.add(coaching)

    if coach_data.get("follow_up_question"):
        fq = FollowUpQuestion(
            response_id=resp_obj.id,
            question=coach_data.get("follow_up_question"),
            reason="Follow-up generated directly from candidate's spoken response",
        )
        db.add(fq)

    # Save improvement plan if updated
    plan_data = graph_result.get("improvement_plan")
    if plan_data:
        plan = ImprovementPlan(
            candidate_id=session.candidate_id,
            title=plan_data.get("title", "7-Day Personalized Improvement Plan"),
            duration_days=plan_data.get("duration_days", 7),
            overview=plan_data.get("overview"),
            items=json.dumps(plan_data.get("items", [])),
        )
        db.add(plan)

    db.commit()
    db.refresh(resp_obj)

    return resp_obj.to_dict()


@router.post("/interviews/{session_id}/follow-up")
def submit_follow_up_response(
    session_id: str,
    req: FollowUpSubmitRequest,
    db: Session = Depends(get_db),
):
    session = db.query(InterviewSession).filter_by(session_id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Evaluate follow-up answer using LangGraph
    candidate_dict = session.candidate.to_dict() if session.candidate else {}
    initial_state = {
        "candidate_id": session.candidate_id,
        "candidate_profile": candidate_dict,
        "target_role": session.target_role,
        "competency": "Problem Solving",
        "difficulty": session.difficulty,
        "question_type": "technical",
        "current_question": req.follow_up_question,
        "candidate_response": req.response,
        "session_history": [r.to_dict() for r in session.responses],
    }

    graph_result = interview_graph.invoke(initial_state)

    resp_obj = CandidateResponse(
        session_id=session.session_id,
        question_text=f"[Follow-up] {req.follow_up_question}",
        response_type="text",
        response_text=req.response,
    )
    db.add(resp_obj)
    db.flush()

    comm_data = graph_result["communication_analysis"]
    comm_eval = CommunicationEvaluation(
        response_id=resp_obj.id,
        clarity_score=comm_data.get("clarity", 7),
        conciseness_score=comm_data.get("conciseness", 7),
        structure_score=comm_data.get("structure", 7),
        communication_quality_score=comm_data.get("communication_quality", 7),
        filler_words_score=comm_data.get("filler_words", 0),
        strengths=json.dumps(comm_data.get("strengths", [])),
        weaknesses=json.dumps(comm_data.get("weaknesses", [])),
        evidence=json.dumps(comm_data.get("evidence", [])),
    )
    db.add(comm_eval)

    content_data = graph_result["content_evaluation"]
    content_eval = ContentEvaluation(
        response_id=resp_obj.id,
        relevance_score=content_data.get("relevance", 7),
        correctness_score=content_data.get("correctness", 7),
        completeness_score=content_data.get("completeness", 7),
        technical_depth_score=content_data.get("technical_depth", 7),
        evidence_quality_score=content_data.get("evidence_quality", 7),
        strengths=json.dumps(content_data.get("strengths", [])),
        gaps=json.dumps(content_data.get("gaps", [])),
    )
    db.add(content_eval)

    coach_data = graph_result["final_feedback"]
    coaching = CoachingFeedback(
        response_id=resp_obj.id,
        session_id=session.session_id,
        overall_score=coach_data.get("overall_score", 75.0),
        strengths=json.dumps(coach_data.get("strengths", [])),
        improvement_areas=json.dumps(coach_data.get("improvement_areas", [])),
        evidence_items=json.dumps(coach_data.get("evidence_items", [])),
        actionable_advice=json.dumps(coach_data.get("actionable_advice", [])),
        improved_answer_structure=coach_data.get("improved_answer_structure"),
        follow_up_question=coach_data.get("follow_up_question"),
    )
    db.add(coaching)
    db.commit()
    db.refresh(resp_obj)

    return resp_obj.to_dict()


@router.get("/interviews/{session_id}/feedback")
def get_session_feedback(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter_by(session_id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    feedbacks = (
        db.query(CoachingFeedback)
        .filter_by(session_id=session_id)
        .order_by(CoachingFeedback.created_at.desc())
        .all()
    )
    return [fb.to_dict() for fb in feedbacks]
