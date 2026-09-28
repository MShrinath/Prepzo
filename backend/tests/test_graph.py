import pytest
from app.graph.workflow import interview_graph


def test_interview_graph_complete_flow():
    initial_state = {
        "candidate_id": "candidate_001",
        "current_question": "Explain how you solved a challenging performance issue.",
        "candidate_response": "I profiled the database queries using pg_stat_statements and found an unindexed join. I added a composite index which cut query execution time from 1.2s to 15ms.",
        "target_role": "SDE",
        "competency": "Problem Solving",
        "question_type": "behavioral",
        "session_history": [],
    }

    result = interview_graph.invoke(initial_state)

    assert "communication_analysis" in result
    assert "content_evaluation" in result
    assert "star_analysis" in result
    assert "final_feedback" in result
    assert "aggregated_score" in result
    assert result["aggregated_score"] > 0
    assert "follow_up_question" in result
    assert result["next_action"] == "complete"


def test_interview_graph_deeper_analysis_branch():
    # Provide a very brief, low clarity response that should trigger deeper analysis branch
    initial_state = {
        "candidate_id": "candidate_001",
        "current_question": "Design an enterprise search engine.",
        "candidate_response": "It works fast.",
        "target_role": "SDE",
        "competency": "Technical Depth",
        "question_type": "technical",
        "session_history": [],
    }

    result = interview_graph.invoke(initial_state)
    assert "final_feedback" in result
    # Deeper analysis node should have been executed
    assert result.get("deeper_communication_done", False) is True
