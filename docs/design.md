# System Design & Engineering Decisions

## 1. Architectural Philosophy

The **AI-Powered Communication & Interview Coaching System** was architected around three foundational engineering principles:

1. **Separation of Concerns:** Instead of expecting a single LLM prompt to simultaneously evaluate technical depth, grammar, delivery cadence, and behavioral structure, specialized agents operate independently with distinct evaluation rubrics.
2. **Evidence-Grounded Accountability:** Every identified weakness or coaching suggestion must cite direct textual evidence (exact quotes or acoustic metrics) from the candidate's response. The system never invents achievements or psychologizes traits.
3. **Deterministic Orchestration:** Agent collaboration is mediated via **LangGraph**, preventing conversational drift and ensuring structured state transitions.

---

## 2. Why LangGraph?

| Dimension | Single Prompt LLM | Autonomous Free-Form Chatbots | LangGraph Multi-Agent Workflow |
|---|---|---|---|
| **Determinism** | Low (unpredictable token distribution) | Low (prone to loops & topic drift) | **High** (finite state machine with typed state) |
| **Explainability** | Poor (black box single score) | Moderate | **High** (traceable per-agent reasoning) |
| **Modularity & Testing**| Difficult to isolate failures | Complex multi-turn debugging | **High** (each agent has isolated unit tests) |
| **Conditional Handoff** | Not possible | Ad-hoc message passing | **Native** (conditional edges based on scores) |

LangGraph acts as a compiled directed state graph. If the Communication Agent or Content Agent detects a critical issue (score < 6), a conditional branch triggers deeper specialist diagnostics before handing off to the Coach Agent for holistic synthesis.

---

## 3. Controlling Hallucinations & Grounding Rules

### Grounding Rule in Mode 2 (Resume + JD)
- The Question Agent and Gap Analyzer **never extrapolate or hallucinate facts not stated in the candidate's resume**.
- Technical questions probe only explicitly mentioned frameworks, databases, or project accomplishments.
- If a skill is required by the Job Description but absent from the resume, the system treats it strictly as a **probing gap** without asserting candidate deficiency.

### Schema Enforcement
- All agents use Pydantic V2 structured outputs.
- In production, LLMs are called with `with_structured_output(Schema)` or constrained JSON schema injection.
- If parsing fails or an external API is temporarily unavailable, safe deterministic fallbacks maintain service continuity.

---

## 4. Voice Ingestion & Acoustic Processing

Acoustic evaluation is intentionally limited to **observable physical characteristics**:
- Word count & Speaking rate (Words Per Minute)
- Pause frequencies
- Explicit filler word pattern matching (`"um"`, `"uh"`, `"like"`, `"basically"`, `"you know"`)

The architecture explicitly avoids attempting psychological trait inference, voice emotion classification, or pseudo-scientific personality profiling from voice data.

---

## 5. Persistence & Longitudinal Analytics

The system maintains longitudinal candidate tracking across multiple sessions:
- PostgreSQL / SQLite relational data store
- Automatic frequency indexing for recurring gaps (identifying patterns appearing in $\ge 2$ sessions)
- Adaptive 7-day personalized improvement plan generated from the candidate's historical gap profile.

---

## 6. Dataset Integration & Benchmark Validation

In accordance with the Project 7 specification:
- **Corpora Integration:** The question banks and evaluation criteria are curated and adapted from **RecruitView (Hugging Face)**, **Awesome Interview Questions (Hugging Face / GitHub)**, and **Continuum Open-Source Interview Questions (GitHub)**.
- **Unified Schema:** Every question conforms to canonical attributes: `question`, `role`, `competency`, `difficulty`, `question_type`, `expected_competencies`, `evaluation_criteria`, and `follow_up_template`.
- **Benchmark Corpus:** Automated regression testing runs against `data/evaluation/benchmark_dataset.json`, validating multi-agent consistency, deterministic scoring variance (0.0 points), and evidence attribution.
