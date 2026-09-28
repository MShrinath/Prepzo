# Specialist Agents Reference Guide

## 1. Overview of Agents

The platform coordinates five specialized AI agents managed by the central LangGraph workflow:

```
[Candidate Response] 
        ↓
  Communication Agent  →  Content Agent  →  STAR Agent
        ↓
  [Conditional Handoff: Deeper Diagnostic if Clarity/Depth < 6]
        ↓
    Coach Agent (Synthesis, Balanced Score, Follow-up, 7-Day Plan)
```

---

## 2. Question Agent (`app/agents/question_agent.py`)

### Responsibilities
- Dynamically selects or generates interview questions based on the active mode:
  - **Mode 1 (Role Practice):** Filters curated question bank for 9 preset roles, matching requested difficulty and competency while avoiding questions previously attempted by the candidate.
  - **Mode 2 (Resume + JD):** Executes gap analysis between resume and job description. Emits grounded technical questions for matched skills and probing behavioral questions for missing skills.
  - **Mode 3 (HR Round):** Selects behavioral questions spanning conflict resolution, feedback, motivation, stress management, failure, and culture fit.

### Output Schema: `QuestionAgentOutput`
```json
{
  "question": "string",
  "competency": "string",
  "difficulty": "easy | medium | hard",
  "question_type": "technical | behavioral | situational",
  "reason": "string",
  "question_id": "string"
}
```

---

## 3. Communication Agent (`app/agents/communication_agent.py`)

### Responsibilities
- Evaluates clarity, conciseness, structural cohesion, and delivery.
- Detects filler words (`"um"`, `"uh"`, `"like"`, `"basically"`, `"you know"`).
- Ingests acoustic delivery metrics (speaking rate in WPM, pauses) for voice sessions.
- Generates evidence quotes highlighting observed communication strengths and weaknesses.

### Output Schema: `CommunicationEvaluationOutput`
```json
{
  "clarity": 1-10,
  "conciseness": 1-10,
  "structure": 1-10,
  "communication_quality": 1-10,
  "filler_words": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "evidence": ["string"],
  "audio_metrics": {}
}
```

---

## 4. Content Agent (`app/agents/content_agent.py`)

### Responsibilities
- Evaluates whether the candidate substantively and accurately answered the question.
- Scores technical depth, correctness, completeness, and evidence quality.
- Identifies omissions, superficial explanations, and unverified technical claims.

### Output Schema: `ContentEvaluationOutput`
```json
{
  "relevance": 1-10,
  "correctness": 1-10,
  "completeness": 1-10,
  "technical_depth": 1-10,
  "evidence_quality": 1-10,
  "strengths": ["string"],
  "gaps": ["string"]
}
```

---

## 5. STAR Agent (`app/agents/star_agent.py`)

### Responsibilities
- Evaluates behavioral and experiential responses using the **STAR methodology**:
  - **Situation:** Context and challenge definition.
  - **Task:** Clarity of personal responsibility.
  - **Action:** Specific individual actions taken (emphasizing "I" over passive "we").
  - **Result:** Quantifiable business outcomes and metric impact.
- For purely technical or algorithmic questions, sets `applicable: false` and provides architectural trade-off structuring guidance.

### Output Schema: `STAREvaluationOutput`
```json
{
  "applicable": true,
  "situation": { "score": 1-10, "evidence": "string" },
  "task": { "score": 1-10, "evidence": "string" },
  "action": { "score": 1-10, "evidence": "string" },
  "result": { "score": 1-10, "evidence": "string" },
  "restructuring_recommendation": "string"
}
```

---

## 6. Coach Agent (`app/agents/coach_agent.py`)

### Responsibilities
- Synthesizes findings from Communication, Content, and STAR agents.
- Computes balanced overall score using project rubric:
  $$\text{Score} = (\text{Relevance} \times 2.5) + (\text{Content} \times 2.5) + (\text{Comm} \times 2.0) + (\text{Structure} \times 1.5) + (\text{Completeness} \times 1.5)$$
- Produces prioritized **Evidence Items** (issue, severity, excerpt, recommendation).
- Generates a **Personalized Follow-up Question** derived directly from the candidate's answer.
- Identifies **Recurring Gaps** across multiple practice sessions.
- Generates an adaptive **7-Day Personalized Improvement Plan**.
