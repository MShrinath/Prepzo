import re
from typing import Dict, Any, Optional
from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import CommunicationEvaluationOutput

FILLER_WORDS = [
    r"\bum\b", r"\buh\b", r"\blike\b", r"\byou know\b", r"\bbasically\b",
    r"\bliterally\b", r"\bactually\b", r"\bsort of\b", r"\bkind of\b"
]


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


class CommunicationAgent:
    def __init__(self):
        self.llm = get_llm(temperature=0.1)

    def analyze(
        self,
        question: str,
        response_text: str,
        audio_metrics: Optional[Dict[str, Any]] = None
    ) -> CommunicationEvaluationOutput:
        # Check for non-answers or trivial greetings
        if is_trivial_response(response_text):
            return CommunicationEvaluationOutput(
                clarity=1,
                conciseness=1,
                structure=1,
                communication_quality=1,
                filler_words=0,
                strengths=[],
                weaknesses=["Candidate provided a minimal greeting or non-answer rather than answering the interview question."],
                evidence=[f"Candidate answer was only: '{response_text.strip()}'"],
                audio_metrics=audio_metrics or {},
            )

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

CRITICAL SCORING RULE:
If the candidate's response is an empty submission, greeting ('hi', 'hello'), off-topic evasion, or under 5 words without technical content:
- Set clarity: 1, conciseness: 1, structure: 1, communication_quality: 1.
- strengths MUST be an empty array [].
- weaknesses MUST state: "Candidate provided only a greeting or non-answer instead of answering the interview question."
- Do NOT hallucinate strengths or praise low-effort greetings.

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
        base_clarity = 9 if avg_sentence_len < 22 else 6
        base_conciseness = 9 if word_count < 140 else 6
        if filler_count >= 2:
            base_clarity = max(3, base_clarity - 4)
            base_conciseness = max(3, base_conciseness - 4)

        strengths = []
        weaknesses = []
        evidence = []

        if word_count > 30 and filler_count < 2:
            strengths.append("Provided a structured, articulate explanation with relevant technical terminology.")
        elif word_count <= 25:
            weaknesses.append("Response is overly brief and lacks conversational depth.")
            evidence.append(f"Candidate response length was only {word_count} words.")

        if filler_count >= 2:
            weaknesses.append(f"Frequent use of filler words ({filler_count} instances detected: 'um', 'basically', 'like').")
            evidence.append(f"Detected repeated filler patterns like 'um', 'basically', or 'like'.")

        fallback = {
            "clarity": base_clarity,
            "conciseness": base_conciseness,
            "structure": 8 if (word_count > 25 and filler_count < 2) else 4,
            "communication_quality": 8 if filler_count == 0 else 4,
            "filler_words": filler_count,
            "strengths": strengths or ["Attempted to answer the prompt directly."],
            "weaknesses": weaknesses or ["Could benefit from tighter sentence transitions."],
            "evidence": evidence or ["Candidate maintained a steady conversational delivery."],
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
