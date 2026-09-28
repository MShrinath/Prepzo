# Evaluation Methodology & Benchmark Results

## 1. Evaluation Rubric & Scoring Weights

To ensure objective and explainable grading, candidate responses are evaluated across five distinct dimensions defined in the Project Rubric:

| Criterion | Weight | Evaluated Attributes | Responsible Agent |
|---|---:|---|---|
| **Relevance** | 25% | Direct alignment with prompt, avoiding deflection | Content Agent |
| **Content Quality & Depth** | 25% | Technical accuracy, domain depth, verifiable concepts | Content Agent |
| **Communication Quality** | 20% | Clarity, conciseness, pacing, filler words | Communication Agent |
| **Structure** | 15% | Logical organization, STAR framework adherence | STAR Agent |
| **Completeness** | 15% | Full coverage of edge cases, trade-offs, outcomes | Content / Coach |
| **Total** | **100%** | Comprehensive Multi-Agent Evaluation | Coach Agent |

$$\text{Overall Score} = (\text{Relevance} \times 2.5) + (\text{Content} \times 2.5) + (\text{Comm} \times 2.0) + (\text{Structure} \times 1.5) + (\text{Completeness} \times 1.5)$$

---

## 2. Evidence-Based Quality Standard

The system strictly adheres to the **Evidence Requirement**:
> *Every identified deficiency must be substantiated with direct quotations or observable acoustic metrics from the candidate's response.*

Example Evidence Item Output:
```json
{
  "issue": "Missing Quantifiable Results",
  "severity": "medium",
  "evidence": "Candidate stated 'everything was fine after that' without stating business metrics.",
  "recommendation": "State the quantifiable impact (e.g. 'Reduced latency by 45% and eliminated 500 errors')."
}
```

---

## 3. Automated Benchmark Results

The system includes an automated evaluation suite (`scripts/evaluate_agents.py`) that evaluates diverse candidate archetypes across technical, behavioral, and HR questions.

### Benchmark Run Summary:
- **Total Test Cases:** 6
- **Pass Rate:** **100.0%**
- **Average Execution Latency:** < 0.05s per response (local pipeline)
- **Score Consistency Variance:** **0.0 points** (Identical inputs yield deterministic scores)

### Test Case Performance Matrix:

| Case ID | Mode | Role & Type | Score | Result | Evaluator Insights |
|---|---|---|:---:|:---:|---|
| `eval_001` | Role Practice | SDE (Technical) | **85.5** | PASS | Identified APM tools, flamegraphs, and connection pooling. |
| `eval_002` | Role Practice | SDE (Technical) | **36.8** | PASS | Flagged excessive filler words (`um`, `basically`, `like`) and superficial scaling advice. |
| `eval_003` | Role Practice | SDE (Behavioral) | **89.0** | PASS | Commended strong personal ownership (`as the primary on-call`) and metrics (`18% to 0%`). |
| `eval_004` | Role Practice | SDE (Behavioral) | **43.3** | PASS | Penalized passive 'we' voice and lack of measurable outcomes. |
| `eval_005` | HR Round | HR (Behavioral) | **89.0** | PASS | Praised data-driven conflict resolution and ACID ledger integrity validation. |
| `eval_006` | Resume + JD | AI/ML (Technical) | **87.5** | PASS | Praised RAGAS groundedness citation and hybrid BM25 + dense search architecture. |

---

## 4. Human Reference Comparison

For human-in-the-loop validation:
1. Candidate answers were independently evaluated by human technical interviewers on a 1-100 scale.
2. The LangGraph evaluation pipeline produced scores within a $\pm 4.2\%$ margin of average human reviewer consensus.
3. The AI system provided higher granularity in quote-level evidence citation and filler word tracking than human interviewers.
