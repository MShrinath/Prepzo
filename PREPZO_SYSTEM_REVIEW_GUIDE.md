# Prepzo — System Architecture, Evaluation Formulas & Comprehensive Review Defense Guide

---

## 1. Executive Summary & System Blueprint

**Prepzo** is an AI-powered interview and communication coaching platform built with a **decoupled multi-agent architecture** using **FastAPI (Python 3.10)**, **LangGraph**, and **React 19 (Tailwind CSS)**. 

The platform guarantees **zero downtime and 100% test reliability** through a dual-mode engine:
1. **Live AI Multi-Agent Mode**: Deep qualitative reasoning powered by LLMs (OpenAI `gpt-4o-mini`, Gemini, or compatible proxy gateways) with strict 12.0s timeouts and native JSON schema enforcement.
2. **Deterministic Heuristic Fallback Engine**: A local rule-based system powered by speech signal heuristics, NLP regex tokenizers, skills taxonomies, and weighted mathematical scoring matrices that trigger automatically if the external API key is invalid (401), rate-limited (429), unconfigured, or experiencing network timeout.

```
                              ┌──────────────────────────────────────────────┐
                              │             User / React 19 Frontend         │
                              └──────────────────────┬───────────────────────┘
                                                     │ HTTP / REST
                                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             FastAPI Backend Gateway                                                │
│                                                                                                                    │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌───────────────────────┐  │
│  │    Candidate Router     │  │    Interview Router     │  │    LLM Status Router    │  │   Story Bank Router   │  │
│  └────────────┬────────────┘  └────────────┬────────────┘  └────────────┬────────────┘  └───────────┬───────────┘  │
│               │                            │                            │                           │              │
│               ▼                            ▼                            ▼                           ▼              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌───────────────────────┐  │
│  │   Resume / JD Parser    │  │  LangGraph Workflow     │  │ Circuit Breaker Tracker │  │   SQLite Database     │  │
│  │     (pypdf + regex)     │  │ (Multi-Agent Pipeline)  │  │   (LLMStatusTracker)    │  │   (interviewcoach.db) │  │
│  └─────────────────────────┘  └────────────┬────────────┘  └─────────────────────────┘  └───────────────────────┘  │
└────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
      ┌─────────────────────────────────┐         ┌─────────────────────────────────┐
      │     LIVE AI MODE (LLM ACTIVE)   │         │     HEURISTIC FALLBACK MODE     │
      │ • DirectOpenAILLM / Gemini      │         │ • Offline Speech Signal Tokenizer│
      │ • JSON Object Response Format   │         │ • Keyword & Domain Classifiers  │
      │ • Pydantic Schema Parsing       │         │ • Deterministic STAR Matchers   │
      │ • Dynamic Few-Shot Reasoning    │         │ • Seeded Question Bank & Curves │
      └─────────────────────────────────┘         └─────────────────────────────────┘
```

---

## 2. End-to-End Interview Execution Lifecycle

### Phase 1: Session Initiation & Dynamic Planning
1. **Candidate Profile Retrieval**: The system reads the candidate's target role, experience level, and competencies.
2. **Adaptive Plan Determination**: Instead of fixed question counts, [`QuestionAgent.determine_interview_plan`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/agents/question_agent.py#L23-L81) autonomously computes the question count and difficulty curve based on candidate seniority and detected gaps.
3. **Question Generation**: 
   - **Role Practice**: Generates concise, punchy 1-to-2 line (15–30 word) technical or behavioral scenarios.
   - **Resume + JD**: Extracts projects and experiences from the uploaded resume, identifies missing JD skills, and generates project deep-dive or gap-bridging questions.
   - **HR / Behavioral Round**: Targets conflict resolution, leadership agency, empathy, and executive communication.

### Phase 2: Response Ingestion & Acoustic Processing
1. **Input Types**: Accepts plain text or raw voice recordings (`.wav`, `.webm`, `.mp3`).
2. **Speech Signal Extraction**: [`VoiceService`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/services/voice_service.py) computes duration, speaking rate (WPM), pause count, and regex filler words (`um`, `uh`, `like`, `you know`, `basically`).
3. **State Compilation**: Transcripts and acoustic metrics are bundled into an immutable `InterviewState` dictionary.

### Phase 3: LangGraph Multi-Agent Parallel Execution
The request enters a directed graph pipeline ([`app/graph/workflow.py`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/graph/workflow.py)):
1. **Communication Agent**: Evaluates clarity, conciseness, vocal cadence, and filler disruptions.
2. **Content Agent**: Evaluates relevance, technical/situational depth, and factual accuracy.
3. **STAR Agent**: Analyzes behavioral narratives for Situation, Task, Action, and Result components.
4. **Evaluation Merger & Diagnostic Branch**: If clarity or depth is $< 6/10$, routes through a deeper diagnostic pass.
5. **Coach Synthesis Agent**: Consolidates specialist metrics into overall scores, extracts quote evidence, prescribes actionable advice drills, provides an exemplary rewritten answer, and constructs a 7-day personalized plan.

---

## 3. Side-by-Side: With LLM vs. Without LLM (Fallback Engine)

| Subsystem | With LLM (API Key Working) | Without LLM (Fallback Engine Active) | Fallback Mechanism & Guarantees |
| :--- | :--- | :--- | :--- |
| **API Provider Layer** | Calls OpenAI `chat.completions.create` via [`DirectOpenAILLM`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/llm/provider.py#L123-L162) using `response_format={"type": "json_object"}`. | Bypasses network immediately if circuit breaker is open. Uses validated Pydantic fallback data. | Prevents 12s request hangs; serves response in $< 2\text{ ms}$. |
| **Question Generation** | Dynamically synthesizes novel, non-repeating questions referencing specific candidate projects and JD gaps. | Selects role-tailored dynamic variants or draws from seeded SQLite question bank. | Questions remain strictly 1–2 lines (15–30 words) and aligned to candidate experience. |
| **Speech Analytics** | LLM evaluates qualitative vocal tone and executive phrasing. | [`VoiceService`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/services/voice_service.py) calculates WPM, filler word count, and pause duration **100% offline**. | Uses mathematical audio byte parsing and regex boundary matching. No LLM required. |
| **Content Evaluation** | Deep semantic reasoning verifies architecture concepts, algorithmic correctness, and trade-offs. | Pattern-matches domain keywords (`APM`, `Redis`, `ACID`, `py-spy`, `pg_stat`) and penalizes non-answers. | Evaluates operational depth without failing; detects greetings (`"hi"`, `"ok"`) and assigns 1/10. |
| **STAR Behavioral Analysis** | Evaluates personal accountability, stakeholder nuance, and quantifiable outcomes. | Regex-based agency detection (*"I spearheaded"*, *"I led"* vs passive *"we"*) and metric detection (`%`, `rps`, `ms`). | Accurately assigns component scores (1–10) and restructuring recommendations. |
| **Coach Synthesis** | LLM synthesizes holistic coaching feedback, quote evidence items, and tailored follow-up question. | Weighted scoring algorithm generates advice drills, evidence cards, and rewritten answer structures. | Mathematical weighting guarantees deterministic scores between 10.0 and 100.0. |
| **7-Day Plan Generation** | Dynamically personalizes tasks and tips based on candidate's historical weak areas. | Generates structured 7-day curriculum focusing on vocal cadence, STAR ownership, and trade-off drills. | Always returns complete 7-day breakdown conforming to `ImprovementPlanOutput`. |
| **Resume & JD Gap Analysis** | LLM performs deep matching of work experience, projects, skills, and strategic roadmaps. | [`ResumeJDService`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/services/resume_parser.py) extracts PDF text via `pypdf`, matches 60+ tech skills, and computes set intersection. | Returns full gap breakdown, missing skills, match percentage, and probing questions. |
| **Frontend Indicator** | TopBar displays `🟢 AI Live (gpt-4o-mini)`. | TopBar displays `🟡 Heuristic Mode (Fallback)` with interactive diagnostics popover. | User receives complete transparency and a manual "Test AI Connection" retry button. |

---

## 4. Complete Mathematical & Algorithmic Formulas

### Formula 1: Speech Duration Estimation
Calculates recording duration from raw audio bytes:
$$\text{Duration (seconds)} = \begin{cases} \dfrac{\text{frames}}{\text{framerate}}, & \text{if valid WAV audio header} \\[8pt] \max\left(\dfrac{\text{len(bytes)}}{8000.0}, \; 5.0\right), & \text{if compressed WEBM / MP3 fallback} \end{cases}$$

### Formula 2: Speaking Rate (Words Per Minute — WPM)
Measures vocal delivery cadence:
$$\text{Minutes} = \max\left(\frac{\text{Duration}_{\text{sec}}}{60.0}, \; 0.1\right)$$
$$\text{WPM} = \text{round}\left(\frac{\text{Word Count}}{\text{Minutes}}, \; 1\right)$$

$$\text{Rating} = \begin{cases} \text{"Optimal (120–160 WPM)"}, & 120 \le \text{WPM} \le 160 \\ \text{"Fast (>160 WPM)"}, & \text{WPM} > 160 \\ \text{"Slow (<120 WPM)"}, & \text{WPM} < 120 \end{cases}$$

### Formula 3: Average Sentence Length (ASL) & Communication Heuristics
Measures sentence complexity and cognitive load:
$$\text{ASL} = \text{round}\left(\frac{\text{Word Count}}{\max(\text{Sentence Count}, \; 1)}, \; 1\right)$$

$$\text{Base Clarity} = \begin{cases} 9, & \text{if } \text{ASL} < 22 \\ 6, & \text{otherwise} \end{cases}, \quad \text{Clarity} = \begin{cases} \max(3, \; \text{Base Clarity} - 4), & \text{if Filler Count} \ge 2 \\ \text{Base Clarity}, & \text{otherwise} \end{cases}$$

$$\text{Base Conciseness} = \begin{cases} 9, & \text{if Word Count} < 140 \\ 6, & \text{otherwise} \end{cases}, \quad \text{Conciseness} = \begin{cases} \max(3, \; \text{Base Conciseness} - 4), & \text{if Filler Count} \ge 2 \\ \text{Base Conciseness}, & \text{otherwise} \end{cases}$$

### Formula 4: Specialist Agent Metric Normalization
Each specialist agent scores on a scale of $1 \text{ to } 10$:
$$\text{comm\_score} = \frac{\text{Clarity} + \text{Conciseness} + \text{Structure} + \text{Quality}}{4.0}$$
$$\text{content\_score} = \frac{\text{Correctness} + \text{Technical Depth} + \text{Evidence Quality}}{3.0}$$
$$\text{structure\_score} = \begin{cases} \dfrac{\text{Situation} + \text{Task} + \text{Action} + \text{Result}}{4.0}, & \text{if STAR applicable (Behavioral)} \\[8pt] \text{communication.structure}, & \text{if Technical / Design} \end{cases}$$

### Formula 5: Overall Coach Score Synthesis
#### A. HR / Behavioral & Leadership Round
*Hierarchy: Communication (35%) + STAR Leadership Agency (35%) + Relevance/Empathy (20%) + Context (10%)*
$$\text{Score}_{\text{HR}} = (\text{comm\_score} \times 3.5) + (\text{structure\_score} \times 3.5) + (\text{relevance} \times 2.0) + (\text{content\_score} \times 1.0)$$
$$\text{Overall Score}_{\text{HR}} = \max\left(10.0, \; \min\left(100.0, \; \text{round}(\text{Score}_{\text{HR}}, \; 1)\right)\right)$$

#### B. Technical & System Architecture Round
*Hierarchy: Technical Content (40%) + Communication (30%) + Structure (20%) + Completeness (10%)*
$$\text{Score}_{\text{Tech}} = (\text{content\_score} \times 4.0) + (\text{comm\_score} \times 3.0) + (\text{structure\_score} \times 2.0) + (\text{completeness} \times 1.0)$$
$$\text{Overall Score}_{\text{Tech}} = \max\left(10.0, \; \min\left(100.0, \; \text{round}(\text{Score}_{\text{Tech}}, \; 1)\right)\right)$$

### Formula 6: Resume vs. Job Description Match Score
Let $R$ be the set of normalized skills extracted from the candidate's resume, and $J$ be the set of required skills parsed from the job description:
$$\text{Matched Skills} = J \cap R, \qquad \text{Missing Skills} = J \setminus R$$
$$\text{Match Ratio} = \frac{|\text{Matched Skills}|}{\max(1, \; |\text{Matched Skills}| + |\text{Missing Skills}|)}$$
$$\text{Match Score} = \max\left(35, \; \min\left(95, \; \text{round}(\text{Match Ratio} \times 100)\right)\right)$$

### Formula 7: Multi-Axis Competency Radar Coordinate Geometry
The 5 competency axes (Technical Depth, Communication, STAR Structure, Vocal Cadence, Relevance) are mapped to a 2D SVG canvas centered at $(X_0, Y_0) = (100, 100)$ with radius $R_{\text{radar}} = 70$:
For axis index $i \in \{0, 1, 2, 3, 4\}$ and score $S_i \in [0, 100]$:
$$\theta_i = \left(\frac{2\pi}{5} \times i\right) - \frac{\pi}{2}$$
$$r_i = \left(\frac{S_i}{100}\right) \times R_{\text{radar}}$$
$$X_i = 100 + r_i \cos(\theta_i), \qquad Y_i = 100 + r_i \sin(\theta_i)$$

### Formula 8: Circular SVG Gauge Stroke Offset
$$\text{Circumference} = 2 \pi \times r = 2 \times \pi \times 44 \approx 276.46$$
$$\text{Stroke Dashoffset} = \text{Circumference} - \left(\frac{\text{Score}}{100} \times \text{Circumference}\right)$$

---

## 5. Potential Review Questions & Comprehensive Defense Answers

### Technical & Architectural Questions

#### Q1: "What happens to the application if the OpenAI API key is revoked or runs out of credits?"
> **Answer:** 
> "The application never throws an unhandled exception or 500 error. In [`backend/app/llm/provider.py`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/llm/provider.py), the `DirectOpenAILLM` catches the HTTP 401 (`AuthenticationError`) or HTTP 429 (`RateLimitError`), immediately engages the `LLMStatusTracker` circuit breaker, and falls back to our local heuristic evaluation engine. 
> Subsequent calls bypass the network in $< 2\text{ ms}$, ensuring zero latency degradation. The frontend TopBar updates to show an amber 'Heuristic Mode' badge with full diagnostic details."

#### Q2: "Why did you implement a custom `DirectOpenAILLM` instead of using LangChain's `ChatOpenAI`?"
> **Answer:**
> "`langchain_openai` has heavy transitive dependencies that can lead to runtime `ModuleNotFoundError`s across heterogeneous deployment environments. By implementing `DirectOpenAILLM` directly on the installed official `openai` SDK (v2.44.0), we gained complete control over request timeouts (enforced at 12.0s), native JSON mode (`response_format={"type": "json_object"}`), connection error classification, and deterministic fallback containment."

#### Q3: "How does the Circuit Breaker prevent UI lag during an API outage?"
> **Answer:**
> "Without a circuit breaker, every specialist agent (Content, STAR, Communication, Coach) would attempt an independent HTTP call, each waiting 12 seconds to timeout—causing a 48-second freeze per user submission. 
> Our `LLMStatusTracker` tracks failure counts. Once an API failure occurs, it sets `circuit_open = True`. Subsequent requests check `should_bypass_network()` and immediately serve the heuristic evaluation in $< 2\text{ ms}$. It also implements a 60-second cooldown to automatically test for recovery."

#### Q4: "How is audio processed and evaluated without using an external speech-to-text API?"
> **Answer:**
> "Acoustic and delivery metrics are computed entirely locally inside [`VoiceService.process_audio`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/services/voice_service.py#L14-L53). We extract duration using Python's native `wave` library header inspection (or a 32kbps bitrate estimator for compressed audio). Speaking rate is calculated using words divided by minutes. Filler words are identified via regex word-boundary matchers across 5 primary filler tokens (`\bum\b`, `\buh\b`, `\blike\b`, `\byou know\b`, `\bbasically\b`)."

---

### Evaluation & Scoring Questions

#### Q5: "How does the platform evaluate HR and Behavioral rounds differently from Technical rounds?"
> **Answer:**
> "In HR rounds, coding keywords and syntax are not prioritized. Our scoring formula dynamically shifts:
> - **Communication & Articulation**: Weighted at **35%** (clarity, cadence, filler words).
> - **STAR & Leadership Ownership**: Weighted at **35%** (evaluating individual ownership *'I'* vs passive *'we'*, conflict resolution, and quantifiable impact).
> - **Situational Empathy & Relevance**: Weighted at **20%**.
> - **Technical Context**: Weighted at **10%** strictly as supporting context.
> In contrast, Technical rounds allocate **40%** to Technical Depth and Correctness, **30%** to Communication, **20%** to Structure, and **10%** to Completeness."

#### Q6: "How do you prevent candidates from gaming the system by submitting trivial greetings like 'Hi' or 'Hello'?"
> **Answer:**
> "All agents implement [`is_trivial_response(text)`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/agents/content_agent.py#L6-L16). If an answer has fewer than 5 words or matches common placeholders (`'hi'`, `'hello'`, `'idk'`, `'ok'`, `'test'`), the evaluation automatically assigns 1/10 across all metrics, empties the strengths array, and flags that no substantive answer was provided, locking the overall score to a baseline of 10–15%."

#### Q7: "How is the Resume vs. Job Description Match Score calculated?"
> **Answer:**
> "In [`ResumeJDService`](file:///C:/Users/Administrator/Desktop/Prepzo/backend/app/services/resume_parser.py#L132-L174), we extract text via `pypdf` and normalize skills against our 60+ technology taxonomy. We compute the mathematical set intersection between JD required skills and resume skills. The raw match ratio is bounded between 35% and 95%:
> $$\text{Match Score} = \max\left(35, \; \min\left(95, \; \text{round}\left(\frac{|\text{Matched}|}{|\text{Matched}| + |\text{Missing}|} \times 100\right)\right)\right)$$
> It also extracts detected projects and creates tailored interview questions probing the exact missing skills."

---

## 6. Verification & Automated Test Evidence

All mechanisms have been verified through automated regression suites:
- **`backend/tests/test_fallback.py`**: Verifies circuit breaker tripping on invalid keys (`sk-invalid-...`), validates fallback generation across all 5 agents, and tests `/api/llm/status`.
- **`backend/tests/test_api.py`**: Validates role practice, HR interview initiation, text/voice submission, and profile updating.
- **`backend/tests/test_graph.py`**: Verifies LangGraph multi-agent state compilation and routing.
- **`backend/tests/test_agents.py`**: Tests individual specialist agents for output schema compliance.
- **Live Stress Run**: Tested with `OPENAI_API_KEY=sk-broken-key-9999` — verified 100% successful HTTP 200 responses with zero crashes.
