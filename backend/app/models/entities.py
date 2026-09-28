import datetime
import uuid
import json
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.database.connection import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    target_role = Column(String, default="SDE")
    experience_years = Column(Integer, default=1)
    education = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    target_competencies = Column(Text, default="[]")  # JSON string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    skills = relationship("CandidateSkill", back_populates="profile", cascade="all, delete-orphan")
    projects = relationship("CandidateProject", back_populates="profile", cascade="all, delete-orphan")
    sessions = relationship("InterviewSession", back_populates="candidate", cascade="all, delete-orphan")
    recurring_gaps = relationship("RecurringGap", back_populates="candidate", cascade="all, delete-orphan")
    improvement_plans = relationship("ImprovementPlan", back_populates="candidate", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "name": self.name,
            "email": self.email,
            "target_role": self.target_role,
            "experience_years": self.experience_years,
            "education": self.education,
            "bio": self.bio,
            "target_competencies": json.loads(self.target_competencies) if self.target_competencies else [],
            "skills": [s.to_dict() for s in self.skills] if self.skills else [],
            "projects": [p.to_dict() for p in self.projects] if self.projects else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidate_profiles.candidate_id"), nullable=False)
    skill_name = Column(String, nullable=False)
    proficiency = Column(String, default="Intermediate")
    category = Column(String, default="Technical")

    profile = relationship("CandidateProfile", back_populates="skills")

    def to_dict(self):
        return {
            "id": self.id,
            "skill_name": self.skill_name,
            "proficiency": self.proficiency,
            "category": self.category,
        }


class CandidateProject(Base):
    __tablename__ = "candidate_projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidate_profiles.candidate_id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    technologies = Column(Text, default="[]")  # JSON list
    role = Column(String, nullable=True)
    measurable_impact = Column(Text, nullable=True)

    profile = relationship("CandidateProfile", back_populates="projects")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "technologies": json.loads(self.technologies) if self.technologies else [],
            "role": self.role,
            "measurable_impact": self.measurable_impact,
        }


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(String, unique=True, index=True, nullable=False)
    question = Column(Text, nullable=False)
    mode = Column(Text, default="[\"role_practice\"]")  # JSON list e.g. ["role_practice", "hr"]
    role = Column(String, index=True, nullable=False, default="SDE")
    competency = Column(String, index=True, nullable=False)
    difficulty = Column(String, default="medium")  # easy, medium, hard
    question_type = Column(String, default="technical")  # technical, behavioral, situational
    category = Column(String, nullable=True)
    tags = Column(Text, default="[]")  # JSON list
    expected_competencies = Column(Text, default="[]")  # JSON list
    evaluation_criteria = Column(Text, default="[]")  # JSON list
    follow_up_template = Column(Text, nullable=True)
    is_preset = Column(Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "question_id": self.question_id,
            "question": self.question,
            "mode": json.loads(self.mode) if self.mode else [],
            "role": self.role,
            "competency": self.competency,
            "difficulty": self.difficulty,
            "question_type": self.question_type,
            "category": self.category,
            "tags": json.loads(self.tags) if self.tags else [],
            "expected_competencies": json.loads(self.expected_competencies) if self.expected_competencies else [],
            "evaluation_criteria": json.loads(self.evaluation_criteria) if self.evaluation_criteria else [],
            "follow_up_template": self.follow_up_template,
            "is_preset": self.is_preset,
        }


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, unique=True, index=True, nullable=False)
    candidate_id = Column(String, ForeignKey("candidate_profiles.candidate_id"), nullable=False)
    mode = Column(String, default="role_practice")  # role_practice, resume_jd, hr
    target_role = Column(String, default="SDE")
    difficulty = Column(String, default="medium")
    competency = Column(String, nullable=True)
    topics = Column(Text, default="[]")  # JSON list for HR round
    resume_text = Column(Text, nullable=True)
    jd_text = Column(Text, nullable=True)
    gap_analysis = Column(Text, nullable=True)  # JSON
    status = Column(String, default="active")  # active, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="sessions")
    responses = relationship("CandidateResponse", back_populates="session", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "candidate_id": self.candidate_id,
            "mode": self.mode,
            "target_role": self.target_role,
            "difficulty": self.difficulty,
            "competency": self.competency,
            "topics": json.loads(self.topics) if self.topics else [],
            "resume_text": self.resume_text,
            "jd_text": self.jd_text,
            "gap_analysis": json.loads(self.gap_analysis) if self.gap_analysis else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class CandidateResponse(Base):
    __tablename__ = "candidate_responses"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("interview_sessions.session_id"), nullable=False)
    question_id = Column(String, nullable=True)
    question_text = Column(Text, nullable=False)
    response_type = Column(String, default="text")  # text, voice
    response_text = Column(Text, nullable=False)
    transcript = Column(Text, nullable=True)
    audio_url = Column(String, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    speaking_rate = Column(Float, nullable=True)
    pause_count = Column(Integer, nullable=True)
    filler_words_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    session = relationship("InterviewSession", back_populates="responses")
    communication_evaluation = relationship("CommunicationEvaluation", uselist=False, back_populates="response", cascade="all, delete-orphan")
    content_evaluation = relationship("ContentEvaluation", uselist=False, back_populates="response", cascade="all, delete-orphan")
    star_evaluation = relationship("STAREvaluation", uselist=False, back_populates="response", cascade="all, delete-orphan")
    coaching_feedback = relationship("CoachingFeedback", uselist=False, back_populates="response", cascade="all, delete-orphan")
    follow_up_questions = relationship("FollowUpQuestion", back_populates="response", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "question_id": self.question_id,
            "question_text": self.question_text,
            "response_type": self.response_type,
            "response_text": self.response_text,
            "transcript": self.transcript,
            "audio_url": self.audio_url,
            "duration_seconds": self.duration_seconds,
            "speaking_rate": self.speaking_rate,
            "pause_count": self.pause_count,
            "filler_words_count": self.filler_words_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "communication_evaluation": self.communication_evaluation.to_dict() if self.communication_evaluation else None,
            "content_evaluation": self.content_evaluation.to_dict() if self.content_evaluation else None,
            "star_evaluation": self.star_evaluation.to_dict() if self.star_evaluation else None,
            "coaching_feedback": self.coaching_feedback.to_dict() if self.coaching_feedback else None,
        }


class CommunicationEvaluation(Base):
    __tablename__ = "communication_evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    response_id = Column(String, ForeignKey("candidate_responses.id"), nullable=False)
    clarity_score = Column(Float, default=0.0)
    conciseness_score = Column(Float, default=0.0)
    structure_score = Column(Float, default=0.0)
    communication_quality_score = Column(Float, default=0.0)
    filler_words_score = Column(Float, default=0.0)
    strengths = Column(Text, default="[]")  # JSON list
    weaknesses = Column(Text, default="[]")  # JSON list
    evidence = Column(Text, default="[]")  # JSON list
    audio_metrics = Column(Text, default="{}")  # JSON dict
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    response = relationship("CandidateResponse", back_populates="communication_evaluation")

    def to_dict(self):
        return {
            "id": self.id,
            "clarity_score": self.clarity_score,
            "conciseness_score": self.conciseness_score,
            "structure_score": self.structure_score,
            "communication_quality_score": self.communication_quality_score,
            "filler_words_score": self.filler_words_score,
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "weaknesses": json.loads(self.weaknesses) if self.weaknesses else [],
            "evidence": json.loads(self.evidence) if self.evidence else [],
            "audio_metrics": json.loads(self.audio_metrics) if self.audio_metrics else {},
        }


class ContentEvaluation(Base):
    __tablename__ = "content_evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    response_id = Column(String, ForeignKey("candidate_responses.id"), nullable=False)
    relevance_score = Column(Float, default=0.0)
    correctness_score = Column(Float, default=0.0)
    completeness_score = Column(Float, default=0.0)
    technical_depth_score = Column(Float, default=0.0)
    evidence_quality_score = Column(Float, default=0.0)
    strengths = Column(Text, default="[]")  # JSON list
    gaps = Column(Text, default="[]")  # JSON list
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    response = relationship("CandidateResponse", back_populates="content_evaluation")

    def to_dict(self):
        return {
            "id": self.id,
            "relevance_score": self.relevance_score,
            "correctness_score": self.correctness_score,
            "completeness_score": self.completeness_score,
            "technical_depth_score": self.technical_depth_score,
            "evidence_quality_score": self.evidence_quality_score,
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "gaps": json.loads(self.gaps) if self.gaps else [],
        }


class STAREvaluation(Base):
    __tablename__ = "star_evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    response_id = Column(String, ForeignKey("candidate_responses.id"), nullable=False)
    applicable = Column(Boolean, default=True)
    situation_score = Column(Float, default=0.0)
    situation_evidence = Column(Text, nullable=True)
    task_score = Column(Float, default=0.0)
    task_evidence = Column(Text, nullable=True)
    action_score = Column(Float, default=0.0)
    action_evidence = Column(Text, nullable=True)
    result_score = Column(Float, default=0.0)
    result_evidence = Column(Text, nullable=True)
    restructuring_recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    response = relationship("CandidateResponse", back_populates="star_evaluation")

    def to_dict(self):
        return {
            "id": self.id,
            "applicable": self.applicable,
            "situation": {"score": self.situation_score, "evidence": self.situation_evidence},
            "task": {"score": self.task_score, "evidence": self.task_evidence},
            "action": {"score": self.action_score, "evidence": self.action_evidence},
            "result": {"score": self.result_score, "evidence": self.result_evidence},
            "restructuring_recommendation": self.restructuring_recommendation,
        }


class CoachingFeedback(Base):
    __tablename__ = "coaching_feedback"

    id = Column(String, primary_key=True, default=generate_uuid)
    response_id = Column(String, ForeignKey("candidate_responses.id"), nullable=False)
    session_id = Column(String, nullable=False)
    overall_score = Column(Float, default=0.0)
    strengths = Column(Text, default="[]")  # JSON list
    improvement_areas = Column(Text, default="[]")  # JSON list
    evidence_items = Column(Text, default="[]")  # JSON list of dicts {issue, severity, evidence, recommendation}
    actionable_advice = Column(Text, default="[]")  # JSON list
    improved_answer_structure = Column(Text, nullable=True)
    follow_up_question = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    response = relationship("CandidateResponse", back_populates="coaching_feedback")

    def to_dict(self):
        return {
            "id": self.id,
            "overall_score": self.overall_score,
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "improvement_areas": json.loads(self.improvement_areas) if self.improvement_areas else [],
            "evidence_items": json.loads(self.evidence_items) if self.evidence_items else [],
            "actionable_advice": json.loads(self.actionable_advice) if self.actionable_advice else [],
            "improved_answer_structure": self.improved_answer_structure,
            "follow_up_question": self.follow_up_question,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class FollowUpQuestion(Base):
    __tablename__ = "follow_up_questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    response_id = Column(String, ForeignKey("candidate_responses.id"), nullable=False)
    question = Column(Text, nullable=False)
    reason = Column(Text, nullable=True)
    targeted_weakness = Column(String, nullable=True)
    answered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    response = relationship("CandidateResponse", back_populates="follow_up_questions")

    def to_dict(self):
        return {
            "id": self.id,
            "question": self.question,
            "reason": self.reason,
            "targeted_weakness": self.targeted_weakness,
            "answered": self.answered,
        }


class RecurringGap(Base):
    __tablename__ = "recurring_gaps"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidate_profiles.candidate_id"), nullable=False)
    gap_category = Column(String, nullable=False)  # e.g., "Missing measurable outcomes", "Weak personal ownership", "Unstructured answer"
    description = Column(Text, nullable=False)
    occurrence_count = Column(Integer, default=1)
    first_detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_detected_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    status = Column(String, default="active")  # active, improving, resolved

    candidate = relationship("CandidateProfile", back_populates="recurring_gaps")

    def to_dict(self):
        return {
            "id": self.id,
            "gap_category": self.gap_category,
            "description": self.description,
            "occurrence_count": self.occurrence_count,
            "first_detected_at": self.first_detected_at.isoformat() if self.first_detected_at else None,
            "last_detected_at": self.last_detected_at.isoformat() if self.last_detected_at else None,
            "status": self.status,
        }


class ImprovementPlan(Base):
    __tablename__ = "improvement_plans"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidate_profiles.candidate_id"), nullable=False)
    title = Column(String, default="7-Day Personalized Improvement Plan")
    duration_days = Column(Integer, default=7)
    overview = Column(Text, nullable=True)
    items = Column(Text, default="[]")  # JSON list of {day: 1, focus: "...", task: "...", tips: "..."}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    candidate = relationship("CandidateProfile", back_populates="improvement_plans")

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "title": self.title,
            "duration_days": self.duration_days,
            "overview": self.overview,
            "items": json.loads(self.items) if self.items else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
