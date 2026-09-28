# Database Schema & Entity Relationships

## 1. Overview

The platform uses SQLAlchemy ORM to manage relational persistence. It supports:
- **SQLite:** Out-of-the-box local development and automated testing without external daemon dependencies.
- **PostgreSQL:** Production-grade deployments with Docker Compose or standalone database servers.

---

## 2. Table Definitions

```
                     candidate_profiles
                       ├── candidate_skills (1:N)
                       ├── candidate_projects (1:N)
                       ├── interview_sessions (1:N)
                       │     └── candidate_responses (1:N)
                       │           ├── communication_evaluations (1:1)
                       │           ├── content_evaluations (1:1)
                       │           ├── star_evaluations (1:1)
                       │           ├── coaching_feedback (1:1)
                       │           └── follow_up_questions (1:N)
                       ├── recurring_gaps (1:N)
                       └── improvement_plans (1:N)
```

### `candidate_profiles`
- `candidate_id` (PK, unique string, indexed): Primary identifier (e.g., `candidate_001`).
- `name`: Full name.
- `email`: Contact email.
- `target_role`: Default interview role.
- `experience_years`: Years in industry.
- `education`: Degree and institution.
- `bio`: Professional summary.
- `target_competencies`: JSON array of focus areas.

### `interview_questions`
- `question_id` (PK, unique string, indexed): Identifier (e.g., `sde_perf_001`).
- `question`: Prompt text.
- `mode`: JSON array of supported modes (`role_practice`, `resume_jd`, `hr`).
- `role`: Target professional role.
- `competency`: Evaluated core competency.
- `difficulty`: `easy`, `medium`, or `hard`.
- `question_type`: `technical`, `behavioral`, or `situational`.
- `category`: Functional topic.
- `tags`: JSON array of tech keywords.
- `expected_competencies`: Target competencies.
- `evaluation_criteria`: Rubric criteria list.
- `follow_up_template`: Pre-calibrated follow-up probe.

### `interview_sessions`
- `session_id` (PK, unique string, indexed): UUID-based session token.
- `candidate_id`: Foreign key referencing `candidate_profiles`.
- `mode`: Active mode (`role_practice`, `resume_jd`, `hr`).
- `target_role`: Active role during session.
- `difficulty`: Configured difficulty.
- `resume_text` / `jd_text`: Uploaded document texts.
- `gap_analysis`: JSON payload of matched/missing skills.
- `status`: `active` or `completed`.

### `candidate_responses`
- `session_id`: Foreign key referencing `interview_sessions`.
- `response_type`: `text` or `voice`.
- `response_text`: Candidate's written answer or STT transcript.
- `duration_seconds`: Spoken response duration.
- `speaking_rate`: Calculated words per minute.
- `filler_words_count`: Frequency of filler patterns.

### `coaching_feedback`
- `overall_score`: Consolidated 0-100 score.
- `strengths`: JSON array of top strengths.
- `improvement_areas`: JSON array of prioritized gaps.
- `evidence_items`: JSON array of structured issues with concrete response excerpts and recommendations.
- `actionable_advice`: Actionable guidance steps.
- `improved_answer_structure`: Optimal example format.
- `follow_up_question`: Personalized follow-up question.

### `recurring_gaps`
- `candidate_id`: Foreign key referencing `candidate_profiles`.
- `gap_category`: Title of recurring deficiency (e.g. "Missing Measurable Outcomes").
- `occurrence_count`: Number of sessions where gap was observed.
- `status`: `active`, `improving`, or `resolved`.
