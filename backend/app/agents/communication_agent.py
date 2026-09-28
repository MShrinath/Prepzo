import re
from typing import Dict, Any, Optional
from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import CommunicationEvaluationOutput

FILLER_WORDS = [
    r"\bum\b", r"\buh\b", r"\blike\b", r"\byou know\b", r"\bbasically\b",
    r"\bliterally\b", r"\bactually\b", r"\bsort of\b", r"\bkind of\b"
]


class CommunicationAgent:
    def __init__(self):
        self.llm = get_llm(temperature=0.1)

    def analyze(
        self,
        question: str,
        response_text: str,
        audio_metrics: Optional[Dict[str, Any]] = None
    ) -> CommunicationEvaluationOutput:
        # 1. Rule-based metrics
        words = re.findall(r"\w+", response_text.lower())
        word_count = len(words)
        sentences = [s.strip() for s in re.split(r"[.!?]+", response_text) if s.strip()]
        sentence_count = max(len(sentences), 1)
        avg_sentence_len = round(word_count / sentence_count, 1)

        filler_count = 0
        for pattern in FILLER_WORDS:
            matches = re.findall(pattern, response_text, re.IGNORECASE)
            filler_count += len(matches)

        # 2. LLM Prompt for deep qualitative analysis
        prompt = f"""You are the Communication Analysis Agent.
Your responsibility is to objectively evaluate the candidate's communication quality, articulation, and clarity.
Do NOT evaluate candidate personality, psychology, or intelligence.

Question asked: "{question}"
Candidate's response:
\"\"\"{response_text}\"\"\"

Objective metrics:
- Word count: {word_count}
- Sentence count: {sentence_count}
- Average sentence length: {avg_sentence_len} words
- Detected filler words: {filler_count}

Evaluate:
- clarity (1-10): Are explanations easy to follow?
- conciseness (1-10): Is there excessive rambling or unnecessary repetition?
- structure (1-10): Is there a clear beginning, middle, and conclusion?
- communication_quality (1-10): Overall professional delivery and vocabulary.
- filler_words (penalty/count): Note if filler words disrupt cadence.
- strengths: list specific communication strengths shown in the text.
- weaknesses: list specific communication weaknesses shown in the text.
- evidence: list exact quotes or paraphrases from the candidate response demonstrating the weaknesses or strengths.

Return JSON matching the schema."""

        # Deterministic fallback data based on text metrics
        base_clarity = 8 if avg_sentence_len < 25 else 5
        base_conciseness = 8 if word_count < 150 else 6
        strengths = []
        weaknesses = []
        evidence = []

        if word_count > 30:
            strengths.append("Provided a detailed explanation with relevant domain vocabulary.")
        else:
            weaknesses.append("Response is overly brief and lacks conversational elaboration.")
            evidence.append(f"Candidate response total length was only {word_count} words.")

        if filler_count > 3:
            weaknesses.append(f"Frequent use of filler words ({filler_count} instances detected).")
            evidence.append(f"Detected repeated filler patterns like 'um', 'basically', or 'like'.")

        fallback = {
            "clarity": base_clarity,
            "conciseness": base_conciseness,
            "structure": 7,
            "communication_quality": 7,
            "filler_words": filler_count,
            "strengths": strengths or ["Clear and polite delivery."],
            "weaknesses": weaknesses or ["Could benefit from tighter sentence transitions."],
            "evidence": evidence or ["Candidate maintained a steady logical flow."],
            "audio_metrics": audio_metrics or {},
        }

        output = parse_structured_output(
            llm=self.llm,
            prompt_text=prompt,
            pydantic_cls=CommunicationEvaluationOutput,
            fallback_data=fallback
        )
        if audio_metrics:
            output.audio_metrics = audio_metrics
        return output
