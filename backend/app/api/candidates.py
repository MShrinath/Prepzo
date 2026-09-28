import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.entities import (
    CandidateProfile,
    CandidateSkill,
    CandidateProject,
    InterviewSession,
    CandidateResponse,
    CoachingFeedback,
    RecurringGap,
    ImprovementPlan,
)
from app.schemas.candidate import (
    CandidateProfileCreate,
    CandidateProfileUpdate,
    CandidateProfileResponse,
)

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])


@router.post("", response_model=CandidateProfileResponse)
def create_candidate_profile(req: CandidateProfileCreate, db: Session = Depends(get_db)):
    existing = db.query(CandidateProfile).filter_by(candidate_id=req.candidate_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Candidate ID already exists")

    profile = CandidateProfile(
        candidate_id=req.candidate_id,
        name=req.name,
        email=req.email,
        target_role=req.target_role,
        experience_years=req.experience_years,
        education=req.education,
        bio=req.bio,
        target_competencies=json.dumps(req.target_competencies),
    )
    db.add(profile)
    db.flush()

    for s in req.skills:
        skill = CandidateSkill(
            candidate_id=profile.candidate_id,
            skill_name=s.skill_name,
            proficiency=s.proficiency,
            category=s.category,
        )
        db.add(skill)

    for p in req.projects:
        proj = CandidateProject(
            candidate_id=profile.candidate_id,
            name=p.name,
            description=p.description,
            technologies=json.dumps(p.technologies),
            role=p.role,
            measurable_impact=p.measurable_impact,
        )
        db.add(proj)

    db.commit()
    db.refresh(profile)
    return profile.to_dict()


@router.get("/{candidate_id}", response_model=CandidateProfileResponse)
def get_candidate_profile(candidate_id: str, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return profile.to_dict()


@router.put("/{candidate_id}", response_model=CandidateProfileResponse)
def update_candidate_profile(candidate_id: str, req: CandidateProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if req.name is not None:
        profile.name = req.name
    if req.email is not None:
        profile.email = req.email
    if req.target_role is not None:
        profile.target_role = req.target_role
    if req.experience_years is not None:
        profile.experience_years = req.experience_years
    if req.education is not None:
        profile.education = req.education
    if req.bio is not None:
        profile.bio = req.bio
    if req.target_competencies is not None:
        profile.target_competencies = json.dumps(req.target_competencies)

    db.commit()
    db.refresh(profile)
    return profile.to_dict()


@router.get("/{candidate_id}/progress")
def get_candidate_progress(candidate_id: str, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Fetch all candidate sessions
    sessions = db.query(InterviewSession).filter_by(candidate_id=candidate_id).order_by(InterviewSession.created_at.asc()).all()

    session_scores = []
    communication_scores = []
    content_scores = []
    structure_scores = []

    for s in sessions:
        for resp in s.responses:
            if resp.coaching_feedback:
                fb = resp.coaching_feedback
                comm = resp.communication_evaluation
                cont = resp.content_evaluation
                star = resp.star_evaluation

                session_scores.append({
                    "session_id": s.session_id,
                    "date": s.created_at.strftime("%b %d, %H:%M") if s.created_at else "",
                    "overall_score": fb.overall_score,
                    "mode": s.mode,
                    "target_role": s.target_role,
                    "communication": comm.communication_quality_score * 10 if comm else 70,
                    "content": cont.relevance_score * 10 if cont else 70,
                    "structure": star.situation_score * 10 if star and star.applicable else 70,
                })
                if comm:
                    communication_scores.append(comm.communication_quality_score * 10)
                if cont:
                    content_scores.append(cont.relevance_score * 10)

    # Average metrics
    avg_overall = round(sum(s["overall_score"] for s in session_scores) / len(session_scores), 1) if session_scores else 0
    avg_comm = round(sum(communication_scores) / len(communication_scores), 1) if communication_scores else 0
    avg_content = round(sum(content_scores) / len(content_scores), 1) if content_scores else 0

    return {
        "candidate_id": candidate_id,
        "candidate_name": profile.name,
        "target_role": profile.target_role,
        "total_sessions": len(sessions),
        "total_responses": len(session_scores),
        "average_overall_score": avg_overall,
        "average_communication_score": avg_comm,
        "average_content_score": avg_content,
        "timeline": session_scores,
    }


@router.get("/{candidate_id}/recurring-gaps")
def get_candidate_recurring_gaps(candidate_id: str, db: Session = Depends(get_db)):
    gaps = db.query(RecurringGap).filter_by(candidate_id=candidate_id).order_by(RecurringGap.occurrence_count.desc()).all()
    return [g.to_dict() for g in gaps]


@router.get("/{candidate_id}/improvement-plan")
def get_candidate_improvement_plan(candidate_id: str, db: Session = Depends(get_db)):
    plan = db.query(ImprovementPlan).filter_by(candidate_id=candidate_id).order_by(ImprovementPlan.created_at.desc()).first()
    if not plan:
        # If no plan generated yet, produce default plan
        profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
        from app.agents.coach_agent import CoachAgent
        coach = CoachAgent()
        plan_obj = coach.generate_improvement_plan(
            target_role=profile.target_role if profile else "SDE",
            recurring_gaps=[],
            candidate_name=profile.name if profile else "Candidate"
        )
        return plan_obj.model_dump()
    return plan.to_dict()
