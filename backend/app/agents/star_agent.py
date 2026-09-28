from typing import Optional
from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import STAREvaluationOutput, STARComponent


class STARAgent:
    def __init__(self):
        self.llm = get_llm(temperature=0.1)

    def evaluate(
        self,
        question: str,
        question_type: str,
        response_text: str
    ) -> STAREvaluationOutput:
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
        has_result = any(term in response_text.lower() for term in ["result", "reduced", "improved", "saved", "increased", "%", "impact", "delivered"])
        has_action = any(term in response_text.lower() for term in ["i decided", "i implemented", "i built", "i analyzed", "i resolved", "i led"])

        fallback = {
            "applicable": True,
            "reason": None,
            "situation": {
                "score": 8,
                "evidence": "Candidate set up the project background and challenge context."
            },
            "task": {
                "score": 6,
                "evidence": "Candidate outlined the problem, but could delineate their specific personal assignment more sharply."
            },
            "action": {
                "score": 7 if has_action else 5,
                "evidence": "Candidate explained the technical approach taken." if has_action else "Relies heavily on collective 'we' actions rather than clarifying personal agency."
            },
            "result": {
                "score": 7 if has_result else 4,
                "evidence": "Candidate stated the final outcome." if has_result else "No quantifiable outcome or business impact metric was provided."
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
