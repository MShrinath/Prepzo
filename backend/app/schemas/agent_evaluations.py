from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class QuestionAgentOutput(BaseModel):
    question: str = Field(description="The interview question text")
    competency: str = Field(description="The core competency tested by this question")
    difficulty: str = Field(description="easy, medium, or hard")
    question_type: str = Field(description="technical, behavioral, or situational")
    reason: str = Field(description="Explanation of why this question was chosen or generated")
    question_id: Optional[str] = None
    target_gap: Optional[str] = Field(default=None, description="The specific skill, technology, or domain gap being probed by this question")
    context_type: Optional[str] = Field(default=None, description="'project_deep_dive', 'experience_probe', 'gap_probe', or 'role_scenario'")
    resume_reference: Optional[str] = Field(default=None, description="The specific project, company, or metric from the resume referenced by this question")


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


class SkillGapDetail(BaseModel):
    skill_or_domain: str = Field(description="The specific skill, framework, or domain gap from the JD")
    severity: str = Field(default="High", description="Critical, High, or Medium priority gap")
    why_it_matters: str = Field(description="Why this skill or responsibility is vital for this JD and target role")
    current_resume_status: str = Field(description="Observation of what is present or missing in the resume")
    how_to_improve: str = Field(description="Actionable guidance on how to learn, practice, or bridge this gap")
    recommended_projects_or_actions: List[str] = Field(default_factory=list, description="Concrete projects, architectures, or exercises to build and showcase")
    talking_points: Optional[str] = Field(default=None, description="How candidate can frame their adjacent experience in the interview to address this gap")


class StrategicRoadmapPhase(BaseModel):
    phase: str = Field(description="Phase title, e.g. Phase 1: Rapid Ramp-up (Days 1-3)")
    focus: str = Field(description="Core objective of this phase")
    actions: List[str] = Field(default_factory=list, description="Specific action items, tools to master, or exercises")


class GapAnalysisOutput(BaseModel):
    matched_skills: List[str] = Field(default_factory=list, description="Skills and competencies matched between resume and JD")
    missing_skills: List[str] = Field(default_factory=list, description="Skills, tools, or domain experience in the JD not found in the resume")
    experience_level_match: str = Field(description="Assessment of seniority and experience level match")
    tailored_focus_areas: List[str] = Field(default_factory=list, description="Key technical and behavioral focus areas for the interview")
    recommended_technical_questions: List[str] = Field(default_factory=list, description="Technical questions tailored to resume claims and JD needs")
    recommended_gap_probing_questions: List[str] = Field(default_factory=list, description="Behavioral or scenario questions probing gaps")
    role_fit_summary: Optional[str] = Field(default=None, description="Concise evaluation of overall candidate fit for the target role")
    match_score: Optional[int] = Field(default=70, description="Estimated match percentage (0 to 100) between resume and JD")
    skill_gap_details: List[SkillGapDetail] = Field(default_factory=list, description="In-depth analysis of each key gap with recommendations on how to improve")
    improvement_roadmap: List[StrategicRoadmapPhase] = Field(default_factory=list, description="Structured roadmap to bridge candidate's profile to the target JD")
