# AI-Powered Communication & Interview Coaching System
## Comprehensive Project Plan

> **Project type:** AI-powered interview practice, communication coaching, and personalized improvement platform  
> **Primary architecture:** LangGraph multi-agent workflow  
> **Backend:** Python + FastAPI  
> **Frontend:** React  
> **Database:** PostgreSQL  
> **Voice:** Whisper-compatible speech-to-text  
> **Optional retrieval:** ChromaDB/pgvector  
> **Deployment:** Docker / Docker Compose  
> **Primary objective:** Satisfy Tasks 1–5 of the provided project specification with a modular, explainable, demonstrable implementation.

---

# 1. Executive Summary

The project will build an AI-powered Communication & Interview Coaching platform that allows candidates to:

1. Create a candidate profile.
2. Select a target role/interview category.
3. Receive an appropriate interview question.
4. Submit a text or voice response.
5. Have the response evaluated by multiple specialized AI agents.
6. Receive structured, evidence-based feedback.
7. Practice personalized follow-up questions.
8. Track recurring communication and response-quality gaps.
9. Receive a personalized improvement plan.
10. Compare performance across multiple practice sessions.

The system will use **LangGraph as the central multi-agent orchestration layer**.

The project will NOT depend on SynaptAI. The knowledge/retrieval layer will instead use conventional tools such as:

- PostgreSQL
- pgvector or ChromaDB
- LangChain
- LangGraph
- structured JSON/Pydantic outputs
- optional RAG

The system should be more than a simple chatbot. The important architectural distinction is that the application will contain multiple specialist agents with clearly defined responsibilities and a central orchestration workflow.

---

# 2. Problem Statement

Traditional interview preparation systems generally provide static interview questions and sample answers.

They often do not provide:

- personalized question selection
- detailed response evaluation
- communication analysis
- behavioral response structure analysis
- evidence-based feedback
- adaptive follow-up questions
- recurring weakness detection
- longitudinal progress tracking
- personalized improvement plans
- voice-based practice

The proposed system addresses these limitations through a multi-agent AI coaching workflow.

---

# 3. Core Goals

# 3A. Interview Modes

The application must support **three distinct interview modes**. These modes are a core part of the product experience and should influence question selection, agent routing, evaluation criteria, and personalization.

## Mode 1 — Role Practice

### Purpose

The candidate selects a preset role and receives a mock interview drawn from a curated, tagged interview-question bank.

### Preset roles

The initial role catalogue should include:

1. SDE / Software Development Engineer
2. Full Stack Developer
3. AI/ML Engineer
4. Cloud Engineer
5. DevOps Engineer
6. Data Analyst
7. Product Manager
8. Sales
9. Customer Success

The architecture should allow additional roles to be added without changing the LangGraph workflow.

### Question selection

Questions should be tagged by:

- role
- competency
- difficulty
- question type
- technical/behavioral category
- technology/topic
- expected skills
- follow-up category

Example:

```json
{
  "question_id": "sde_python_001",
  "question": "How would you optimize a Python API that has high latency?",
  "role": "SDE",
  "competency": "Performance Optimization",
  "difficulty": "medium",
  "question_type": "technical",
  "category": "backend",
  "tags": ["python", "api", "performance"]
}
```

### Interview behavior

The Question Agent should:

1. read the selected role
2. select an appropriate question
3. consider difficulty
4. avoid recently asked questions
5. maintain a sensible interview progression
6. generate follow-up questions when useful

The system should support a mixture of technical and behavioral questions where appropriate for the selected role.

---

## Mode 2 — Resume + Job Description

### Purpose

The candidate uploads a resume and provides a job description. The system analyzes both and creates a tailored mock interview.

This mode should be the most personalized interview mode.

### Inputs

- Resume PDF or TXT
- Job description text
- optional target company
- optional preferred difficulty
- optional interview duration

### Resume processing pipeline

```text
Resume PDF/TXT
      |
      v
Document Extraction
      |
      v
Resume Parser
      |
      +--> Skills
      +--> Experience
      +--> Projects
      +--> Technologies
      +--> Achievements
      +--> Education
      |
      v
Candidate Profile
```

### Job description processing pipeline

```text
Job Description
      |
      v
JD Parser
      |
      +--> Required Skills
      +--> Responsibilities
      +--> Preferred Skills
      +--> Competencies
      +--> Seniority
      +--> Domain
      |
      v
Job Profile
```

### Gap analysis

The system should compare the resume with the JD.

Example:

```text
Resume:
Python
FastAPI
PostgreSQL
Docker

Job Description:
Python
FastAPI
AWS
Kubernetes
Docker

Identified gap:
AWS + Kubernetes
```

The gap does NOT automatically mean the candidate lacks the skill. It means the skill was not sufficiently represented in the supplied resume and should be probed carefully during the interview.

### Tailored interview generation

The resulting interview should mix:

**Technical questions grounded in the resume**

Examples:

- "You mention building a FastAPI service. How did you structure the API?"
- "Your resume mentions PostgreSQL optimization. What bottleneck did you encounter?"
- "You listed Docker in your project. How did you use it in deployment?"

**Behavioral questions probing gaps against the JD**

If the JD emphasizes leadership but the resume has limited evidence:

- "Tell me about a time you had to coordinate work across team members."
- "Describe a situation where you had to take ownership beyond your assigned task."

If the JD requires AWS but the resume does not demonstrate it:

- ask an appropriate knowledge/probing question
- do not falsely assume the candidate has AWS experience

### Important grounding rule

Questions must not invent resume facts.

Bad:

> "You led a team of 10 engineers at Company X..."

when the resume does not contain that information.

Good:

> "Your resume mentions working on X. Can you explain your contribution?"

### Mode-specific agent workflow

```text
Resume
  |
  v
Resume Parser
  |
  v
Candidate Profile
       \
        \
         +----> Gap Analysis ----+
        /                         |
       /                          v
Job Description             Interview Question Agent
                                   |
                                   v
                         Tailored Interview
                                   |
                 +-----------------+----------------+
                 |                 |                |
                 v                 v                v
            Technical         Behavioral       Gap-Probing
            Questions         Questions         Questions
```

---

## Mode 3 — HR Round

### Purpose

Provide role-agnostic behavioral and communication practice.

This mode focuses primarily on communication, behavioral reasoning, workplace situations, motivation, and interpersonal responses rather than role-specific technical knowledge.

### Core HR topics

The curated HR question bank should include:

- motivation
- career goals
- strengths and weaknesses
- conflict resolution
- teamwork
- culture fit
- stress management
- receiving feedback
- giving feedback
- adaptability
- failure
- handling difficult situations
- leadership
- ownership
- ambiguity
- workplace communication

### Example questions

**Motivation**

> "Why are you interested in this type of role?"

**Conflict resolution**

> "Tell me about a time you disagreed with a teammate. How did you handle it?"

**Culture/workplace fit**

> "What kind of team environment helps you do your best work?"

**Stress management**

> "Describe a time when you had multiple urgent priorities. How did you manage them?"

**Receiving feedback**

> "Tell me about a time you received difficult feedback. What did you do with it?"

### Evaluation emphasis

HR mode should emphasize:

- communication
- clarity
- structure
- relevance
- self-awareness in the response
- ownership
- emotional/contextual appropriateness of the described action
- STAR structure where applicable

The system should evaluate the candidate's response rather than make assumptions about personality or psychological characteristics.

---

## Mode Selection UI

The landing page should present three clear choices:

```text
┌─────────────────────────────────────────────────────────┐
│              Choose Interview Mode                      │
├─────────────────┬─────────────────┬─────────────────────┤
│                 │                 │                     │
│  ROLE PRACTICE  │ RESUME + JD     │      HR ROUND       │
│                 │                 │                     │
│ Pick a role and │ Upload resume + │ Practice behavioral │
│ start a curated │ paste a job     │ and communication  │
│ mock interview  │ description     │ questions           │
│                 │                 │                     │
│ [Start]         │ [Start]         │ [Start]             │
└─────────────────┴─────────────────┴─────────────────────┘
```

After mode selection, the frontend should display only the configuration fields relevant to that mode.


## 3.1 Functional Goals

The system must support:

- candidate profile creation
- three interview modes
- preset role selection
- curated tagged question-bank retrieval
- resume PDF/TXT upload
- job description input
- resume parsing
- job-description parsing
- resume-to-JD gap analysis
- tailored technical and behavioral question generation
- HR behavioral/communication practice
- competency selection
- difficulty selection
- question generation/selection
- text response submission
- voice response submission
- speech-to-text conversion
- response evaluation
- communication analysis
- content analysis
- STAR analysis
- coaching feedback
- follow-up questions
- session history
- progress tracking
- recurring gap detection
- personalized improvement planning

## 3.2 Technical Goals

The implementation should demonstrate:

- LangGraph orchestration
- specialized AI agents
- shared graph state
- conditional routing
- agent handoff
- structured outputs
- persistence
- RAG/retrieval where useful
- API-based architecture
- modular code
- Dockerized execution
- testable components
- explainable evaluation

---

# 4. Requirements Mapping

The supplied evaluation consists of five tasks.

| Task | Weight | Planned implementation |
|---|---:|---|
| Task 1 – Interview Content & Candidate Profile | 20% | Question bank, candidate profile, competency taxonomy, evaluation rubrics |
| Task 2 – Intelligent Practice & Response Evaluation | 25% | Text/voice practice, LangGraph evaluation workflow, structured feedback |
| Task 3 – Multi-Agent Coaching | 25% | Question, Communication, Content, STAR, and Coach agents |
| Task 4 – Evaluation, Progress Tracking & Application | 20% | Dashboard, session history, evaluation dataset, analytics |
| Task 5 – Architecture, Documentation & Demonstration | 10% | Architecture diagram, README, design documentation, demo |

---

# 5. High-Level Architecture

```text
                         ┌─────────────────────────┐
                         │       Candidate         │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     React Frontend      │
                         │                         │
                         │ Profile / Interview    │
                         │ Voice / Feedback        │
                         │ Progress Dashboard     │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │      FastAPI API        │
                         │                         │
                         │ Sessions / Profiles     │
                         │ Responses / Results     │
                         └────────────┬────────────┘
                                      │
                                      ▼
                  ┌─────────────────────────────────────┐
                  │        LangGraph Orchestrator       │
                  │                                     │
                  │ Shared InterviewState               │
                  │ Conditional routing                 │
                  │ Agent handoffs                      │
                  └───────────────┬─────────────────────┘
                                  │
              ┌───────────────────┼────────────────────┐
              │                   │                    │
              ▼                   ▼                    ▼
       ┌─────────────┐    ┌─────────────┐     ┌─────────────┐
       │Communication│    │   Content   │     │    STAR     │
       │    Agent    │    │    Agent    │     │    Agent    │
       └──────┬──────┘    └──────┬──────┘     └──────┬──────┘
              │                   │                    │
              └───────────────────┼────────────────────┘
                                  ▼
                         ┌─────────────────┐
                         │  Coach Agent    │
                         │                 │
                         │ Consolidation   │
                         │ Feedback        │
                         │ Follow-up       │
                         └────────┬────────┘
                                  │
                  ┌───────────────┼────────────────┐
                  ▼               ▼                ▼
             Feedback       Follow-up        Improvement
                              Question           Plan
                  │               │                │
                  └───────────────┼────────────────┘
                                  ▼
                         ┌─────────────────┐
                         │   PostgreSQL    │
                         │                 │
                         │ Profiles        │
                         │ Sessions        │
                         │ Responses       │
                         │ Evaluations     │
                         │ Progress        │
                         └─────────────────┘
```

---

# 5A. Mode-Aware LangGraph Routing

The top-level graph should first determine the interview mode. Each mode then uses shared specialist agents but different question-selection and evaluation rules.

```text
                         Interview Mode
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
    Role Practice        Resume + JD          HR Round
          |                   |                   |
          v                   v                   v
    Question Bank       Resume Parser        HR Question Bank
          |             + JD Parser               |
          |                   |                   |
          |              Gap Analysis             |
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                    Interview Question Agent
                              |
                              v
                       Candidate Response
                              |
                              v
                     Response Processing
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
       Communication      Content           STAR
           Agent          Agent            Agent
             |                |                |
             +----------------+----------------+
                              |
                              v
                         Coach Agent
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
          Feedback        Follow-up       Improvement
                           Question           Plan
```

## Mode-aware routing rules

### Role Practice

```text
mode == "role_practice"
    -> retrieve tagged role questions
    -> consider difficulty and previous performance
    -> generate interview sequence
```

### Resume + JD

```text
mode == "resume_jd"
    -> parse resume
    -> parse JD
    -> compare skills/competencies
    -> identify supported resume evidence
    -> identify JD areas requiring probing
    -> generate tailored questions
```

### HR Round

```text
mode == "hr"
    -> retrieve HR behavioral questions
    -> prioritize communication and behavioral competencies
    -> use STAR when appropriate
    -> emphasize communication coaching
```


# 6. Technology Stack

## 6.1 Frontend

Recommended:

- React
- Vite
- TypeScript
- Material UI or Tailwind CSS
- Recharts
- Axios/fetch

Responsibilities:

- candidate profile
- role selection
- interview screen
- recording interface
- response submission
- feedback display
- progress dashboard
- session history

---

# 7. Backend

Recommended:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL

Responsibilities:

- REST API
- authentication if implemented
- session lifecycle
- profile management
- response processing
- database operations
- LangGraph invocation
- result persistence

Suggested endpoints:

```text
POST   /api/candidates
GET    /api/candidates/{id}

POST   /api/interviews
GET    /api/interviews/{id}

POST   /api/interviews/{id}/question
POST   /api/interviews/{id}/response

POST   /api/responses/text
POST   /api/responses/voice

GET    /api/interviews/{id}/feedback
GET    /api/candidates/{id}/progress

GET    /api/candidates/{id}/improvement-plan
POST   /api/interviews/{id}/follow-up
```

---

# 8. LangGraph Architecture

LangGraph will be the central orchestration framework.

The graph should manage a shared state rather than having agents communicate through uncontrolled free-form messages.

## 8.1 Core State

```python
from typing import TypedDict, List, Dict, Any, Optional

class InterviewState(TypedDict, total=False):
    candidate_id: str

    candidate_profile: Dict[str, Any]

    target_role: str
    competency: str
    difficulty: str
    question_type: str

    current_question: str
    candidate_response: str

    transcript: Optional[str]

    communication_analysis: Dict[str, Any]
    content_evaluation: Dict[str, Any]
    star_analysis: Dict[str, Any]

    aggregated_score: float

    final_feedback: Dict[str, Any]

    follow_up_question: str

    recurring_gaps: List[str]

    improvement_plan: List[str]

    session_history: List[Dict[str, Any]]

    next_action: str
```

---

# 9. Specialist Agents

## 9.1 Interview Question Agent

### Responsibility

Select or generate an appropriate interview question.

### Inputs

- target role
- candidate skills
- experience
- previous questions
- previous weaknesses
- competency
- difficulty
- question type

### Outputs

```json
{
  "question": "Tell me about a challenging project you worked on.",
  "competency": "Problem Solving",
  "difficulty": "Medium",
  "question_type": "Behavioral",
  "reason": "Tests problem-solving and ownership."
}
```

### Selection strategy

The agent should prefer:

1. questions relevant to the target role
2. questions relevant to candidate experience
3. competencies that require practice
4. areas where the candidate previously underperformed
5. appropriate difficulty

---

# 10. Communication Analysis Agent

## Responsibility

Evaluate how effectively the candidate communicates.

### Metrics

- clarity
- conciseness
- logical flow
- unnecessary repetition
- filler words
- sentence complexity
- directness
- terminology usage
- organization

For voice responses, optionally analyze:

- speaking rate
- pause duration
- filler word frequency
- response duration

Avoid attempting to infer psychological traits from voice.

### Example output

```json
{
  "clarity": 7,
  "conciseness": 6,
  "structure": 7,
  "communication_quality": 8,
  "filler_words": 5,
  "strengths": [
    "Explains the technical problem clearly"
  ],
  "weaknesses": [
    "Uses long sentences",
    "Repeats the problem statement"
  ],
  "evidence": [
    "The candidate repeats the project challenge twice."
  ]
}
```

---

# 11. Content Evaluation Agent

## Responsibility

Determine whether the candidate actually answered the question.

Evaluate:

- relevance
- correctness
- completeness
- technical depth
- supporting evidence
- ownership
- measurable outcomes

### Example

```json
{
  "relevance": 8,
  "correctness": 8,
  "completeness": 6,
  "evidence_quality": 5,
  "strengths": [
    "Clearly identifies the technical challenge"
  ],
  "gaps": [
    "Does not explain the candidate's individual contribution",
    "No measurable result"
  ]
}
```

---

# 12. STAR / Response Structure Agent

This agent is particularly important for behavioral questions.

Evaluate:

- Situation
- Task
- Action
- Result

Example:

```json
{
  "situation": {
    "score": 8,
    "evidence": "Candidate explains the project context."
  },
  "task": {
    "score": 6,
    "evidence": "The candidate does not clearly define their responsibility."
  },
  "action": {
    "score": 7,
    "evidence": "Candidate describes the steps taken."
  },
  "result": {
    "score": 4,
    "evidence": "No measurable outcome is provided."
  }
}
```

For non-behavioral questions, the STAR agent should return:

```json
{
  "applicable": false,
  "reason": "Question is technical rather than behavioral."
}
```

---

# 13. Interview Coach Agent

The Coach Agent is the final synthesis layer.

It receives:

- original question
- candidate response
- communication analysis
- content evaluation
- STAR analysis
- candidate profile
- session history

It produces:

- overall feedback
- strengths
- improvement areas
- evidence
- actionable advice
- improved answer structure
- follow-up question
- improvement plan

The Coach Agent should NOT blindly average agent scores.

It should identify overlapping findings and explain the most important actionable issues.

---

# 14. Agent Handoff

LangGraph should support conditional handoff.

Example:

```text
Response
   |
   v
Communication Agent
   |
   +---- serious clarity issue ----> deeper communication analysis
   |
   v
Content Agent
   |
   +---- technically complex ----> deeper content analysis
   |
   v
STAR Agent
   |
   +---- behavioral question ----> STAR evaluation
   |
   v
Coach Agent
```

The purpose of handoff is deeper analysis only when necessary.

This prevents every response from triggering unnecessary expensive analysis.

---

# 15. Complete LangGraph Workflow

```text
START
  |
  v
Load Candidate Profile
  |
  v
Question Agent
  |
  v
Present Question
  |
  v
Receive Response
  |
  v
Voice?
 /   \
Yes   No
 |     |
 v     |
Whisper |
 |     |
 +---> Transcript
         |
         v
   Communication Agent
         |
         v
     Content Agent
         |
         v
      STAR Agent
         |
         v
   Evaluation Merger
         |
         v
   Deeper Analysis?
      /       \
    Yes        No
     |          |
     v          |
Specialist      |
Handoff         |
     |          |
     +----------+
         |
         v
    Coach Agent
         |
         v
 Feedback Generation
         |
         +------> Follow-up Question
         |
         +------> Save Session
         |
         +------> Detect Recurring Gaps
         |
         +------> Update Improvement Plan
         |
         v
        END
```

---

# 16. Voice Pipeline

```text
Microphone
    |
    v
Audio File
    |
    v
Speech-to-Text
    |
    v
Transcript
    |
    +------> Content Agent
    |
    +------> Communication Agent
    |
    +------> STAR Agent
```

Possible implementation:

- Whisper
- faster-whisper
- OpenAI-compatible transcription API
- local transcription if hardware permits

The architecture should keep transcription behind an abstraction so the provider can be changed without rewriting the agents.

---

# 17. Question Dataset

The supplied problem statement identifies interview question datasets such as:

- RecruitView
- Awesome Interview Questions
- Interview Questions datasets
- Continuum Open-Source Interview Questions

The project should normalize the selected dataset into a common schema.

The question bank must support the three modes:

- `role_practice`
- `resume_jd`
- `hr`

A question can be available to more than one mode if appropriate.

Recommended schema:

```json
{
  "question_id": "q001",
  "question": "Tell me about yourself.",
  "mode": ["role_practice", "resume_jd"],
  "role": "Software Engineer",
  "competency": "Communication",
  "difficulty": "Easy",
  "question_type": "Behavioral",
  "expected_competencies": [
    "Communication",
    "Self-awareness"
  ],
  "evaluation_criteria": [
    "Relevant background",
    "Clear structure",
    "Role alignment"
  ]
}
```

Do not assume that every dataset has every field. Missing metadata should be normalized or generated during preprocessing.

---

# 18A. Interview Mode Data Model

Every interview session should explicitly store its mode.

```json
{
  "mode": "role_practice",
  "target_role": "SDE",
  "difficulty": "medium"
}
```

For Resume + JD:

```json
{
  "mode": "resume_jd",
  "resume_file_id": "resume_001",
  "job_description_id": "jd_001",
  "target_role": "Backend Engineer"
}
```

For HR:

```json
{
  "mode": "hr",
  "difficulty": "medium",
  "topics": [
    "conflict",
    "feedback",
    "stress_management"
  ]
}
```

The mode must be persisted with every session so that analytics and evaluation can distinguish performance across the three experiences.

---

# 18. Candidate Profile

Recommended schema:

```json
{
  "candidate_id": "candidate_001",
  "name": "Candidate",
  "target_role": "Software Engineer",
  "experience_years": 1,
  "skills": [
    "Python",
    "Java",
    "SQL",
    "AWS"
  ],
  "projects": [
    {
      "name": "Project A",
      "description": "..."
    }
  ],
  "experience": [
    {
      "company": "...",
      "role": "...",
      "description": "..."
    }
  ],
  "target_competencies": [
    "Problem Solving",
    "Communication",
    "Technical Knowledge"
  ]
}
```

---

# 19. Evaluation Rubric

A common rubric is required so that evaluations are consistent.

Suggested criteria:

| Criterion | Weight |
|---|---:|
| Relevance | 25% |
| Content quality | 25% |
| Communication | 20% |
| Structure | 15% |
| Completeness | 15% |
| **Total** | **100%** |

This is a project-defined evaluation rubric, not a claim that these weights are universal.

Scores should always include evidence.

Bad:

```text
Clarity: 6/10
```

Better:

```text
Clarity: 6/10

Evidence:
The candidate explains the technical issue clearly, but uses
several long sentences and repeats the initial problem statement.
```

---

# 20. Evidence-Based Feedback

Every weakness should have evidence.

Recommended schema:

```json
{
  "issue": "Weak Result section",
  "severity": "medium",
  "evidence": "The response describes the implementation but does not state an outcome.",
  "recommendation": "Add a measurable outcome such as latency reduction, accuracy improvement, cost reduction, or delivery impact."
}
```

This makes the system easier to evaluate and defend during the presentation.

---

# 21. Personalized Follow-Up Questions

Follow-up questions should be generated from the candidate's actual answer.

Example:

Candidate:

> "We improved the model accuracy."

Follow-up:

> "What specific changes did you make, and how much did the accuracy improve?"

Another example:

Candidate says:

> "My team solved the issue."

Follow-up:

> "What was your specific contribution to solving the issue?"

The system should avoid generic follow-up questions when a more specific question can be generated from the response.

---

# 22. Recurring Gap Detection

The application should analyze previous sessions.

Example history:

```text
Session 1
Result: Missing measurable outcomes

Session 2
Result: Missing measurable outcomes

Session 3
Result: Weak personal ownership

Session 4
Result: Missing measurable outcomes
```

The system identifies:

```text
Recurring Gap:
Measurable results in behavioral answers
```

Then the Coach Agent generates a targeted plan.

---

# 23. Personalized Improvement Plan

Example:

```text
7-Day Improvement Plan

Day 1:
Practice "Tell me about yourself."

Day 2:
Practice one STAR behavioral question.

Day 3:
Practice explaining a technical project in 90 seconds.

Day 4:
Practice adding measurable results.

Day 5:
Practice ownership-focused behavioral questions.

Day 6:
Complete a mixed mock interview.

Day 7:
Repeat the original questions and compare results.
```

The actual plan should be generated from the candidate's history rather than being hardcoded.

---

# 24. Progress Tracking

Track at least:

- overall score
- communication score
- content score
- structure score
- relevance score
- completeness score
- STAR scores
- response duration
- filler words for voice sessions
- recurring weaknesses
- questions practiced
- difficulty progression

Example:

```text
Session 1
Communication: 62
Content: 70
Structure: 55

Session 2
Communication: 68
Content: 73
Structure: 61

Session 3
Communication: 75
Content: 78
Structure: 69
```

Charts should show trends rather than only displaying a single score.

---

# 25. Database Design

PostgreSQL tables:

```text
users
candidate_profiles
candidate_skills
candidate_projects

roles
competencies
interview_questions

interview_sessions
interview_questions_attempted
candidate_responses

communication_evaluations
content_evaluations
star_evaluations

coaching_feedback
follow_up_questions

performance_metrics
recurring_gaps
improvement_plans
improvement_plan_items
```

---

# 26. Suggested Database Relationships

```text
Candidate
   |
   +---- CandidateProfile
   |
   +---- CandidateSkill
   |
   +---- CandidateProject
   |
   +---- InterviewSession
             |
             +---- Response
             |
             +---- CommunicationEvaluation
             |
             +---- ContentEvaluation
             |
             +---- STAREvaluation
             |
             +---- CoachingFeedback
             |
             +---- FollowUpQuestion
```

---

# 27. Retrieval / RAG

RAG is optional but useful.

Use it for:

- role descriptions
- competency definitions
- interview question metadata
- evaluation rubrics
- technical concepts
- company-specific interview material if provided by the user
- coaching resources

Possible architecture:

```text
Documents
   |
   v
Chunking
   |
   v
Embeddings
   |
   v
Vector Store
   |
   v
Retriever
   |
   v
Agent Context
```

Possible implementations:

- ChromaDB
- pgvector
- FAISS for a lightweight prototype

PostgreSQL + pgvector is attractive if minimizing infrastructure is important.

---

# 28. LLM Strategy

The agents should use structured output rather than unrestricted natural language wherever possible.

Example:

```python
class CommunicationEvaluation(BaseModel):
    clarity: int
    conciseness: int
    structure: int
    communication_quality: int
    strengths: list[str]
    weaknesses: list[str]
    evidence: list[str]
```

Then:

```python
structured_llm = llm.with_structured_output(
    CommunicationEvaluation
)
```

This reduces parsing errors and makes the agents easier to test.

---

# 29. Model Provider Abstraction

Do not hardcode the entire application to one LLM provider.

Create:

```text
backend/app/llm/
    base.py
    provider.py
    config.py
```

The agents should call an abstraction such as:

```python
llm = get_llm("interview_evaluator")
```

This makes it possible to switch between supported providers/models without rewriting the agent logic.

---

# 30. Prompt Design

Every agent should have a dedicated system prompt.

Example Communication Agent:

```text
You are the Communication Analysis Agent.

Your responsibility is to evaluate the candidate's communication,
not their personality or intelligence.

Evaluate:
- clarity
- conciseness
- organization
- unnecessary repetition
- terminology
- directness

Use only evidence contained in the candidate response.

Return structured JSON matching the supplied schema.

Every identified weakness must include supporting evidence.

Do not invent candidate experience.
Do not infer psychological characteristics.
```

---

# 31. Question Agent Prompt Principles

The Question Agent should:

- respect target role
- respect candidate experience
- avoid repeated questions
- consider previous weaknesses
- adjust difficulty
- distinguish behavioral and technical questions
- generate follow-ups from actual answers

---

# 32. Content Agent Prompt Principles

The Content Agent should:

- determine whether the response answers the question
- distinguish factual errors from missing detail
- use retrieved reference material where applicable
- identify unsupported claims
- provide evidence
- avoid inventing candidate experience

---

# 33. STAR Agent Prompt Principles

The STAR Agent should:

- determine whether STAR is appropriate
- identify each component
- quote/paraphrase evidence from the response
- identify missing components
- recommend how to restructure the response

---

# 34. Coach Agent Prompt Principles

The Coach Agent should:

- consolidate specialist results
- resolve overlapping findings
- prioritize actionable improvements
- preserve candidate authenticity
- never invent achievements
- produce follow-up questions
- update recurring weaknesses
- create an improvement plan

---

# 35. Frontend Pages

## Dashboard

Display:

- target role
- current progress
- recent sessions
- recurring gaps
- recommended practice

## Interview Setup

Fields:

- target role
- difficulty
- question type
- competency
- text/voice mode

## Interview Screen

Display:

```text
Question

[ Record Answer ]

or

[ Type Answer ]

[ Submit ]
```

## Feedback Screen

Display:

- overall evaluation
- communication
- content
- structure
- strengths
- improvement areas
- evidence
- improved structure
- follow-up question

## Progress Screen

Display:

- score trends
- communication trends
- content trends
- STAR trends
- recurring gaps
- completed sessions

---

# 36. Voice UI

The voice interface should provide:

```text
[ Start Recording ]

Recording...

[ Stop ]

Processing...

Transcript:

...

[ Submit for Evaluation ]
```

Optional:

- recording timer
- waveform
- audio playback
- transcript editing before evaluation

Allow transcript correction because speech-to-text can make mistakes.

---

# 36A. Mode-Specific APIs

## Get Available Roles

```http
GET /api/interview-modes/role-practice/roles
```

Response:

```json
{
  "roles": [
    "SDE",
    "Full Stack",
    "AI/ML",
    "Cloud",
    "DevOps",
    "Data Analyst",
    "Product Manager",
    "Sales",
    "Customer Success"
  ]
}
```

## Start Role Practice

```http
POST /api/interviews/role-practice
```

```json
{
  "candidate_id": "candidate_001",
  "role": "SDE",
  "difficulty": "medium"
}
```

## Start Resume + JD Interview

```http
POST /api/interviews/resume-jd
```

Multipart/form-data:

```text
resume: resume.pdf
job_description: "We are looking for..."
difficulty: medium
```

The backend should parse both documents before invoking the tailored question workflow.

## Start HR Round

```http
POST /api/interviews/hr
```

```json
{
  "candidate_id": "candidate_001",
  "difficulty": "medium",
  "topics": [
    "conflict_resolution",
    "receiving_feedback",
    "stress_management"
  ]
}
```


# 37. API Flow

## Start Interview

```http
POST /api/interviews
```

Request:

```json
{
  "candidate_id": "candidate_001",
  "target_role": "Software Engineer",
  "difficulty": "medium",
  "question_type": "behavioral"
}
```

Response:

```json
{
  "session_id": "session_123",
  "question": "Tell me about a challenging project you worked on."
}
```

---

# 38. Submit Text Response

```http
POST /api/interviews/session_123/response
```

```json
{
  "response_type": "text",
  "response": "..."
}
```

Backend:

```text
FastAPI
  |
  v
LangGraph
  |
  +-- Communication
  +-- Content
  +-- STAR
  |
  v
Coach
  |
  v
Feedback
```

---

# 39. Submit Voice Response

```http
POST /api/interviews/session_123/response/voice
```

Multipart upload:

```text
audio.wav
```

Backend:

```text
Audio
  |
  v
Whisper
  |
  v
Transcript
  |
  v
LangGraph
```

---

# 40. Existing GitHub Repository Reference

One useful reference is:

**code100x/ai-interviewer**

Repository:

https://github.com/code100x/ai-interviewer

It can be studied as a reference for an existing AI interviewer/full-stack implementation, particularly its interview-session and persistence concepts.

Do not assume its architecture exactly matches this project. Treat it as a reference implementation rather than a specification.

---

# 41. Another Useful Reference

The repository:

**SayamAlt/AI-Powered-Interview-Preparation-Guide-using-Langchain**

Repository:

https://github.com/SayamAlt/AI-Powered-Interview-Preparation-Guide-using-Langchain

It is relevant because it demonstrates interview question generation, answer evaluation, feedback, and voice-related functionality.

Use it as a reference for individual capabilities rather than copying its architecture wholesale.

The proposed system should extend these ideas with a proper LangGraph multi-agent workflow, structured agent outputs, persistent progress tracking, and explicit evaluation evidence.

---

# 42. What NOT to Copy Directly

Do not simply clone an existing interview project and rename it.

The project should demonstrate original architectural work through:

- LangGraph state management
- specialist agents
- agent handoff
- conditional routing
- structured evaluation schemas
- evidence-based feedback
- recurring gap detection
- adaptive follow-up questions
- longitudinal improvement plans
- evaluation framework
- modular API architecture

---

# 43. Three Possible Team Approaches

If three people are independently building this project, they can use the same requirements while taking substantially different technical directions.

---

# Approach 1 — Knowledge-Grounded Interview Coach

## Main idea

Focus on structured interview knowledge and role/competency matching.

## Core architecture

```text
Candidate
   |
   v
Profile
   |
   v
Question Retrieval
   |
   v
LangGraph
   |
   +-- Communication
   +-- Content
   +-- STAR
   |
   v
Coach
```

## Main innovation

The system builds a structured knowledge base containing:

- roles
- competencies
- questions
- evaluation criteria
- technical topics
- behavioral patterns

## Best demonstration

Show how the same candidate receives different questions based on:

- target role
- competency
- experience
- previous weakness

---

# Approach 2 — Voice-First Communication Coach

## Main idea

Focus heavily on spoken interview performance.

Pipeline:

```text
Microphone
    |
    v
Speech-to-Text
    |
    +----> Transcript
    |
    +----> Audio Metrics
              |
              v
       LangGraph Agents
```

Analyze observable features such as:

- speech rate
- filler words
- pauses
- response duration
- clarity of transcript
- conciseness
- structure

## Main innovation

The application evaluates both:

```text
WHAT the candidate said
+
HOW the candidate delivered it
```

The system should avoid psychological inference from voice.

## Best demonstration

Record a spoken answer and show:

- transcript
- filler words
- speaking rate
- communication analysis
- content analysis
- coaching advice

---

# Approach 3 — Adaptive Interview Learning Coach

## Main idea

Focus on long-term candidate improvement.

Every session contributes to the candidate's performance profile.

```text
Session 1
   |
   v
Evaluation
   |
   v
Weakness Detection
   |
   v
Session 2 Question Selection
   |
   v
Evaluation
   |
   v
Updated Improvement Plan
```

## Main innovation

The next interview is influenced by previous performance.

Example:

```text
Recurring weakness:
Missing measurable results

        ↓

Targeted practice

        ↓

Behavioral questions
requiring measurable outcomes

        ↓

Re-evaluation
```

## Best demonstration

Run three sessions and show the candidate's performance history and changing practice plan.

---

# 44. Team Responsibility Option

If this is a team project rather than three separate submissions, divide ownership like this:

## Person 1

### Core AI / LangGraph

Own:

- graph
- agents
- prompts
- schemas
- routing
- agent handoffs

## Person 2

### Voice / Communication

Own:

- recording
- Whisper
- transcript
- audio metrics
- communication evaluation

## Person 3

### Application / Analytics

Own:

- React frontend
- PostgreSQL
- session history
- progress charts
- recurring gaps
- improvement plans

All three integrate into the same backend contract.

---

# 45. Evaluation Strategy

The project itself must be evaluated.

Do not only demonstrate that the application runs.

Create a test dataset.

Example:

```text
evaluation/
├── questions.json
├── sample_responses.json
├── expected_issues.json
└── evaluation_results.json
```

Each sample should contain:

```json
{
  "question": "...",
  "response": "...",
  "expected_competencies": [
    "Problem Solving"
  ],
  "expected_issues": [
    "Missing measurable result"
  ]
}
```

---

# 46. Evaluation Metrics

## Question relevance

Does the selected question match:

- role?
- competency?
- difficulty?
- candidate profile?

## Response-analysis quality

Does the system correctly identify:

- relevant content?
- missing content?
- communication issues?
- STAR gaps?

## Feedback consistency

Does the system produce reasonably consistent analysis for repeated evaluation?

## Evidence quality

Does every major weakness have supporting evidence?

## Suggestion usefulness

Does the suggestion directly address the identified issue?

---

# 47. Human Evaluation

For a stronger academic demonstration, create a small human-reviewed benchmark.

Example:

```text
20 interview questions
20 candidate responses

Human reviewer evaluates:
- relevance
- communication
- structure
- completeness

AI evaluates the same responses.

Compare:
AI evaluation
vs
Human reference
```

Do not claim that human and AI scores are identical. Report differences and limitations.

---

# 48. Testing Strategy

## Unit tests

Test:

- Pydantic schemas
- score calculations
- database functions
- question filtering
- recurring-gap detection

## Agent tests

Test each agent independently.

```text
test_question_agent
test_communication_agent
test_content_agent
test_star_agent
test_coach_agent
```

## Graph tests

Test:

- normal workflow
- voice workflow
- non-behavioral question
- behavioral question
- deeper-analysis branch
- failed agent
- invalid LLM output

## API tests

Use pytest + FastAPI TestClient.

---

# 49. Failure Handling

LLM systems fail in unpredictable ways.

Implement:

- structured output validation
- retries
- fallback responses
- timeout handling
- logging
- error states
- model/provider abstraction

Example:

```text
LLM response
    |
    v
Pydantic validation
    |
    +-- valid --> continue
    |
    +-- invalid --> retry
                    |
                    +-- valid --> continue
                    |
                    +-- invalid --> fallback/error
```

---

# 50. Security

The application handles candidate information.

Implement:

- input validation
- file type validation
- upload size limits
- API authentication if required
- environment variables for secrets
- no API keys in Git
- sanitized logs
- database parameterization
- restricted CORS
- safe audio handling

Never store API keys inside:

```text
README.md
.env.example
source code
Git history
```

`.env.example` should contain placeholders only.

---

# 51. Privacy

Candidate responses may contain personal or professional information.

The application should clearly define:

- what is stored
- how long it is stored
- whether audio is retained
- whether transcripts are retained
- how users can delete sessions

If using external LLM APIs, document that response data may be sent to the selected provider according to that provider's terms and configuration.

---

# 52. Docker Architecture

Recommended:

```text
docker-compose.yml

services:

  frontend:
    React

  backend:
    FastAPI + LangGraph

  postgres:
    PostgreSQL

  vector-db:
    optional Chroma service
```

For the first version, avoid unnecessary services.

A simpler setup:

```text
frontend
backend
postgres
```

Use pgvector if vector retrieval is required.

---

# 53. Environment Configuration

Example:

```env
APP_ENV=development

DATABASE_URL=postgresql://user:password@postgres:5432/interviewcoach

LLM_PROVIDER=...
LLM_MODEL=...

OPENAI_API_KEY=
GOOGLE_API_KEY=
ANTHROPIC_API_KEY=

WHISPER_PROVIDER=...

VECTOR_STORE=pgvector
```

Only configure the provider actually being used.

---

# 54. Recommended Project Milestones

## Milestone 1 — Foundation

- repository
- backend
- frontend
- database
- Docker
- basic candidate profile

## Milestone 2 — Question System

- dataset
- normalization
- question retrieval
- role/competency filtering
- Question Agent

## Milestone 3 — Basic Evaluation

- response submission
- Content Agent
- Communication Agent
- structured feedback

## Milestone 4 — Multi-Agent Workflow

- STAR Agent
- Coach Agent
- LangGraph state
- conditional routing
- agent handoff

## Milestone 5 — Voice

- audio upload
- transcription
- communication metrics
- voice UI

## Milestone 6 — Personalization

- session history
- recurring gaps
- adaptive questions
- improvement plan

## Milestone 7 — Evaluation

- benchmark dataset
- human reference
- automated tests
- consistency tests

## Milestone 8 — Finalization

- UI polish
- documentation
- architecture diagram
- Docker setup
- demo script
- presentation

---

# 55. Suggested Development Order

The safest implementation order is:

```text
1. Database
       ↓
2. Candidate Profile
       ↓
3. Question Dataset
       ↓
4. Question Agent
       ↓
5. Response API
       ↓
6. Communication Agent
       ↓
7. Content Agent
       ↓
8. STAR Agent
       ↓
9. LangGraph Orchestrator
       ↓
10. Coach Agent
       ↓
11. Follow-up Questions
       ↓
12. Session History
       ↓
13. Recurring Gaps
       ↓
14. Improvement Plan
       ↓
15. Voice
       ↓
16. Frontend Polish
       ↓
17. Evaluation
       ↓
18. Documentation
```

---

# 55A. MVP Must Support All Three Modes

The minimum viable product is not complete until all three entry points work.

```text
                    Interview Mode
                         |
       +-----------------+-----------------+
       |                 |                 |
       v                 v                 v
 Role Practice      Resume + JD         HR Round
       |                 |                 |
       v                 v                 v
 Question Bank       Resume/JD         HR Bank
       |              Analysis             |
       |                 |                 |
       +-----------------+-----------------+
                         |
                         v
                    LangGraph
                         |
                         v
                 Multi-Agent Analysis
                         |
                         v
                     Coaching
```

Minimum functionality per mode:

### Role Practice

- [ ] role selection
- [ ] tagged question retrieval
- [ ] response evaluation
- [ ] follow-up

### Resume + JD

- [ ] PDF/TXT upload
- [ ] resume parsing
- [ ] JD input
- [ ] JD parsing
- [ ] gap analysis
- [ ] tailored technical questions
- [ ] tailored behavioral questions
- [ ] response evaluation

### HR Round

- [ ] HR question bank
- [ ] behavioral practice
- [ ] communication evaluation
- [ ] STAR evaluation
- [ ] coaching feedback


# 56. MVP Definition

The first complete working version should be able to do exactly this:

```text
Candidate
   |
   v
Select Software Engineer
   |
   v
Receive question
   |
   v
Type answer
   |
   v
LangGraph
   |
   +-- Communication Agent
   +-- Content Agent
   +-- STAR Agent
   |
   v
Coach Agent
   |
   v
Structured Feedback
   |
   +-- Strengths
   +-- Weaknesses
   +-- Evidence
   +-- Improvement
   +-- Follow-up Question
```

Once this works reliably, add voice and longitudinal personalization.

---

# 57. Final Demo Scenario

Use a realistic behavioral question:

> Tell me about a challenging project you worked on.

Candidate gives an imperfect answer.

The system should demonstrate:

### Step 1

Question Agent selects the question based on:

```text
Role:
Software Engineer

Competency:
Problem Solving

Type:
Behavioral
```

### Step 2

Candidate gives a voice response.

### Step 3

Whisper generates transcript.

### Step 4

LangGraph launches:

```text
Communication Agent
Content Agent
STAR Agent
```

### Step 5

Agents identify:

```text
Communication:
Good clarity, but answer is slightly repetitive.

Content:
Relevant project, but personal contribution is unclear.

STAR:
Situation = good
Task = partial
Action = good
Result = missing
```

### Step 6

Coach Agent generates:

```text
Strengths:
- Clear project context
- Relevant technical details

Improve:
- Clearly identify your responsibility
- Add a measurable result
- Reduce repeated explanations

Follow-up:
"What specific action did you personally take, and what measurable
impact did it have?"
```

### Step 7

The session is stored.

### Step 8

After multiple sessions:

```text
Recurring weakness:
Missing measurable outcomes

Recommended practice:
Behavioral questions emphasizing measurable results.
```

This demonstrates almost every major requirement in the specification.

---

# 58. Architecture Diagram Deliverable

Produce:

```text
docs/
├── architecture.png
├── architecture.pdf
└── architecture.md
```

The diagram should clearly show:

```text
Candidate
    ↓
Profile / Role
    ↓
Question Agent
    ↓
Question
    ↓
Text / Voice Response
    ↓
Speech-to-Text
    ↓
LangGraph
    ↓
┌────────────┬────────────┬────────────┐
│Communication│  Content   │    STAR    │
└────────────┴────────────┴────────────┘
             ↓
       Coach Agent
             ↓
       Feedback
             ↓
 ┌───────────┼────────────┐
 ↓           ↓            ↓
Follow-up  Progress   Improvement
Question   Tracking      Plan
```

---

# 59. Documentation Deliverables

Required:

```text
README.md
PLAN.md
docs/
├── architecture.md
├── architecture.pdf
├── design.md
├── agents.md
├── evaluation.md
├── api.md
├── database.md
├── deployment.md
└── demo-script.md
```

README must explain:

- project purpose
- architecture
- prerequisites
- installation
- environment variables
- database setup
- dataset setup
- running backend
- running frontend
- Docker setup
- sample interview
- API examples
- troubleshooting

---

# 60. Presentation Plan — 10 Minutes

## 0:00–1:00 — Problem

Explain:

- traditional interview preparation
- lack of personalized evaluation
- communication gaps
- need for adaptive coaching

## 1:00–2:30 — Architecture

Explain:

- FastAPI
- LangGraph
- specialist agents
- PostgreSQL
- frontend

## 2:30–4:00 — Multi-Agent Design

Explain:

- Question Agent
- Communication Agent
- Content Agent
- STAR Agent
- Coach Agent
- handoff and conditional routing

## 4:00–7:30 — Live Demo

Show:

1. candidate profile
2. question
3. response
4. analysis
5. feedback
6. follow-up
7. progress

## 7:30–8:00 — Evaluation

Show:

- evaluation rubric
- benchmark
- consistency testing

## 8:00–10:00 — Q&A

Be prepared to explain:

- why LangGraph?
- why multiple agents?
- how feedback is evaluated?
- how hallucinations are controlled?
- why PostgreSQL?
- why voice?
- how personalization works?

---

# 61. Q&A Preparation

## Why LangGraph?

Because the workflow is stateful and contains multiple specialized processing stages with conditional routing and agent handoffs.

## Why not one LLM prompt?

A single prompt can evaluate responses, but separating communication, content, and STAR analysis provides modular responsibilities and makes individual components easier to test.

## How do you prevent hallucinated feedback?

Use:

- structured outputs
- evidence requirements
- response-grounded prompts
- validation
- optional reference retrieval
- human evaluation benchmark

## How is personalization implemented?

Through:

```text
Candidate Profile
+
Session History
+
Previous Evaluation
+
Recurring Gaps
+
Target Role
```

## How does the system improve over time?

Previous performance influences question selection, follow-up questions, and improvement plans.

---

# 62. Trade-Offs

## Multi-agent vs single-agent

### Multi-agent

Pros:

- specialization
- modularity
- easier testing
- explicit responsibilities

Cons:

- more LLM calls
- higher latency
- higher cost
- orchestration complexity

### Single agent

Pros:

- simpler
- cheaper
- lower latency

Cons:

- less modular
- harder to debug
- harder to isolate evaluation responsibilities

The project chooses multi-agent architecture because the assignment explicitly requires specialist agents.

---

# 63. RAG Trade-Off

RAG is useful when the system needs external reference material.

However, it adds:

- embeddings
- vector storage
- retrieval logic
- additional infrastructure

Therefore:

### MVP

Use PostgreSQL + structured question metadata.

### Extended version

Add pgvector/ChromaDB for retrieval.

---

# 64. Voice Trade-Off

Voice makes the demonstration more impressive and addresses the communication-coaching aspect strongly.

However, it introduces:

- transcription latency
- audio processing
- browser permissions
- larger testing surface

Therefore voice should be added after the text workflow is stable.

---

# 65. Cost Control

Use smaller/cheaper models for:

- question classification
- simple extraction
- recurring-gap classification

Use stronger models for:

- difficult content evaluation
- final coaching synthesis
- complex technical questions

Cache:

- question metadata
- embeddings
- static competency definitions

Avoid sending unnecessary context to every agent.

---

# 66. Observability

Log:

```text
session_id
agent_name
execution_time
model
token_usage if available
validation_result
routing decision
error
```

Example:

```text
[session_123]
QuestionAgent       1.2s
CommunicationAgent  1.8s
ContentAgent        2.1s
STARAgent           1.7s
CoachAgent          2.4s
Total               9.2s
```

Never log sensitive candidate information unnecessarily.

---

# 67. Recommended Repository Layout

```text
ai-interview-coach/
│
├── frontend/
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── graph/
│   │   ├── api/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── llm/
│   │   └── main.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── evaluation/
│
├── docs/
│
├── scripts/
│   ├── ingest_questions.py
│   ├── seed_database.py
│   └── evaluate_agents.py
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── PLAN.md
```

---

# 68. Definition of Done

The project is complete when:

## Task 1

- [ ] Question dataset integrated
- [ ] Role metadata available
- [ ] Competencies defined
- [ ] Difficulty available
- [ ] Question types available
- [ ] Candidate profile implemented
- [ ] Evaluation rubric defined

## Task 2

- [ ] Question selection
- [ ] Text response
- [ ] Voice response
- [ ] Transcription
- [ ] Response evaluation
- [ ] Strengths
- [ ] Weaknesses
- [ ] Evidence
- [ ] Improvement suggestions

## Task 3

- [ ] Question Agent
- [ ] Communication Agent
- [ ] Content Agent
- [ ] STAR Agent
- [ ] Coach Agent
- [ ] LangGraph workflow
- [ ] Agent handoff
- [ ] Follow-up questions
- [ ] Recurring gap detection
- [ ] Improvement plan

## Task 4

- [ ] Evaluation benchmark
- [ ] Feedback consistency testing
- [ ] Frontend
- [ ] Session history
- [ ] Progress tracking
- [ ] Analytics

## Task 5

- [ ] Architecture diagram
- [ ] Design document
- [ ] README
- [ ] Docker setup
- [ ] Sample usage
- [ ] Demo
- [ ] Presentation

---

# 68A. Three Demo Scenarios

The final presentation should demonstrate at least one mode in depth and briefly show the other two.

## Demo A — Role Practice

1. Select `SDE`.
2. Select medium difficulty.
3. Receive a tagged technical question.
4. Answer by voice.
5. Show transcription.
6. Show Communication + Content + STAR evaluation.
7. Show coaching feedback.
8. Ask a personalized follow-up.

## Demo B — Resume + JD

1. Upload a sample resume.
2. Paste a sample backend/SDE job description.
3. Show extracted skills.
4. Show JD requirements.
5. Show the resume-JD gap analysis.
6. Start tailored interview.
7. Show a technical question grounded in the resume.
8. Show a behavioral question probing a JD requirement.
9. Submit response.
10. Show grounded feedback.

## Demo C — HR Round

1. Select HR Round.
2. Choose conflict/feedback topic.
3. Receive a behavioral question.
4. Answer using voice or text.
5. Show communication and STAR analysis.
6. Show coaching feedback.
7. Show next HR follow-up.


# 69. Final Target Architecture

The final system should conceptually look like:

```text
                           ┌───────────────┐
                           │   Candidate   │
                           └───────┬───────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │ React Application│
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     FastAPI      │
                         └────────┬─────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │       LangGraph          │
                    │    Interview Workflow   │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        Question Agent   Communication Agent  Content Agent
              │                  │                  │
              │                  └────────┬─────────┘
              │                           │
              │                           ▼
              │                      STAR Agent
              │                           │
              └───────────────────────────┤
                                          ▼
                                  ┌───────────────┐
                                  │  Coach Agent  │
                                  └───────┬───────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
              Feedback              Follow-up             Improvement
                                      Question                Plan
                    │                     │                     │
                    └─────────────────────┼─────────────────────┘
                                          ▼
                                  ┌───────────────┐
                                  │  PostgreSQL   │
                                  └───────────────┘
```

---

# 70. Final Project Vision

The finished application should not look like:

```text
Question → LLM → Answer
```

It should look like:

```text
Candidate
   ↓
Profile
   ↓
Adaptive Question Selection
   ↓
Text / Voice Response
   ↓
Speech Processing
   ↓
LangGraph
   ↓
Specialist Evaluation
   ↓
Evidence-Based Analysis
   ↓
Coach Synthesis
   ↓
Personalized Feedback
   ↓
Follow-up Question
   ↓
Session History
   ↓
Recurring Gap Detection
   ↓
Adaptive Improvement Plan
   ↓
Next Interview
```

That architecture directly maps to the supplied requirements while providing enough technical depth for the multi-agent, application, evaluation, and demonstration components.

---

# 71. Immediate Build Plan

Start implementation in this order:

### Phase 1

Create repository and infrastructure.

```text
frontend/
backend/
data/
docs/
scripts/
```

### Phase 2

Implement PostgreSQL models and candidate profile.

### Phase 3

Import and normalize the interview dataset.

### Phase 4

Implement Question Agent.

### Phase 5

Implement Communication Agent.

### Phase 6

Implement Content Agent.

### Phase 7

Implement STAR Agent.

### Phase 8

Implement Coach Agent.

### Phase 9

Connect all agents using LangGraph.

### Phase 10

Implement text interview end-to-end.

### Phase 11

Add follow-up questions.

### Phase 12

Add session persistence and recurring gaps.

### Phase 13

Add personalized improvement plans.

### Phase 14

Add voice/transcription.

### Phase 15

Build frontend dashboard.

### Phase 16

Build evaluation benchmark.

### Phase 17

Dockerize.

### Phase 18

Write documentation.

### Phase 19

Create architecture PDF.

### Phase 20

Prepare the 10-minute presentation and live demo.

---

# 72. Success Criteria

The project should ultimately demonstrate one complete cycle:

> **Candidate → Question → Response → Multi-Agent Analysis → Evidence → Coaching → Follow-up → Progress Tracking → Personalized Improvement**

If this cycle works reliably, the project has a strong foundation for all five assignment tasks.

The advanced features—voice analysis, RAG, adaptive difficulty, richer analytics, and model routing—should be layered on top rather than implemented before the core workflow is stable.
