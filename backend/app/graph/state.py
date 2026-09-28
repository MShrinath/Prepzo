from typing import TypedDict, List, Dict, Any, Optional


class InterviewState(TypedDict, total=False):
    candidate_id: str
    candidate_profile: Dict[str, Any]

    target_role: str
    competency: str
    difficulty: str
    question_type: str

    current_question: str
    candidate_response: str

    transcript: Optional[str]
    audio_metrics: Optional[Dict[str, Any]]

    communication_analysis: Dict[str, Any]
    content_evaluation: Dict[str, Any]
    star_analysis: Dict[str, Any]

    deeper_communication_done: bool
    deeper_content_done: bool

    aggregated_score: float
    final_feedback: Dict[str, Any]

    follow_up_question: str
    recurring_gaps: List[Dict[str, Any]]
    improvement_plan: Dict[str, Any]

    session_history: List[Dict[str, Any]]
    next_action: str
