import random
from typing import Dict, Any, List, Optional
from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import QuestionAgentOutput
from app.services.resume_parser import ResumeJDService


class QuestionAgent:
    def __init__(self, db_session=None):
        self.db = db_session
        self.llm = get_llm(temperature=0.3)

    def select_or_generate_question(
        self,
        mode: str,
        target_role: str,
        difficulty: str = "medium",
        competency: Optional[str] = None,
        topics: Optional[List[str]] = None,
        candidate_profile: Optional[Dict[str, Any]] = None,
        resume_text: Optional[str] = None,
        jd_text: Optional[str] = None,
        previous_questions: Optional[List[str]] = None,
    ) -> QuestionAgentOutput:
        previous_questions = previous_questions or []

        # -------------------------------------------------------------
        # Mode 1: Role Practice
        # -------------------------------------------------------------
        if mode == "role_practice":
            return self._handle_role_practice(
                target_role=target_role,
                difficulty=difficulty,
                competency=competency,
                previous_questions=previous_questions,
            )

        # -------------------------------------------------------------
        # Mode 2: Resume + Job Description
        # -------------------------------------------------------------
        elif mode == "resume_jd":
            return self._handle_resume_jd(
                target_role=target_role,
                difficulty=difficulty,
                resume_text=resume_text,
                jd_text=jd_text,
                candidate_profile=candidate_profile,
                previous_questions=previous_questions,
            )

        # -------------------------------------------------------------
        # Mode 3: HR Round
        # -------------------------------------------------------------
        elif mode == "hr":
            return self._handle_hr_round(
                difficulty=difficulty,
                topics=topics,
                previous_questions=previous_questions,
            )

        # Default fallback
        return self._handle_role_practice("SDE", "medium", None, previous_questions)

    def _handle_role_practice(
        self,
        target_role: str,
        difficulty: str,
        competency: Optional[str],
        previous_questions: List[str],
    ) -> QuestionAgentOutput:
        from app.models.entities import InterviewQuestion

        query = self.db.query(InterviewQuestion).filter(
            InterviewQuestion.role.ilike(f"%{target_role}%")
        )
        if competency:
            query = query.filter(InterviewQuestion.competency.ilike(f"%{competency}%"))

        candidates = query.all()
        # Filter out previously asked
        available = [q for q in candidates if q.question not in previous_questions]
        if not available:
            # Fallback to any difficulty match if all were asked
            available = candidates or self.db.query(InterviewQuestion).all()

        if available:
            # Try to match difficulty
            diff_match = [q for q in available if q.difficulty.lower() == difficulty.lower()]
            selected = random.choice(diff_match if diff_match else available)
            return QuestionAgentOutput(
                question_id=selected.question_id,
                question=selected.question,
                competency=selected.competency,
                difficulty=selected.difficulty,
                question_type=selected.question_type,
                reason=f"Selected curated question for role '{target_role}' targeting competency '{selected.competency}'.",
            )

        return QuestionAgentOutput(
            question_id="default_sde_001",
            question="How would you design a scalable caching layer for an API handling millions of daily requests?",
            competency="Technical Depth & Domain Mastery",
            difficulty=difficulty,
            question_type="technical",
            reason="Curated default question for software engineering.",
        )

    def _handle_resume_jd(
        self,
        target_role: str,
        difficulty: str,
        resume_text: Optional[str],
        jd_text: Optional[str],
        candidate_profile: Optional[Dict[str, Any]],
        previous_questions: List[str],
    ) -> QuestionAgentOutput:
        # If texts are provided, run gap analysis
        resume_content = resume_text or ""
        if not resume_content and candidate_profile:
            # Reconstruct resume snippet from candidate profile
            skills_str = ", ".join([s.get("skill_name", "") for s in candidate_profile.get("skills", [])])
            proj_str = "; ".join([p.get("name", "") + ": " + p.get("description", "") for p in candidate_profile.get("projects", [])])
            resume_content = f"Candidate: {candidate_profile.get('name')}\nSkills: {skills_str}\nProjects: {proj_str}"

        jd_content = jd_text or f"Role: {target_role}. Required skills: Python, Cloud, Docker, System Design, Leadership."

        analysis = ResumeJDService.analyze_gap(resume_content, jd_content)
        tech_questions = analysis.get("recommended_technical_questions", [])
        gap_questions = analysis.get("recommended_gap_probing_questions", [])

        # Alternate between technical grounded in resume and gap-probing
        combined = tech_questions + gap_questions
        available = [q for q in combined if q not in previous_questions]

        if available:
            chosen = available[0]
            is_probing = chosen in gap_questions
            return QuestionAgentOutput(
                question_id=f"resume_jd_{random.randint(100, 999)}",
                question=chosen,
                competency="Ownership & Accountability" if is_probing else "Problem Solving",
                difficulty=difficulty,
                question_type="behavioral" if is_probing else "technical",
                reason="Probing missing skills identified in JD" if is_probing else "Validating technical experience claimed in resume",
            )

        return QuestionAgentOutput(
            question_id="resume_jd_fallback",
            question="Can you explain your contribution to the most complex system architecture on your resume, detailing how you managed trade-offs?",
            competency="Problem Solving",
            difficulty=difficulty,
            question_type="technical",
            reason="Resume grounded baseline question.",
        )

    def _handle_hr_round(
        self,
        difficulty: str,
        topics: Optional[List[str]],
        previous_questions: List[str],
    ) -> QuestionAgentOutput:
        from app.models.entities import InterviewQuestion

        query = self.db.query(InterviewQuestion).filter(
            InterviewQuestion.mode.like("%hr%")
        )
        candidates = query.all()
        available = [q for q in candidates if q.question not in previous_questions]
        if not available:
            available = candidates or self.db.query(InterviewQuestion).filter(InterviewQuestion.role == "HR").all()

        if available:
            selected = random.choice(available)
            return QuestionAgentOutput(
                question_id=selected.question_id,
                question=selected.question,
                competency=selected.competency,
                difficulty=selected.difficulty,
                question_type="behavioral",
                reason=f"Selected HR behavioral question targeting competency '{selected.competency}'.",
            )

        return QuestionAgentOutput(
            question_id="hr_default_001",
            question="Tell me about a time you experienced a conflict with a team member. How did you resolve it?",
            competency="Teamwork & Conflict Resolution",
            difficulty=difficulty,
            question_type="behavioral",
            reason="Core HR behavioral question.",
        )
