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


def is_trivial_response(text: str) -> bool:
    clean = text.strip().lower()
    words = clean.split()
    if len(words) < 5:
        return True
    if clean in [
        "hi", "hello", "hey", "test", "ok", "okay", "yes", "no", "idk",
        "i don't know", "i dont know", "skip", "pass", "good", "fine", "nothing"
    ]:
        return True
    return False


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
        mode: Optional[str] = None,
        question_type: Optional[str] = None,
    ) -> CoachFeedbackOutput:
        target_role = (candidate_profile.get("target_role") if candidate_profile else "") or ""
        is_hr = (
            (mode in ("hr", "behavioral")) or
            (question_type in ("behavioral", "situational")) or
            ("hr" in target_role.lower()) or
            (star.applicable and (not mode or mode == "hr"))
        )

        if is_trivial_response(response_text):
            generic_advice = [
                "Take a moment to read and break down the question before answering.",
                "For behavioral & leadership questions: use Situation, Task, Action, and Result (STAR).",
                "Highlight individual ownership ('I led', 'I decided') rather than speaking passively.",
            ] if is_hr else [
                "Take a moment to read and break down the question before answering.",
                "For technical questions: define the problem scope, describe your solution architecture, and explain trade-offs.",
                "For behavioral questions: use Situation, Task, Action, and Result (STAR).",
            ]
            return CoachFeedbackOutput(
                overall_score=15.0,
                strengths=[],
                improvement_areas=[
                    "Provide a substantive, structured answer addressing the question directly.",
                    "Highlight individual ownership, key decisions, and measurable outcomes." if is_hr else "Include concrete technical tools, methodology, or personal experiences.",
                ],
                evidence_items=[
                    EvidenceItem(
                        issue="Minimal Non-Answer",
                        severity="high",
                        evidence=f"Candidate response: '{response_text.strip()}'",
                        recommendation="Avoid single-word greetings or placeholder submissions. Formulate a structured narrative using the STAR methodology." if is_hr else "Avoid single-word greetings or placeholder submissions. Take 15-30 seconds to formulate a structured technical response.",
                    )
                ],
                actionable_advice=generic_advice,
                improved_answer_structure=f"For '{question}', begin with a clear opening statement, elaborate on specific actions you took, and conclude with measurable impact.",
                follow_up_question=f"Could you share a specific real-world example regarding: {question}?",
            )

        # Calculate scores based on round type
        # All incoming scores are 1-10
        comm_score = (communication.clarity + communication.conciseness + communication.structure + communication.communication_quality) / 4.0
        content_score = (content.correctness + content.technical_depth + content.evidence_quality) / 3.0
        relevance_score = content.relevance
        completeness_score = content.completeness

        if star.applicable:
            structure_score = (star.situation.score + star.task.score + star.action.score + star.result.score) / 4.0
        else:
            structure_score = communication.structure

        if is_hr:
            # HR / Behavioral Round: Prioritize Communication (35%) + STAR/Leadership (35%) + Relevance/Empathy (20%) + Context (10%)
            overall_score = round(
                (comm_score * 3.5) +
                (structure_score * 3.5) +
                (relevance_score * 2.0) +
                (content_score * 1.0),
                1
            )
        else:
            # Technical Round: Technical Content (40%) + Communication (30%) + Structure (20%) + Completeness (10%)
            overall_score = round(
                (content_score * 4.0) +
                (comm_score * 3.0) +
                (structure_score * 2.0) +
                (completeness_score * 1.0),
                1
            )
        overall_score = max(10.0, min(100.0, overall_score))

        hr_guidelines = """
INTERVIEW MODE: HR / BEHAVIORAL & LEADERSHIP ROUND
PRIORITY EVALUATION HIERARCHY:
1. Communication & Executive Presence: Clarity, articulation, vocal cadence, structured delivery, minimal filler words.
2. Behavioral & Leadership Mastery (STAR):
   - Situation & Task: Concise scene-setting.
   - Action: Decisive individual ownership ('I spearheaded', 'I resolved', 'I decided' vs vague 'we'). Emphasize leadership, conflict resolution, emotional intelligence, and accountability.
   - Result: Quantifiable business, team, or operational outcomes (numbers, retention, velocity, milestones).
3. Culture Fit & Team Dynamics: Empathy, cross-functional collaboration, receptivity to feedback.
4. Technical Context: Technical depth is strictly supporting context. Do NOT penalize the candidate for omitting code or low-level algorithms unless explicitly asked."""

        tech_guidelines = """
INTERVIEW MODE: TECHNICAL & SYSTEM DESIGN ROUND
PRIORITY EVALUATION HIERARCHY:
1. Technical Depth, correctness of concepts, and architecture trade-offs.
2. Structured communication and clarity of technical explanation.
3. Edge cases, performance metrics, and fault-tolerance considerations."""

        prompt = f"""You are the Lead Executive Interview Coach at Prepzo.
Your responsibility is to synthesize specialist agent evaluations into unified, evidence-based, actionable coaching feedback.

{hr_guidelines if is_hr else tech_guidelines}

Question: "{question}"
Candidate Answer:
\"\"\"{response_text}\"\"\"

Specialist Evaluations:
- Communication: Clarity={communication.clarity}/10, Conciseness={communication.conciseness}/10, Structure={communication.structure}/10
  Strengths: {communication.strengths}
  Weaknesses: {communication.weaknesses}
  Evidence: {communication.evidence}
- Content: Relevance={content.relevance}/10, Technical/Operational Depth={content.technical_depth}/10, Correctness={content.correctness}/10
  Strengths: {content.strengths}
  Gaps: {content.gaps}
- STAR Evaluation (Applicable={star.applicable}):
  Situation: {star.situation.score}/10 ({star.situation.evidence})
  Task: {star.task.score}/10 ({star.task.evidence})
  Action: {star.action.score}/10 ({star.action.evidence})
  Result: {star.result.score}/10 ({star.result.evidence})

Synthesize:
1. 'strengths': 2 to 4 top consolidated strengths ({'focusing on communication, leadership, and STAR clarity' if is_hr else 'focusing on technical depth and communication'}).
2. 'improvement_areas': 2 to 4 prioritized areas for improvement.
3. 'evidence_items': Detailed evidence_items (each containing: issue, severity ('high', 'medium', 'low'), concrete evidence quote/observation from candidate answer, recommendation on how to fix it).
4. 'actionable_advice': 3 to 5 step-by-step concrete coaching rules for the candidate's next attempt ({'e.g. lead with personal agency, quantify business impact, eliminate filler pauses' if is_hr else 'e.g. outline system trade-offs, state performance bottlenecks'}).
5. 'improved_answer_structure': A complete exemplary rewritten response showing how the candidate should structure and phrase their answer for maximum executive impact.
6. 'follow_up_question': A tailored follow-up question ({'probing interpersonal conflict, leadership trade-offs, or measurable business results' if is_hr else 'probing architectural scale, bottlenecks, or trade-offs'}).

Return strictly JSON matching the schema."""

        # Generate grounded follow-up question
        follow_up = None
        if is_hr:
            if star.applicable and star.result.score < 6:
                follow_up = "What was the measurable outcome or team impact resulting directly from your actions?"
            elif star.applicable and star.action.score < 6:
                follow_up = "What was your specific personal leadership role and decision-making responsibility during that situation?"
            else:
                follow_up = "If a senior stakeholder or peer had pushed back strongly on your decision, how would you have navigated that disagreement?"
        else:
            if star.applicable and star.result.score < 6:
                follow_up = "What was the specific measurable outcome or performance improvement resulting from your intervention?"
            elif star.applicable and star.action.score < 6:
                follow_up = "What was your specific personal contribution and decision-making role during that initiative?"
            else:
                follow_up = f"You mentioned key technical steps in your answer. If the system scale suddenly grew 10x, what would be the first bottleneck in your approach and how would you redesign it?"

        evidence_items = []
        if is_hr:
            if star.applicable and star.action.score < 7:
                evidence_items.append(
                    EvidenceItem(
                        issue="Passive Team Phrasing ('We' vs 'I')",
                        severity="medium",
                        evidence=star.action.evidence or "Candidate spoke generally about team activities.",
                        recommendation="Highlight your individual agency: explicitly state what you personally analyzed, decided, negotiated, or spearheaded."
                    )
                )
            if star.applicable and star.result.score < 7:
                evidence_items.append(
                    EvidenceItem(
                        issue="Unquantified Business Impact",
                        severity="medium",
                        evidence=star.result.evidence or "No concrete metrics or final resolution numbers mentioned.",
                        recommendation="Conclude with verifiable business impact: mention percentage improvements, hours saved, team velocity, or user feedback."
                    )
                )
            if communication.weaknesses:
                evidence_items.append(
                    EvidenceItem(
                        issue=communication.weaknesses[0],
                        severity="low",
                        evidence=communication.evidence[0] if communication.evidence else "Observed in response cadence.",
                        recommendation="Use strategic 2-second pauses between STAR sections to project executive poise and eliminate filler hesitation."
                    )
                )
        else:
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

        fallback_advice = [
            "Use the STAR method: spend 20s on Situation/Task, 50s on Action, and 20s on Result.",
            "Replace passive words ('we solved') with decisive personal ownership ('I diagnosed, proposed the plan, and led execution').",
            "Conclude every behavioral story with measurable impact (e.g. 'Project shipped on time with 99.8% customer satisfaction').",
            "Maintain steady vocal cadence: pause comfortably rather than filling silence with 'um' or 'like'."
        ] if is_hr else [
            "Lead with the punchline: state the problem and immediate impact within the first 20 seconds.",
            "Replace passive phrases ('we resolved') with active personal ownership ('I diagnosed the bottleneck and wrote the cache invalidation logic').",
            "Always conclude technical and behavioral stories with verifiable quantitative metrics."
        ]

        fallback_improved = (
            "Situation (20s): 'At my previous company, our team faced a tight 3-week deadline with conflicting engineering opinions on the release plan.'\n"
            "Task (15s): 'As the initiative lead, my objective was to align the team, resolve cross-functional friction, and prevent a delivery delay.'\n"
            "Action (45s): 'I scheduled a 30-minute sync, mapped out the critical path, and proposed a staged rollout that satisfied both quality and speed concerns.'\n"
            "Result (20s): 'We achieved 100% stakeholder buy-in, shipped 2 days early, and experienced zero production rollbacks.'"
        ) if is_hr else (
            "1. Context (15s): State the company/project goal and critical urgency.\n"
            "2. Action (45s): Walk through the 2-3 specific technical interventions you personally spearheaded.\n"
            "3. Outcome (30s): Conclude with verified metrics (e.g. 'Latency decreased by 40% with zero downtime')."
        )

        fallback = {
            "overall_score": overall_score,
            "strengths": communication.strengths[:2] + ([star.action.evidence] if (is_hr and star.action.evidence) else content.strengths[:1]),
            "improvement_areas": (communication.weaknesses[:1] + content.gaps[:1]) if is_hr else (content.gaps[:2] + communication.weaknesses[:1]),
            "evidence_items": [item.model_dump() for item in evidence_items],
            "actionable_advice": fallback_advice,
            "improved_answer_structure": fallback_improved,
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
        candidate_name: str = "Candidate",
        latest_feedback: Optional[Dict[str, Any]] = None,
        mode: Optional[str] = "role_practice",
    ) -> ImprovementPlanOutput:
        """
        Generates a 7-day targeted improvement plan tailored dynamically by LLM to candidate's performance and gaps.
        """
        gap_titles = [
            g.get("gap_category") or g.get("category")
            for g in recurring_gaps
            if isinstance(g, dict) and (g.get("gap_category") or g.get("category"))
        ] if recurring_gaps else []
        strengths = latest_feedback.get("strengths", []) if latest_feedback else []
        improvements = latest_feedback.get("improvement_areas", []) if latest_feedback else []
        advice = latest_feedback.get("actionable_advice", []) if latest_feedback else []

        is_hr = (mode in ("hr", "behavioral")) or ("hr" in str(target_role).lower())

        fallback_items = [
            ImprovementPlanItem(
                day=1,
                focus="Vocal Presence & Delivery Cadence" if is_hr else "Communication Structure & Core Intro",
                task="Practice your 90-second behavioral intro, maintaining 130-150 WPM with zero filler words." if is_hr else "Practice your 90-second 'Tell me about yourself' pitch, structuring strictly around recent impact.",
                tips="Time yourself with a stopwatch. Pause intentionally rather than saying 'um' or 'like'."
            ),
            ImprovementPlanItem(
                day=2,
                focus="STAR Framework: Action Ownership ('I' vs 'We')",
                task="Draft 3 behavioral stories. Highlight your individual contributions using 'I decided' and 'I spearheaded'.",
                tips="Never use passive voice. Clarify why you were assigned the task and how you chose the approach."
            ),
            ImprovementPlanItem(
                day=3,
                focus="Quantifying Results & Business Metrics",
                task="Add measurable results to each project description (e.g. latency drop, user retention, team velocity).",
                tips="If exact numbers are unavailable, estimate order of magnitude (e.g. '~40% throughput increase')."
            ),
            ImprovementPlanItem(
                day=4,
                focus="Conflict Resolution & Stakeholder Alignment" if is_hr else f"Role Mastery: {target_role} Architecture Deep-Dive",
                task="Rehearse an answer for handling disagreements with a technical lead or product manager." if is_hr else f"Practice answering 2 complex system design scenarios for {target_role}.",
                tips="Focus on objective telemetry and stakeholder empathy rather than personal defensiveness."
            ),
            ImprovementPlanItem(
                day=5,
                focus="Handling High-Pressure Scenarios & Failure",
                task="Prepare a transparent STAR narrative about a production incident or project setback and key lessons learned.",
                tips="Interviewers look for self-awareness, psychological safety, and root-cause accountability."
            ),
            ImprovementPlanItem(
                day=6,
                focus="Simulated Full Mock Interview",
                task="Complete a 3-question mixed practice round in Voice Mode with real-time feedback active.",
                tips="Listen back to your audio recordings to evaluate cadence, clarity, and pause lengths."
            ),
            ImprovementPlanItem(
                day=7,
                focus="Review & Final Benchmarking",
                task="Retake the original questions where you had gaps and compare your scores on the progress dashboard.",
                tips="Celebrate your progress and refine any remaining edge-case answers."
            ),
        ]

        fallback_overview = (
            f"Personalized 7-day preparation roadmap for {candidate_name} targeting {target_role}. "
            f"Tailored to elevate communication, behavioral leadership, and interview confidence."
        )

        fallback = {
            "title": f"7-Day Personalized Improvement Plan ({target_role})",
            "duration_days": 7,
            "overview": fallback_overview,
            "items": [item.model_dump() for item in fallback_items]
        }

        prompt = f"""You are the Lead Executive Interview Coach at Prepzo.
Generate a dynamic, highly actionable 7-Day Interview Improvement Plan for {candidate_name} targeting '{target_role}'.

CANDIDATE CONTEXT:
- Target Role: {target_role}
- Interview Mode: {mode or 'practice'} ({'HR / Behavioral & Leadership Focus' if is_hr else 'Technical Engineering Focus'})
- Identified Gaps: {json.dumps(gap_titles or improvements or ['Structure and quantitative results'])}
- Candidate Strengths: {json.dumps(strengths or ['Core domain background'])}
- Latest Actionable Advice: {json.dumps(advice or ['Structure answers using STAR and eliminate filler words'])}

MANDATORY CURRICULUM REQUIREMENTS:
Generate exactly 7 distinct daily plans (Day 1 through Day 7):
{
  '''1. Days 1-2 MUST focus on Communication, Vocal Delivery, eliminating filler words, and the STAR framework (Situation, Task, Action, Result).
2. Days 3-4 MUST focus on Leadership Agency ('I' vs 'we'), Conflict Resolution, Stakeholder Empathy, and Quantifying Business Results.
3. Days 5-6 MUST focus on Cross-Functional Alignment, Handling Pushback, and High-Pressure Scenarios.
4. Day 7 MUST focus on Final Benchmarking and Full Simulated Mock.'''
  if is_hr else
  '''1. Day 1: Communication, Vocal Cadence, and Concise Problem Framing.
2. Days 2-3: Core Architecture, Distributed Trade-offs, and Latency Bottlenecks for ''' + target_role + '''.
3. Days 4-5: STAR Behavioral Mastery, Production Incident Troubleshooting, and Quantifying Business Results.
4. Days 6-7: Full-Length Timed Mock Interview and Final Benchmarking.'''
}

For each day (day 1 to 7):
- 'day': Integer from 1 to 7
- 'focus': Short punchy headline (e.g. 'STAR Action Mastery: Decisive Ownership', 'Vocal Presence & Strategic Pauses')
- 'task': Concrete, actionable drill the candidate should perform today (1-2 sentences)
- 'tips': Practical, insider coaching advice on how to execute this drill with distinction

Return strictly valid JSON matching the schema."""

        try:
            return parse_structured_output(
                llm=self.llm,
                prompt_text=prompt,
                pydantic_cls=ImprovementPlanOutput,
                fallback_data=fallback
            )
        except Exception as e:
            return ImprovementPlanOutput(**fallback)
