import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
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
from app.services.resume_parser import ResumeJDService
from app.services.capability_matcher import CapabilityMatcher

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])


class CandidateLoginRequest(BaseModel):
    candidate_id: Optional[str] = None
    identifier: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    target_role: Optional[str] = None


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
        if candidate_id == "candidate_001":
            from app.database.connection import seed_defaults
            seed_defaults()
            profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")
    return profile.to_dict()


@router.put("/{candidate_id}", response_model=CandidateProfileResponse)
def update_candidate_profile(candidate_id: str, req: CandidateProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not profile:
        profile = CandidateProfile(
            candidate_id=candidate_id,
            name=req.name or "Candidate",
            email=req.email,
            target_role=req.target_role or "SDE",
            experience_years=req.experience_years or 0,
            education=req.education,
            bio=req.bio,
            target_competencies=json.dumps(req.target_competencies or [
                "Problem Solving",
                "Technical Depth & Domain Mastery",
                "Communication & Clarity",
                "Ownership & Accountability",
            ]),
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile.to_dict()

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
        if candidate_id == "candidate_001":
            from app.database.connection import seed_defaults
            seed_defaults()
            profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    
    if not profile:
        return {
            "candidate_id": candidate_id,
            "candidate_name": "Candidate",
            "target_role": "SDE",
            "total_sessions": 0,
            "total_responses": 0,
            "average_overall_score": 0,
            "average_communication_score": 0,
            "average_content_score": 0,
            "timeline": [],
        }

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


@router.delete("/{candidate_id}/sessions")
def clear_candidate_sessions(candidate_id: str, db: Session = Depends(get_db)):
    """Deletes all session history, responses, evaluations, feedback, and gap records for a candidate to start fresh."""
    sessions = db.query(InterviewSession).filter_by(candidate_id=candidate_id).all()
    for s in sessions:
        db.delete(s)
    db.query(RecurringGap).filter_by(candidate_id=candidate_id).delete()
    db.query(ImprovementPlan).filter_by(candidate_id=candidate_id).delete()
    db.commit()
    return {"status": "success", "message": f"Successfully cleared all sessions for candidate '{candidate_id}'."}


@router.post("/login")
def login_or_register_candidate(req: CandidateLoginRequest, db: Session = Depends(get_db)):
    """
    Log in an existing candidate by ID or email, or auto-create a new candidate profile.
    """
    target_id = (req.candidate_id or req.identifier or "").strip()
    profile = None

    if target_id:
        profile = db.query(CandidateProfile).filter(
            (CandidateProfile.candidate_id == target_id) |
            (CandidateProfile.email.ilike(target_id))
        ).first()
    elif req.email and req.email.strip():
        profile = db.query(CandidateProfile).filter(CandidateProfile.email.ilike(req.email.strip())).first()
    elif req.name and req.name.strip():
        profile = db.query(CandidateProfile).filter(CandidateProfile.name.ilike(req.name.strip())).first()

    if not profile and target_id == "candidate_001":
        from app.database.connection import seed_defaults
        seed_defaults()
        profile = db.query(CandidateProfile).filter_by(candidate_id="candidate_001").first()

    if not profile:
        import uuid
        cand_id = target_id or f"cand_{uuid.uuid4().hex[:8]}"
        display_name = req.name or (req.email.split('@')[0].title() if req.email else "Candidate")
        target_role = req.target_role or "SDE"
        profile = CandidateProfile(
            candidate_id=cand_id,
            name=display_name,
            email=req.email or f"{cand_id}@example.com",
            target_role=target_role,
            experience_years=2,
            education="B.S. in Computer Science",
            bio=f"Passionate {target_role} specializing in modern software development and engineering best practices.",
            target_competencies=json.dumps([
                "Problem Solving",
                "Technical Depth & Domain Mastery",
                "Communication & Clarity",
                "Ownership & Accountability",
            ]),
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile.to_dict()


@router.post("/{candidate_id}/resume")
async def upload_and_sync_resume(
    candidate_id: str,
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload resume file (.pdf, .txt) or submit resume text.
    Extracts skills, experience, projects, updates candidate profile,
    and returns role capabilities, project stats, and profile summary.
    """
    profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not profile:
        if candidate_id == "candidate_001":
            from app.database.connection import seed_defaults
            seed_defaults()
            profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

    extracted_text = (resume_text or "").strip()
    if resume_file:
        file_bytes = await resume_file.read()
        if resume_file.filename.lower().endswith(".pdf"):
            extracted_text = ResumeJDService.extract_text_from_pdf(file_bytes)
        else:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")

    if not extracted_text:
        raise HTTPException(status_code=400, detail="No readable resume text provided.")

    # Parse resume with AI / heuristic service
    parsed = ResumeJDService.parse_resume(extracted_text)

    # Update candidate profile fields
    if parsed.get("experience_years"):
        profile.experience_years = max(profile.experience_years or 0, parsed["experience_years"])
    if parsed.get("email") and not profile.email:
        profile.email = parsed["email"]
    
    # Update bio summary
    if extracted_text:
        profile.bio = extracted_text[:350].replace('\n', ' ')

    # Sync skills
    existing_skills = {s.skill_name.lower() for s in profile.skills}
    for s_name in parsed.get("skills", []):
        if s_name.lower() not in existing_skills:
            new_skill = CandidateSkill(
                candidate_id=profile.candidate_id,
                skill_name=s_name,
                proficiency="Intermediate",
                category="Technical",
            )
            db.add(new_skill)
            existing_skills.add(s_name.lower())

    # Sync detected projects
    existing_projs = {p.name.lower() for p in profile.projects}
    for p_line in parsed.get("detected_projects", []):
        p_title = p_line.split(":")[0].strip() if ":" in p_line else p_line[:40].strip()
        if p_title.lower() not in existing_projs:
            new_proj = CandidateProject(
                candidate_id=profile.candidate_id,
                name=p_title,
                description=p_line[:250],
                technologies=json.dumps(parsed.get("skills", [])[:5]),
                role="Software Engineer",
                measurable_impact="Demonstrated production implementation from resume portfolio.",
            )
            db.add(new_proj)
            existing_projs.add(p_title.lower())

    db.commit()
    db.refresh(profile)

    # Evaluate role capabilities & summary
    skills_list = [s.skill_name for s in profile.skills]
    projs_list = [p.to_dict() for p in profile.projects]

    capabilities = CapabilityMatcher.evaluate_role_capabilities(
        candidate_skills=skills_list,
        experience_years=profile.experience_years or 2,
        projects=projs_list,
        bio=profile.bio or ""
    )
    summary_data = CapabilityMatcher.generate_profile_summary(
        name=profile.name,
        target_role=profile.target_role,
        experience_years=profile.experience_years or 2,
        skills=skills_list,
        projects=projs_list,
        bio=profile.bio or ""
    )

    result = profile.to_dict()
    result["capabilities"] = capabilities
    result["profile_summary"] = summary_data["executive_summary"]
    result["seniority_level"] = summary_data["seniority_level"]
    result["project_stats"] = summary_data["project_stats"]
    return result


@router.get("/{candidate_id}/capabilities")
def get_candidate_capabilities(candidate_id: str, db: Session = Depends(get_db)):
    """
    Get role capabilities, project stats, and profile summary for a candidate.
    """
    profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
    if not profile:
        if candidate_id == "candidate_001":
            from app.database.connection import seed_defaults
            seed_defaults()
            profile = db.query(CandidateProfile).filter_by(candidate_id=candidate_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate not found")

    skills_list = [s.skill_name for s in profile.skills]
    projs_list = [p.to_dict() for p in profile.projects]

    capabilities = CapabilityMatcher.evaluate_role_capabilities(
        candidate_skills=skills_list,
        experience_years=profile.experience_years or 2,
        projects=projs_list,
        bio=profile.bio or ""
    )
    summary_data = CapabilityMatcher.generate_profile_summary(
        name=profile.name,
        target_role=profile.target_role,
        experience_years=profile.experience_years or 2,
        skills=skills_list,
        projects=projs_list,
        bio=profile.bio or ""
    )

    return {
        "candidate_id": profile.candidate_id,
        "name": profile.name,
        "target_role": profile.target_role,
        "experience_years": profile.experience_years,
        "seniority_level": summary_data["seniority_level"],
        "profile_summary": summary_data["executive_summary"],
        "project_stats": summary_data["project_stats"],
        "capabilities": capabilities,
    }

