import json
from typing import Dict, Any, List, Optional
from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import (
    CommunicationEvaluationOutput,
    ContentEvaluationOutput,
    STAREvaluationOutput,
    CoachFeedbackOutput,
    EvidenceItem,
    ImprovementPlanOutput,
    ImprovementPlanItem,
)


class CoachAgent:
    def __init__(self):
        self.llm = get_llm(temperature=0.2)

    def synthesize_feedback(
        self,
        question: str,
        response_text: str,
        communication: CommunicationEvaluationOutput,
        content: ContentEvaluationOutput,
        star: STAREvaluationOutput,
        candidate_profile: Optional[Dict[str, Any]] = None,
        session_history: Optional[List[Dict[str, Any]]] = None,
    ) -> CoachFeedbackOutput:
        # Calculate balanced score (Relevance: 25%, Content quality: 25%, Communication: 20%, Structure: 15%, Completeness: 15%)
        # All incoming scores are 1-10
        comm_score = (communication.clarity + communication.conciseness + communication.structure + communication.communication_quality) / 4.0
        content_score = (content.correctness + content.technical_depth + content.evidence_quality) / 3.0
        relevance_score = content.relevance
        completeness_score = content.completeness

        if star.applicable:
            structure_score = (star.situation.score + star.task.score + star.action.score + star.result.score) / 4.0
        else:
            structure_score = communication.structure

        overall_score = round(
            (relevance_score * 2.5) +
            (content_score * 2.5) +
            (comm_score * 2.0) +
            (structure_score * 1.5) +
            (completeness_score * 1.5),
            1
        )
        overall_score = max(10.0, min(100.0, overall_score))

        prompt = f"""You are the Interview Coach Agent.
Your responsibility is to synthesize the specialist agent evaluations into unified, evidence-based, actionable coaching feedback.

Question: "{question}"
Candidate Answer:
\"\"\"{response_text}\"\"\"

Specialist Evaluations:
- Communication: Clarity={communication.clarity}/10, Conciseness={communication.conciseness}/10, Structure={communication.structure}/10
  Strengths: {communication.strengths}
  Weaknesses: {communication.weaknesses}
  Evidence: {communication.evidence}
- Content: Relevance={content.relevance}/10, Technical Depth={content.technical_depth}/10, Correctness={content.correctness}/10
  Strengths: {content.strengths}
  Gaps: {content.gaps}
- STAR Evaluation (Applicable={star.applicable}):
  Situation: {star.situation.score}/10 ({star.situation.evidence})
  Task: {star.task.score}/10 ({star.task.evidence})
  Action: {star.action.score}/10 ({star.action.evidence})
  Result: {star.result.score}/10 ({star.result.evidence})

Synthesize:
1. Top strengths (consolidated, non-redundant).
2. Top improvement areas.
3. Detailed evidence_items (each containing: issue, severity, concrete evidence quote/observation from candidate answer, recommendation).
4. Actionable advice for the candidate's next attempt.
5. An improved answer structure showing how the candidate could restructure their exact answer.
6. A tailored follow-up question generated directly from the candidate's answer (probe missing metrics or personal contribution).

Return strictly JSON matching the schema."""

        # Generate grounded follow-up question
        follow_up = None
        if star.applicable and star.result.score < 6:
            follow_up = "What was the specific measurable outcome or performance improvement resulting from your intervention?"
        elif star.applicable and star.action.score < 6:
            follow_up = "What was your specific personal contribution and decision-making role during that initiative?"
        else:
            follow_up = f"You mentioned key technical steps in your answer. If the system scale suddenly grew 10x, what would be the first bottleneck in your approach and how would you redesign it?"

        evidence_items = []
        if content.gaps:
            evidence_items.append(
                EvidenceItem(
                    issue=content.gaps[0],
                    severity="medium",
                    evidence="Candidate did not articulate measurable results or operational metrics.",
                    recommendation="Quantify your achievements with numbers, percentages, or concrete latency/cost deltas."
                )
            )
        if communication.weaknesses:
            evidence_items.append(
                EvidenceItem(
                    issue=communication.weaknesses[0],
                    severity="low",
                    evidence=communication.evidence[0] if communication.evidence else "Observed in response phrasing.",
                    recommendation="Focus on tighter transitions and eliminate filler words to maximize executive presence."
                )
            )

        fallback = {
            "overall_score": overall_score,
            "strengths": communication.strengths[:2] + content.strengths[:1],
            "improvement_areas": content.gaps[:2] + communication.weaknesses[:1],
            "evidence_items": [item.model_dump() for item in evidence_items],
            "actionable_advice": [
                "Lead with the punchline: state the problem and immediate impact within the first 20 seconds.",
                "Replace passive phrases ('we resolved') with active personal ownership ('I diagnosed the bottleneck and wrote the cache invalidation logic').",
                "Always conclude behavioral stories with verifiable quantitative business results."
            ],
            "improved_answer_structure": (
                "1. Context (15s): State the company/project goal and critical urgency.\n"
                "2. Action (45s): Walk through the 2-3 specific technical interventions you personally spearheaded.\n"
                "3. Outcome (30s): Conclude with verified metrics (e.g. 'Latency decreased by 40% with zero downtime')."
            ),
            "follow_up_question": follow_up,
        }

        output = parse_structured_output(
            llm=self.llm,
            prompt_text=prompt,
            pydantic_cls=CoachFeedbackOutput,
            fallback_data=fallback
        )
        # Ensure calculated overall score is consistent
        output.overall_score = overall_score
        if not output.follow_up_question:
            output.follow_up_question = follow_up
        return output

    def detect_recurring_gaps(
        self,
        candidate_history: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Analyzes historical evaluation evidence across multiple sessions to detect recurring weaknesses.
        """
        gap_counts: Dict[str, int] = {}
        gap_descriptions: Dict[str, str] = {}

        for item in candidate_history:
            # Check for missing results
            star_info = item.get("star_evaluation") or {}
            result_score = star_info.get("result", {}).get("score", 10)
            if result_score < 6:
                key = "Missing Measurable Outcomes"
                gap_counts[key] = gap_counts.get(key, 0) + 1
                gap_descriptions[key] = "Responses consistently lack quantifiable business results, metrics, or performance numbers."

            # Check for weak personal ownership
            action_score = star_info.get("action", {}).get("score", 10)
            if action_score < 6:
                key = "Weak Personal Ownership"
                gap_counts[key] = gap_counts.get(key, 0) + 1
                gap_descriptions[key] = "Tends to describe collective team actions ('we did') rather than highlighting individual responsibility ('I built')."

            # Check communication conciseness / filler words
            comm_info = item.get("communication_evaluation") or {}
            if comm_info.get("conciseness_score", 10) < 6 or comm_info.get("filler_words_score", 0) > 3:
                key = "Rambling & Conciseness"
                gap_counts[key] = gap_counts.get(key, 0) + 1
                gap_descriptions[key] = "Answers tend to drift into unstructured detail or excessive filler word usage."

        recurring = []
        for category, count in gap_counts.items():
            if count >= 2:  # Occurred in 2 or more sessions
                recurring.append({
                    "category": category,
                    "description": gap_descriptions[category],
                    "count": count,
                    "severity": "high" if count >= 3 else "medium",
                })
        return recurring

    def generate_improvement_plan(
        self,
        target_role: str,
        recurring_gaps: List[Dict[str, Any]],
        candidate_name: str = "Candidate"
    ) -> ImprovementPlanOutput:
        """
        Generates a 7-day targeted improvement plan tailored to candidate's recurring gaps.
        """
        gap_titles = [g["category"] for g in recurring_gaps] if recurring_gaps else ["Technical Depth", "Structured Communication"]

        items = [
            ImprovementPlanItem(
                day=1,
                focus="Communication Structure & Core Intro",
                task="Practice your 90-second 'Tell me about yourself' pitch, structuring strictly around recent impact.",
                tips="Time yourself with a stopwatch. Cut all filler phrases ('basically', 'um')."
            ),
            ImprovementPlanItem(
                day=2,
                focus="STAR Framework: Action Definition",
                task="Draft 3 behavioral stories. Highlight your individual contributions using 'I decided' and 'I engineered'.",
                tips="Never use passive voice. Clarify why you were assigned the task and how you chose the approach."
            ),
            ImprovementPlanItem(
                day=3,
                focus="Quantifying Results & Business Metrics",
                task="Add measurable results to each of your project descriptions (e.g. latency drop, uptime, cost savings).",
                tips="If you do not have exact numbers, estimate order of magnitude (e.g. '~40% throughput increase')."
            ),
            ImprovementPlanItem(
                day=4,
                focus=f"Role Mastery: {target_role} Architecture Deep-Dive",
                task=f"Practice answering 2 complex system design or technical scenarios for {target_role}.",
                tips="Map out trade-offs between consistency, availability, and latency before writing code."
            ),
            ImprovementPlanItem(
                day=5,
                focus="Conflict Resolution & Cross-Functional Alignment",
                task="Rehearse an answer for handling disagreements with a technical lead or product manager.",
                tips="Focus on objective telemetry and user empathy rather than personal ego."
            ),
            ImprovementPlanItem(
                day=6,
                focus="Simulated Full Mock Interview",
                task="Complete a 3-question mixed technical and behavioral practice round in Voice Mode.",
                tips="Listen back to your audio recordings to evaluate cadence, clarity, and pause lengths."
            ),
            ImprovementPlanItem(
                day=7,
                focus="Review & Final Benchmarking",
                task="Retake the original questions where you had gaps and compare your scores on the progress dashboard.",
                tips="Celebrate your progress and refine any remaining edge-case answers."
            ),
        ]

        overview = (
            f"Personalized 7-day preparation roadmap for {candidate_name} targeting {target_role}. "
            f"Tailored to eliminate identified recurring gaps: {', '.join(gap_titles)}."
        )

        return ImprovementPlanOutput(
            title=f"7-Day Personalized Improvement Plan ({target_role})",
            duration_days=7,
            overview=overview,
            items=items
        )
