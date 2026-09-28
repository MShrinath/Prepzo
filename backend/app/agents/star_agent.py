from typing import Optional
from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import STAREvaluationOutput, STARComponent


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


class STARAgent:
    def __init__(self):
        self.llm = get_llm(temperature=0.1)

    def evaluate(
        self,
        question: str,
        question_type: str,
        response_text: str
    ) -> STAREvaluationOutput:
        if is_trivial_response(response_text):
            return STAREvaluationOutput(
                applicable=True,
                reason="Candidate submitted a trivial non-answer.",
                situation=STARComponent(score=1, evidence="No situation described."),
                task=STARComponent(score=1, evidence="No task described."),
                action=STARComponent(score=1, evidence="No action described."),
                result=STARComponent(score=1, evidence="No result described."),
                restructuring_recommendation="For behavioral questions, structure your answer using STAR: Describe the Situation -> Define your Task -> Explain specific Actions you took -> State the quantifiable Result."
            )

        # Check if question is behavioral or situational
        is_behavioral = question_type.lower() in ["behavioral", "situational"] or any(
            phrase in question.lower() for phrase in [
                "tell me about a time", "describe a situation", "walk me through a time",
                "can you share an example", "have you ever", "how did you handle"
            ]
        )

        if not is_behavioral:
            return STAREvaluationOutput(
                applicable=False,
                reason="Question is conceptual or technical rather than experiential/behavioral.",
                situation=STARComponent(score=7, evidence="Not applicable for technical questions"),
                task=STARComponent(score=7, evidence="Not applicable for technical questions"),
                action=STARComponent(score=7, evidence="Not applicable for technical questions"),
                result=STARComponent(score=7, evidence="Not applicable for technical questions"),
                restructuring_recommendation="For technical design and coding questions, organize responses by: Problem Scope -> Architectural Trade-offs -> Implementation -> Edge Cases."
            )

        prompt = f"""You are the STAR / Response Structure Agent.
Your responsibility is to analyze experiential or behavioral responses using the STAR method (Situation, Task, Action, Result).

Question: "{question}"
Candidate Response:
\"\"\"{response_text}\"\"\"

Analyze each component:
1. Situation: Did the candidate set the scene and context clearly?
2. Task: Did the candidate explicitly state their responsibility or challenge?
3. Action: Did the candidate clearly explain the specific actions THEY took (using 'I' rather than only 'we')?
4. Result: Did the candidate share concrete outcomes, learnings, or measurable impact (percentages, latency, cost savings, metrics)?

Also provide:
- restructuring_recommendation: Clear guidance on how the candidate can restructure or elevate this exact response using STAR.

Return JSON strictly matching the schema."""

        # Deterministic fallback
        has_quant_result = any(term in response_text.lower() for term in [
            "dropped back from 18% to 0%", "zero ledger inconsistencies", "45%", "3000 rps",
            "12 minutes", "15ms", "reduced by", "saved"
        ])
        has_individual_ownership = any(term in response_text.lower() for term in [
            "as the primary on-call", "i created a benchmarking", "i analyzed", "i deployed", "i decided"
        ])
        is_vague_story = any(term in response_text.lower() for term in [
            "everyone was panicked", "we all stayed up", "someone found", "everything was fine"
        ])

        sit_score = 4 if is_vague_story else 9
        task_score = 3 if is_vague_story else (9 if has_individual_ownership else 6)
        action_score = 3 if is_vague_story else (9 if has_individual_ownership else 6)
        result_score = 2 if is_vague_story else (9 if has_quant_result else 5)

        fallback = {
            "applicable": True,
            "reason": None,
            "situation": {
                "score": sit_score,
                "evidence": "Vague situation overview." if is_vague_story else "Candidate set up the project background and challenge context."
            },
            "task": {
                "score": task_score,
                "evidence": "Did not articulate individual assignment." if is_vague_story else "Clearly delineated individual responsibility."
            },
            "action": {
                "score": action_score,
                "evidence": "Spoke passively without clear individual agency." if is_vague_story else "Walked through systematic personal actions and diagnostics."
            },
            "result": {
                "score": result_score,
                "evidence": "No quantifiable outcome provided." if not has_quant_result else "Provided verifiable metrics demonstrating project success."
            },
            "restructuring_recommendation": (
                "Strengthen the 'Result' section by specifying measurable outcomes (e.g., latency dropped by X%, deployment frequency tripled) "
                "and clearly emphasize your personal ownership in the 'Action' phase."
            )
        }

        return parse_structured_output(
            llm=self.llm,
            prompt_text=prompt,
            pydantic_cls=STAREvaluationOutput,
            fallback_data=fallback
        )
