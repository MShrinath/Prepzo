import logging
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, START, END

from app.graph.state import InterviewState
from app.agents.communication_agent import CommunicationAgent
from app.agents.content_agent import ContentAgent
from app.agents.star_agent import STARAgent
from app.agents.coach_agent import CoachAgent
from app.schemas.agent_evaluations import (
    CommunicationEvaluationOutput,
    ContentEvaluationOutput,
    STAREvaluationOutput,
)

logger = logging.getLogger(__name__)


def create_interview_workflow():
    comm_agent = CommunicationAgent()
    content_agent = ContentAgent()
    star_agent = STARAgent()
    coach_agent = CoachAgent()

    # Define Node functions
    def node_communication(state: InterviewState) -> Dict[str, Any]:
        question = state.get("current_question", "")
        response_text = state.get("candidate_response", "")
        audio_metrics = state.get("audio_metrics")

        result = comm_agent.analyze(question, response_text, audio_metrics)
        return {"communication_analysis": result.model_dump()}

    def node_content(state: InterviewState) -> Dict[str, Any]:
        question = state.get("current_question", "")
        response_text = state.get("candidate_response", "")
        competency = state.get("competency")
        question_type = state.get("question_type", "technical")
        mode = state.get("mode")

        result = content_agent.evaluate(
            question,
            response_text,
            competency=competency,
            question_type=question_type,
            mode=mode,
        )
        return {"content_evaluation": result.model_dump()}

    def node_star(state: InterviewState) -> Dict[str, Any]:
        question = state.get("current_question", "")
        question_type = state.get("question_type", "technical")
        response_text = state.get("candidate_response", "")

        result = star_agent.evaluate(question, question_type, response_text)
        return {"star_analysis": result.model_dump()}

    def node_evaluation_merger(state: InterviewState) -> Dict[str, Any]:
        # Merge specialist results and check if deeper analysis is needed
        comm_data = state.get("communication_analysis", {})
        content_data = state.get("content_evaluation", {})
        mode = state.get("mode")
        q_type = state.get("question_type", "technical")
        is_hr = (mode == "hr") or (q_type == "behavioral")

        clarity = comm_data.get("clarity", 10)
        depth = content_data.get("technical_depth", 10)

        # In HR mode, prioritize clarity; do not trigger deeper code diagnostic if clarity is acceptable
        needs_deeper = clarity < 6 or (depth < 6 and not is_hr)
        return {"next_action": "deeper_analysis" if needs_deeper else "coach_synthesis"}

    def node_deeper_analysis(state: InterviewState) -> Dict[str, Any]:
        # Specialist agent handoff for deeper diagnostic
        comm_data = state.get("communication_analysis", {})
        content_data = state.get("content_evaluation", {})

        if comm_data.get("clarity", 10) < 6:
            comm_data["weaknesses"].append("Deep diagnostic: High cognitive load required to parse response logic.")
            comm_data["evidence"].append("Detailed sentence-level clarity breakdown indicated ambiguous antecedent references.")

        if content_data.get("technical_depth", 10) < 6:
            content_data["gaps"].append("Deep diagnostic: Absence of underlying system mechanics, concurrency, or algorithmic invariants.")

        return {
            "communication_analysis": comm_data,
            "content_evaluation": content_data,
            "deeper_communication_done": True,
            "next_action": "coach_synthesis"
        }

    def node_coach_synthesis(state: InterviewState) -> Dict[str, Any]:
        question = state.get("current_question", "")
        response_text = state.get("candidate_response", "")
        comm_data = CommunicationEvaluationOutput(**state.get("communication_analysis", {}))
        content_data = ContentEvaluationOutput(**state.get("content_evaluation", {}))
        star_data = STAREvaluationOutput(**state.get("star_analysis", {}))
        candidate_profile = state.get("candidate_profile")
        session_history = state.get("session_history", [])
        mode = state.get("mode") or ("hr" if state.get("question_type") == "behavioral" else "role_practice")
        question_type = state.get("question_type")

        feedback = coach_agent.synthesize_feedback(
            question=question,
            response_text=response_text,
            communication=comm_data,
            content=content_data,
            star=star_data,
            candidate_profile=candidate_profile,
            session_history=session_history,
            mode=mode,
            question_type=question_type,
        )

        recurring = coach_agent.detect_recurring_gaps(session_history)
        target_role = state.get("target_role", "SDE")
        candidate_name = candidate_profile.get("name", "Candidate") if candidate_profile else "Candidate"
        plan = coach_agent.generate_improvement_plan(
            target_role=target_role,
            recurring_gaps=recurring,
            candidate_name=candidate_name,
            latest_feedback=feedback.model_dump(),
            mode=mode,
        )

        return {
            "final_feedback": feedback.model_dump(),
            "aggregated_score": feedback.overall_score,
            "follow_up_question": feedback.follow_up_question or "",
            "recurring_gaps": recurring,
            "improvement_plan": plan.model_dump(),
            "next_action": "complete",
        }

    # Conditional routing function
    def route_after_merger(state: InterviewState) -> Literal["deeper_analysis", "coach_synthesis"]:
        return state.get("next_action", "coach_synthesis")

    # Build LangGraph
    builder = StateGraph(InterviewState)
    builder.add_node("evaluate_communication", node_communication)
    builder.add_node("evaluate_content", node_content)
    builder.add_node("evaluate_star", node_star)
    builder.add_node("evaluate_merger", node_evaluation_merger)
    builder.add_node("deeper_analysis", node_deeper_analysis)
    builder.add_node("coach_synthesis", node_coach_synthesis)

    # Graph edges
    builder.add_edge(START, "evaluate_communication")
    builder.add_edge("evaluate_communication", "evaluate_content")
    builder.add_edge("evaluate_content", "evaluate_star")
    builder.add_edge("evaluate_star", "evaluate_merger")

    builder.add_conditional_edges(
        "evaluate_merger",
        route_after_merger,
        {
            "deeper_analysis": "deeper_analysis",
            "coach_synthesis": "coach_synthesis",
        }
    )
    builder.add_edge("deeper_analysis", "coach_synthesis")
    builder.add_edge("coach_synthesis", END)

    return builder.compile()


# Singleton compiled graph instance
interview_graph = create_interview_workflow()
