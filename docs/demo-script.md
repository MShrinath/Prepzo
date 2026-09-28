# 10-Minute Demonstration & Presentation Script

This script provides an exact roadmap for delivering the 10-minute project presentation and live demo, satisfying Tasks 1–5 of the project specification.

---

## Presentation Timeline (10:00 Total)

| Timestamp | Phase | Topic Covered |
|---|---|---|
| **0:00 – 1:00** | Problem Statement | Why static mock interviews fail; need for communication & STAR coaching |
| **1:00 – 2:30** | System Architecture | FastAPI, LangGraph state machine, PostgreSQL persistence, Whisper voice pipeline |
| **2:30 – 4:00** | Multi-Agent Design | Question, Communication, Content, STAR, and Coach Agents with conditional handoffs |
| **4:00 – 7:30** | **Live Demonstration** | Demos A, B, and C covering all 3 modes and interactive feedback |
| **7:30 – 8:30** | Evaluation & Benchmark | Rubric weights, automated benchmark results (100% pass, 0.0 variance) |
| **8:30 – 10:00** | Conclusion & Q&A | Answering architectural trade-offs, hallucination controls, and roadmap |

---

## Live Demonstration Walkthrough

### Demo A — Mode 1: Role Practice (SDE Technical Round)
1. Navigate to the landing page at `http://localhost:5173`.
2. Select **Role Practice**. Choose `SDE`, `Medium Difficulty`, and `Problem Solving`.
3. Click **Launch Role Practice Session**.
4. Show the retrieved question:
   > *"How would you optimize a Python API endpoint that is experiencing high latency under heavy traffic?"*
5. Toggle **Voice Response** (or Text Response).
6. Submit an answer with technical specifics (profiling, Redis, database indexing).
7. Watch the live LangGraph progression bar (Communication → Content → STAR → Coach).
8. Inspect the resulting report:
   - Overall score (e.g. 85/100).
   - Communication clarity metrics and filler word count.
   - STAR applicability (annotated as technical rather than behavioral).
   - Grounded follow-up question.
9. Answer the follow-up question directly in the UI to demonstrate adaptive re-evaluation.

---

### Demo B — Mode 2: Resume + Job Description (Tailored Grounded Mock)
1. Select **Resume + Job Description** on the home screen.
2. Highlight candidate Alex Taylor's resume (Python, FastAPI, Docker, PostgreSQL).
3. Paste a job description emphasizing **AWS, Kubernetes, and Microservices**.
4. Click **Analyze Gaps & Start Tailored Mock**.
5. Show the live **Gap Analysis**:
   - Matched skills: `Python`, `FastAPI`, `PostgreSQL`.
   - Missing skills requiring probing: `AWS`, `Kubernetes`.
6. Show how the Question Agent generated:
   - A technical question grounded strictly in the resume's FastAPI claims.
   - A behavioral question probing how the candidate approaches unlearned tech like Kubernetes.
7. Emphasize the **grounding rule**: no facts were hallucinated about the candidate.

---

### Demo C — Mode 3: HR Round (Behavioral & Conflict Practice)
1. Select **HR Round**.
2. Select topics: `Conflict Resolution` and `Receiving Feedback`.
3. Receive the behavioral question:
   > *"Tell me about a time you had a strong disagreement with a teammate or lead regarding a project direction..."*
4. Submit a behavioral response.
5. Highlight the **STAR Agent's breakdown**:
   - Situation: 9/10
   - Task: 8/10
   - Action: 8/10
   - Result: 9/10
6. Show the **Improved Answer Restructuring** recommended by the Coach Agent.

---

### Longitudinal Progress Dashboard
1. Click **Progress & Plan** in the top navigation bar.
2. Show the **Score Progression Line Chart** (Recharts) tracking trends over time.
3. Show the **Detected Recurring Weaknesses** card (e.g., flagging "Missing Measurable Outcomes" when appearing $\ge 2$ times).
4. Review the personalized **7-Day Improvement Plan** automatically tailored to the candidate's historical gaps.

---

## Common Q&A Defense

**Q: Why use LangGraph instead of a single prompt?**  
*A: A single prompt conflates distinct concerns. By separating Communication, Content, and STAR analysis, each agent operates with isolated rubrics, structured schemas, and independent unit tests. Furthermore, LangGraph enables conditional handoffs (e.g., deeper diagnostics when clarity is under 6).*

**Q: How do you prevent hallucinations in interview questions?**  
*A: Mode 2 uses deterministic parsing of the resume text to extract verified skills and projects. Questions only cite explicit candidate claims, and absent JD skills are strictly marked as probing topics.*

**Q: Does voice analysis claim to detect personality?**  
*A: No. We intentionally reject pseudo-scientific psychological trait inference. Voice analysis evaluates only objective physical metrics: speaking rate (WPM), pause durations, and filler word frequency.*
