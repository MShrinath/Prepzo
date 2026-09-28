from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.schemas.agent_evaluations import (
    CommunicationEvaluationOutput,
    ContentEvaluationOutput,
    STAREvaluationOutput,
    CoachFeedbackOutput,
    GapAnalysisOutput,
)


class RolePracticeStartRequest(BaseModel):
    candidate_id: str
    role: str = "SDE"
    difficulty: str = "medium"
    competency: Optional[str] = None


class ResumeJDStartRequest(BaseModel):
    candidate_id: str
    target_role: Optional[str] = "SDE"
    difficulty: str = "medium"
    job_description: str
    resume_text: Optional[str] = None


class HRStartRequest(BaseModel):
    candidate_id: str
    difficulty: str = "medium"
    topics: List[str] = ["conflict_resolution", "receiving_feedback", "stress_management"]


class GenericInterviewStartRequest(BaseModel):
    candidate_id: str
    target_role: Optional[str] = "SDE"
    difficulty: str = "medium"
    question_type: Optional[str] = "technical"
    mode: Optional[str] = "role_practice"
    competency: Optional[str] = None


class TextResponseSubmitRequest(BaseModel):
    response: str
    question_id: Optional[str] = None
    question_text: Optional[str] = None


class GenericTextResponseRequest(BaseModel):
    session_id: str
    response: str
    question_id: Optional[str] = None
    question_text: Optional[str] = None


class FollowUpSubmitRequest(BaseModel):
    response: str
    follow_up_question: str


class SessionResponse(BaseModel):
    session_id: str
    candidate_id: str
    mode: str
    target_role: str
    difficulty: str
    competency: Optional[str] = None
    topics: List[str] = []
    status: str
    gap_analysis: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class QuestionDetailResponse(BaseModel):
    question_id: str
    question: str
    role: str
    competency: str
    difficulty: str
    question_type: str
    reason: Optional[str] = None
    expected_competencies: List[str] = []
    evaluation_criteria: List[str] = []


class FullEvaluationResultResponse(BaseModel):
    response_id: str
    session_id: str
    question_text: str
    response_type: str
    response_text: str
    transcript: Optional[str] = None
    communication: CommunicationEvaluationOutput
    content: ContentEvaluationOutput
    star: STAREvaluationOutput
    coach: CoachFeedbackOutput
