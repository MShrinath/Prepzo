from typing import List, Optional
from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import ContentEvaluationOutput


class ContentAgent:
    def __init__(self):
        self.llm = get_llm(temperature=0.1)

    def evaluate(
        self,
        question: str,
        response_text: str,
        evaluation_criteria: Optional[List[str]] = None,
        competency: Optional[str] = None,
    ) -> ContentEvaluationOutput:
        criteria_str = "\n".join([f"- {c}" for c in (evaluation_criteria or [])])
        if not criteria_str:
            criteria_str = "- Directly answers the prompt\n- Explains technical/operational methodology\n- Provides verifiable context or metrics"

        prompt = f"""You are the Content Evaluation Agent.
Your responsibility is to determine whether the candidate substantively answered the question asked with sufficient technical or operational depth.

Question: "{question}"
Target Competency: {competency or "General"}
Target Evaluation Criteria:
{criteria_str}

Candidate Response:
\"\"\"{response_text}\"\"\"

Evaluate:
- relevance (1-10): Did the candidate directly address the core prompt without deflecting?
- correctness (1-10): Are the stated concepts, algorithms, frameworks, or procedures accurate?
- completeness (1-10): Were all parts of the question addressed?
- technical_depth (1-10): Does the response show genuine practical familiarity or only surface buzzwords?
- evidence_quality (1-10): Did the candidate back up their claims with concrete examples, tools, or metrics?
- strengths: list specific substantive elements handled well.
- gaps: list specific missing details, unverified claims, or omitted criteria.

Return JSON strictly matching the schema."""

        # Deterministic fallback evaluation based on keyword presence and length
        has_tech_keywords = any(kw in response_text.lower() for kw in [
            "explain analyze", "b-tree", "index", "query", "caching", "redis", "latency",
            "profiling", "algorithm", "asyncio", "lock", "thread", "database", "api"
        ])
        is_brief = len(response_text.split()) < 15 and not has_tech_keywords
        fallback = {
            "relevance": 5 if is_brief else 8,
            "correctness": 7,
            "completeness": 5 if is_brief else 7,
            "technical_depth": 4 if is_brief else (8 if has_tech_keywords else 6),
            "evidence_quality": 4 if is_brief else 6,
            "strengths": [
                "Understands the general premise of the interview question.",
                "Demonstrated relevant technical context in their explanation."
            ],
            "gaps": [
                "Could provide deeper technical specifics or measurable performance numbers.",
                "Did not fully outline the alternative approaches considered."
            ] if not is_brief else [
                "Response is too concise to demonstrate deep technical mastery.",
                "Missing specific implementation details and quantifiable outcomes."
            ]
        }

        return parse_structured_output(
            llm=self.llm,
            prompt_text=prompt,
            pydantic_cls=ContentEvaluationOutput,
            fallback_data=fallback
        )
