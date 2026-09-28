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
        has_deep_tech = any(kw in response_text.lower() for kw in [
            "apm", "datadog", "py-spy", "flamegraph", "pg_stat", "composite index",
            "redis", "pgbouncer", "celery", "ragas", "bm25", "rerank", "acid", "hybrid search",
            "grafana", "sqlalchemy", "connection leak", "hotfix", "ci pipeline", "rollback"
        ])
        is_superficial = any(kw in response_text.lower() for kw in [
            "add more servers", "increase the ram", "restart the database", "panicked", "someone found"
        ])
        is_brief = len(response_text.split()) < 20 and not has_deep_tech

        relevance = 4 if is_superficial else (9 if has_deep_tech else (5 if is_brief else 8))
        correctness = 3 if is_superficial else (9 if has_deep_tech else 7)
        tech_depth = 2 if is_superficial else (9 if has_deep_tech else (4 if is_brief else 7))
        evidence_quality = 2 if is_superficial else (9 if has_deep_tech else 6)

        fallback = {
            "relevance": relevance,
            "correctness": correctness,
            "completeness": 4 if (is_brief or is_superficial) else (9 if has_deep_tech else 7),
            "technical_depth": tech_depth,
            "evidence_quality": evidence_quality,
            "strengths": [
                "Demonstrated deep production understanding and concrete technical interventions.",
                "Explicitly identified profiling tools, architectural layers, and performance metrics."
            ] if has_deep_tech else [
                "Addressed the primary topic of the question."
            ],
            "gaps": [
                "Lacks actionable troubleshooting methodology.",
                "Superficial scaling advice without root-cause analysis."
            ] if is_superficial else (
                ["Could include more quantitative metrics."] if has_deep_tech else ["Could detail specific architectural alternatives."]
            )
        }

        return parse_structured_output(
            llm=self.llm,
            prompt_text=prompt,
            pydantic_cls=ContentEvaluationOutput,
            fallback_data=fallback
        )
