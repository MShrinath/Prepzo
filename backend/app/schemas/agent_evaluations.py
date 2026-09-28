from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class QuestionAgentOutput(BaseModel):
    question: str = Field(description="The interview question text")
    competency: str = Field(description="The core competency tested by this question")
    difficulty: str = Field(description="easy, medium, or hard")
    question_type: str = Field(description="technical, behavioral, or situational")
    reason: str = Field(description="Explanation of why this question was chosen or generated")
    question_id: Optional[str] = None


class CommunicationEvaluationOutput(BaseModel):
    clarity: int = Field(ge=1, le=10, description="Clarity of expression, articulation (1-10)")
    conciseness: int = Field(ge=1, le=10, description="Ability to communicate without unnecessary rambling (1-10)")
    structure: int = Field(ge=1, le=10, description="Logical organization and coherence (1-10)")
    communication_quality: int = Field(ge=1, le=10, description="Overall communication effectiveness (1-10)")
    filler_words: int = Field(default=0, description="Estimated count or penalty for filler words")
    strengths: List[str] = Field(default_factory=list, description="Specific communication strengths demonstrated")
    weaknesses: List[str] = Field(default_factory=list, description="Identified communication weaknesses")
    evidence: List[str] = Field(default_factory=list, description="Direct quotes or concrete observations from the answer")
    audio_metrics: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Speaking rate, pause metrics if voice")


class ContentEvaluationOutput(BaseModel):
    relevance: int = Field(ge=1, le=10, description="Did the answer directly address the prompt? (1-10)")
    correctness: int = Field(ge=1, le=10, description="Technical accuracy and validity of claims (1-10)")
    completeness: int = Field(ge=1, le=10, description="Did it cover essential aspects of the question? (1-10)")
    technical_depth: int = Field(ge=1, le=10, description="Appropriate depth and domain proficiency (1-10)")
    evidence_quality: int = Field(ge=1, le=10, description="Quality of concrete examples, metrics, or technologies cited (1-10)")
    strengths: List[str] = Field(default_factory=list, description="Substantive strengths in the content")
    gaps: List[str] = Field(default_factory=list, description="Missing details, unaddressed requirements, or inaccuracies")


class STARComponent(BaseModel):
    score: int = Field(ge=1, le=10, description="Component score (1-10)")
    evidence: str = Field(description="Evidence or explanation of candidate's coverage of this component")


class STAREvaluationOutput(BaseModel):
    applicable: bool = Field(default=True, description="Whether STAR methodology applies to this question type")
    reason: Optional[str] = Field(default=None, description="Explanation if STAR is not applicable")
    situation: STARComponent = Field(default_factory=lambda: STARComponent(score=5, evidence="Context provided"))
    task: STARComponent = Field(default_factory=lambda: STARComponent(score=5, evidence="Task specified"))
    action: STARComponent = Field(default_factory=lambda: STARComponent(score=5, evidence="Actions detailed"))
    result: STARComponent = Field(default_factory=lambda: STARComponent(score=5, evidence="Results described"))
    restructuring_recommendation: Optional[str] = Field(
        default=None,
        description="Guidance on how to reorder or reframe the response using the STAR method"
    )


class EvidenceItem(BaseModel):
    issue: str = Field(description="The specific deficiency or observation")
    severity: str = Field(description="low, medium, or high")
    evidence: str = Field(description="Concrete excerpt or observation from the candidate's response")
    recommendation: str = Field(description="Actionable suggestion to resolve this issue")


class CoachFeedbackOutput(BaseModel):
    overall_score: float = Field(ge=0, le=100, description="Aggregated overall score out of 100")
    strengths: List[str] = Field(description="Top consolidated strengths across all dimensions")
    improvement_areas: List[str] = Field(description="Top prioritized areas for improvement")
    evidence_items: List[EvidenceItem] = Field(description="Detailed evidence-backed findings")
    actionable_advice: List[str] = Field(description="Step-by-step guidance on how to improve next time")
    improved_answer_structure: Optional[str] = Field(
        default=None,
        description="An example of how the candidate could restructure their answer for maximum impact"
    )
    follow_up_question: Optional[str] = Field(
        default=None,
        description="A tailored follow-up question probing unaddressed details or challenging gaps"
    )


class ImprovementPlanItem(BaseModel):
    day: int
    focus: str
    task: str
    tips: str


class ImprovementPlanOutput(BaseModel):
    title: str = "7-Day Personalized Improvement Plan"
    duration_days: int = 7
    overview: str
    items: List[ImprovementPlanItem]


class GapAnalysisOutput(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    experience_level_match: str
    tailored_focus_areas: List[str]
    recommended_technical_questions: List[str]
    recommended_gap_probing_questions: List[str]
