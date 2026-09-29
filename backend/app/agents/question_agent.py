import random
import uuid
import json
import logging
from typing import Dict, Any, List, Optional
from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import QuestionAgentOutput
from app.services.resume_parser import ResumeJDService

logger = logging.getLogger(__name__)


class QuestionAgent:
    def __init__(self, db_session=None):
        self.db = db_session
        self.llm = get_llm(temperature=0.6)

    def _format_previous_questions(self, previous_questions: List[str]) -> str:
        if not previous_questions:
            return "None (this is the first question of the interview)."
        return "\n".join([f"{i+1}. {q}" for i, q in enumerate(previous_questions)])

    def determine_interview_plan(
        self,
        mode: str,
        target_role: str,
        candidate_profile: Optional[Dict[str, Any]] = None,
        resume_text: Optional[str] = None,
        jd_text: Optional[str] = None,
        gap_analysis: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Dynamically determine the optimal number of questions and initial difficulty
        using LLM reasoning based on role complexity, candidate background, and skill gaps.
        Zero user intervention required.
        """
        exp_years = (candidate_profile or {}).get("experience_years", 2)
        gap_count = len((gap_analysis or {}).get("missing_skills", []))

        prompt = f"""You are a Principal Technical Interview Architect.
Determine the optimal interview session structure for:
- Role: {target_role}
- Mode: {mode}
- Candidate Experience: {exp_years} years
- Detected Skill Gaps: {gap_count}

TASK:
Decide:
1. "question_count": Total number of questions for this session (an integer between 3 and 6). Senior or high-gap roles require 5-6 questions; focused or standard rounds require 3-4 questions.
2. "initial_difficulty": "easy", "medium", or "hard" based on candidate experience and role seniority.
3. "plan_reasoning": A brief 1-sentence rationale for this interview length and difficulty curve.

Respond strictly in JSON format:
{{"question_count": <int 3-6>, "initial_difficulty": "<easy|medium|hard>", "plan_reasoning": "<string>"}}
"""
        default_count = 5 if exp_years >= 4 or gap_count >= 3 else 4
        default_diff = "hard" if exp_years >= 5 else ("medium" if exp_years >= 2 else "easy")
        fallback = {
            "question_count": default_count,
            "initial_difficulty": default_diff,
            "plan_reasoning": f"Adaptive plan: {default_count} questions at {default_diff} difficulty based on {exp_years} yrs experience."
        }
        try:
            from app.llm.provider import parse_json_from_llm
            response = self.llm.invoke(prompt)
            parsed = parse_json_from_llm(response.content if hasattr(response, 'content') else str(response))
            q_cnt = parsed.get("question_count", default_count)
            if not isinstance(q_cnt, int) or q_cnt < 3 or q_cnt > 7:
                q_cnt = default_count
            init_diff = str(parsed.get("initial_difficulty", default_diff)).lower()
            if init_diff not in ["easy", "medium", "hard"]:
                init_diff = default_diff
            return {
                "question_count": q_cnt,
                "initial_difficulty": init_diff,
                "plan_reasoning": parsed.get("plan_reasoning", fallback["plan_reasoning"]),
            }
        except Exception as e:
            logger.debug(f"LLM interview plan determination fallback: {e}")
            return fallback

    @staticmethod
    def _enforce_concise_question(question_text: str) -> str:
        """
        Enforce that the question is punchy and strictly between 1 to 2 lines (approx 15 to 35 words).
        Strips unnecessary preambles like 'Sure! Here is a question:' or 'In today's fast-paced environment...'
        """
        import re
        q = question_text.strip().replace('\r\n', '\n')
        q = re.sub(r'^(Sure,?|Here is (a|the) question:?|Question:?|As an interviewer:?|Hello!|Welcome!)\s*', '', q, flags=re.IGNORECASE)
        lines = [line.strip() for line in q.split('\n') if line.strip()]
        if len(lines) > 2:
            q = ' '.join(lines[:2])
        else:
            q = ' '.join(lines)
        return q.strip()

    def select_or_generate_question(
        self,
        mode: str,
        target_role: str,
        difficulty: Optional[str] = None,
        competency: Optional[str] = None,
        topics: Optional[List[str]] = None,
        candidate_profile: Optional[Dict[str, Any]] = None,
        resume_text: Optional[str] = None,
        jd_text: Optional[str] = None,
        previous_questions: Optional[List[str]] = None,
    ) -> QuestionAgentOutput:
        previous_questions = previous_questions or []

        # -------------------------------------------------------------
        # Mode 1: Role Practice
        # -------------------------------------------------------------
        if mode == "role_practice":
            return self._handle_role_practice(
                target_role=target_role,
                difficulty=difficulty,
                competency=competency,
                candidate_profile=candidate_profile,
                previous_questions=previous_questions,
            )

        # -------------------------------------------------------------
        # Mode 2: Resume + Job Description
        # -------------------------------------------------------------
        elif mode == "resume_jd":
            return self._handle_resume_jd(
                target_role=target_role,
                difficulty=difficulty,
                competency=competency,
                resume_text=resume_text,
                jd_text=jd_text,
                candidate_profile=candidate_profile,
                previous_questions=previous_questions,
            )

        # -------------------------------------------------------------
        # Mode 3: HR Round
        # -------------------------------------------------------------
        elif mode == "hr":
            return self._handle_hr_round(
                difficulty=difficulty,
                topics=topics,
                previous_questions=previous_questions,
            )

        # -------------------------------------------------------------
        # Mode 4: Company Archetype (Amazon LP, Google Scale, McKinsey Case)
        # -------------------------------------------------------------
        elif mode == "company_archetype":
            return self._handle_company_archetype(
                target_role=target_role,
                difficulty=difficulty,
                topics=topics,
                previous_questions=previous_questions,
            )

        # Default fallback
        return self._handle_role_practice(
            target_role=target_role or "SDE",
            difficulty=difficulty,
            competency=competency,
            candidate_profile=candidate_profile,
            previous_questions=previous_questions,
        )

    def _handle_role_practice(
        self,
        target_role: str,
        difficulty: Optional[str],
        competency: Optional[str],
        candidate_profile: Optional[Dict[str, Any]],
        previous_questions: List[str],
    ) -> QuestionAgentOutput:
        from app.models.entities import InterviewQuestion

        # Always generate dynamic, varied questions directly with LLM to prevent repetition
        formatted_prev = self._format_previous_questions(previous_questions)
        profile_snippet = ""
        exp_years = 2
        if candidate_profile:
            exp_years = candidate_profile.get("experience_years", 2)
            skills = ", ".join([s.get("skill_name", "") for s in candidate_profile.get("skills", [])])
            profile_snippet = f"\nCandidate Profile: Experience: {exp_years} yrs; Skills: {skills}; Target Role: {candidate_profile.get('target_role')}"

        turn = len(previous_questions) + 1
        prompt = f"""You are a Principal Technical Interviewer and Hiring Bar Raiser conducting an interview for the role: "{target_role}".
Target Competency: {competency or "Problem Solving & Technical Depth"}{profile_snippet}

CRITICAL DIFFICULTY CONSTRAINT:
You (the LLM) must independently decide the difficulty level ('easy', 'medium', or 'hard') for this question. Adapt to candidate experience ({exp_years} yrs) and progression (Turn {turn}). Output this in 'difficulty'.

CRITICAL CONCISENESS & LENGTH CONSTRAINT:
- The question MUST be strictly between 1 to 2 lines in length (approximately 15 to 30 words).
- NEVER include conversational preambles, introductory filler, or multi-sentence backstories.
- Ask the core technical question directly.

CRITICAL ANTI-REPETITION CONSTRAINT:
The following questions have ALREADY been asked in this session:
{formatted_prev}

TASK:
Generate a NEW, challenging, and concise 1 to 2 line interview question testing practical capability for "{target_role}".
Rules:
1. STRICT: Do NOT repeat, paraphrase, or ask anything conceptually similar to the previously asked questions listed above.
2. The question must simulate real-world technical decision making, troubleshooting, architectural trade-offs, concurrency, or performance optimization for "{target_role}".
3. Length: Strictly 1 to 2 lines (15 to 30 words max).
4. Provide a clear reason explaining what specific capability this question tests.
5. Set question_type to 'technical' for engineering roles, 'situational' for product/sales, or 'behavioral' for culture.
6. Set context_type to 'role_scenario'.
"""

        fallback_id = f"gen_role_{uuid.uuid4().hex[:8]}"
        dynamic_role_variants = [
            (
                f"How do you isolate the root cause when a {target_role} microservice experiences intermittent latency spikes in production?",
                "Problem Solving",
                "technical",
                f"Evaluating systematic incident diagnostics and observability for {target_role}."
            ),
            (
                f"When architecting high-throughput data pipelines, how do you decide between eventual consistency and strict ACID transactions?",
                "Technical Depth & Domain Mastery",
                "technical",
                f"Assessing architectural trade-offs for {target_role}."
            ),
            (
                f"How do you implement idempotency and retry backoff when communicating with unreliable third-party APIs?",
                "Ownership & Accountability",
                "technical",
                f"Testing fault-tolerant distributed integration patterns for {target_role}."
            ),
            (
                f"Describe a time you navigated a major disagreement with senior peers regarding system architecture or technology selection.",
                "Communication & Clarity",
                "situational",
                f"Testing technical consensus building for {target_role}."
            ),
        ]
        chosen_variant = dynamic_role_variants[len(previous_questions) % len(dynamic_role_variants)]
        inferred_diff = difficulty or ("hard" if exp_years >= 5 else ("medium" if exp_years >= 2 else "easy"))
        fallback_data = {
            "question_id": fallback_id,
            "question": self._enforce_concise_question(chosen_variant[0]),
            "competency": competency or chosen_variant[1],
            "difficulty": inferred_diff,
            "question_type": chosen_variant[2],
            "reason": chosen_variant[3],
            "context_type": "role_scenario",
        }

        try:
            result = parse_structured_output(self.llm, prompt, QuestionAgentOutput, fallback_data)
            if not result.question_id:
                result.question_id = fallback_id
            if not result.context_type:
                result.context_type = "role_scenario"
            result.question = self._enforce_concise_question(result.question)
            if not result.difficulty or result.difficulty.lower() not in ["easy", "medium", "hard"]:
                result.difficulty = inferred_diff

            # Save dynamically generated question to DB for indexing
            if self.db:
                try:
                    new_q = InterviewQuestion(
                        question_id=result.question_id,
                        question=result.question,
                        mode=json.dumps(["role_practice"]),
                        role=target_role,
                        competency=result.competency,
                        difficulty=result.difficulty,
                        question_type=result.question_type,
                        category="Dynamic Generation",
                        tags=json.dumps([target_role.lower(), result.difficulty, "llm-generated"]),
                        is_preset=False,
                    )
                    self.db.add(new_q)
                    self.db.commit()
                except Exception as save_err:
                    self.db.rollback()
                    logger.debug(f"Could not save dynamic question: {save_err}")

            return result
        except Exception as e:
            logger.warning(f"Dynamic role practice question generation failed ({e}). Using fallback.")
            return QuestionAgentOutput(**fallback_data)

    def _handle_resume_jd(
        self,
        target_role: str,
        difficulty: str,
        competency: Optional[str],
        resume_text: Optional[str],
        jd_text: Optional[str],
        candidate_profile: Optional[Dict[str, Any]],
        previous_questions: List[str],
    ) -> QuestionAgentOutput:
        # 1. Resolve Resume Content
        resume_content = (resume_text or "").strip()
        if not resume_content and candidate_profile:
            skills_str = ", ".join([s.get("skill_name", "") for s in candidate_profile.get("skills", [])])
            proj_str = "; ".join([p.get("name", "") + ": " + p.get("description", "") for p in candidate_profile.get("projects", [])])
            resume_content = f"Candidate: {candidate_profile.get('name')}\nTarget Role: {candidate_profile.get('target_role')}\nSkills: {skills_str}\nProjects: {proj_str}\nBio: {candidate_profile.get('bio', '')}"

        # 2. Resolve Job Description Content
        jd_content = (jd_text or "").strip()
        if not jd_content:
            jd_content = f"Target Role: {target_role}. Key responsibilities include end-to-end design, execution, cross-functional collaboration, technical mastery, and delivering production results."

        # 3. Extract parsed elements from Resume (projects, experiences, skills)
        parsed_resume = ResumeJDService.parse_resume(resume_content)
        detected_projects = list(parsed_resume.get("detected_projects", []))
        detected_experiences = list(parsed_resume.get("detected_experiences", []))

        # Include candidate profile projects if present
        if candidate_profile and candidate_profile.get("projects"):
            for p in candidate_profile["projects"]:
                p_desc = f"{p.get('name')}: {p.get('description', '')} (Tech: {', '.join(p.get('technologies', []))}; Impact: {p.get('measurable_impact', '')})"
                if p_desc not in detected_projects:
                    detected_projects.append(p_desc)

        # 4. Perform or retrieve Gap Analysis
        analysis = ResumeJDService.analyze_gap(resume_content, jd_content, target_role=target_role)

        # 5. Formulate Questioning Strategy
        formatted_prev = self._format_previous_questions(previous_questions)
        missing_skills_list = analysis.get("missing_skills", [])
        matched_sample = ", ".join(analysis.get("matched_skills", [])[:6])
        missing_sample = "\n- ".join(missing_skills_list[:8]) if missing_skills_list else "General specialized domain requirements"
        projects_sample = "\n- ".join(detected_projects[:4]) if detected_projects else "General portfolio and software systems"
        experiences_sample = "\n- ".join(detected_experiences[:3]) if detected_experiences else "Engineering and operational background"

        turn = len(previous_questions) + 1

        # Determine target question type based on turn
        if turn == 1 and detected_projects:
            strategy_instruction = f"""STRATEGY: RESUME PROJECT DEEP-DIVE
You MUST generate an in-depth technical interview question specifically targeting one of the candidate's actual projects from their resume:
{projects_sample}
Ask them to explain the architecture, the technical trade-offs made, the specific tools they used, how they resolved performance bottlenecks, or how they achieved the stated metrics.
Set 'context_type' to 'project_deep_dive', and in 'resume_reference' specify the exact project name or accomplishment referenced."""
        elif turn == 2 and detected_experiences:
            strategy_instruction = f"""STRATEGY: WORK EXPERIENCE & PRODUCTION EXECUTION
You MUST probe the candidate's past work experience and technical delivery:
{experiences_sample}
Ask them about a specific challenge, production outage, architectural redesign, or cross-functional delivery from their past experience.
Set 'context_type' to 'experience_probe', and in 'resume_reference' specify the role/experience referenced."""
        elif missing_skills_list:
            strategy_instruction = f"""STRATEGY: BRIDGING RESUME EXPERIENCE TO JD GAP
The candidate has strong experience in: {matched_sample or 'core software engineering'}
However, the JD specifically requires: {missing_skills_list[0]}
Generate a question that asks the candidate to bridge their existing experience into this JD requirement. How would they design or execute solutions involving {missing_skills_list[0]}?
Set 'context_type' to 'gap_probe', set 'target_gap' to '{missing_skills_list[0]}', and set 'resume_reference' to 'Bridging to {missing_skills_list[0]}'."""
        else:
            strategy_instruction = f"""STRATEGY: SYSTEM DESIGN & ROLE ALIGNMENT
Generate a realistic system design or architectural scenario combining the candidate's resume strengths with the core responsibilities in the JD for {target_role}.
Set 'context_type' to 'role_scenario'."""

        prompt = f"""You are a Principal Interviewer assessing a candidate for the role: "{target_role}".
Target Competency Focus: {competency or "Technical Depth, Problem Solving, and Execution"}

CRITICAL DIFFICULTY CONSTRAINT:
You (the LLM) must independently decide the difficulty level ('easy', 'medium', or 'hard') for this question based on candidate background and progression (Question {turn}). Output this in 'difficulty'.

CRITICAL CONCISENESS & LENGTH CONSTRAINT:
- The question MUST be strictly between 1 to 2 lines in length (approximately 15 to 30 words max).
- NEVER include conversational preambles, introductory filler, or verbose setups.
- Ask the direct, focused technical or architectural question immediately.

CANDIDATE RESUME SUMMARY:
\"\"\"
{resume_content[:3000]}
\"\"\"

CANDIDATE DETECTED PROJECTS:
{projects_sample}

CANDIDATE WORK EXPERIENCE:
{experiences_sample}

TARGET JOB DESCRIPTION:
\"\"\"
{jd_content[:2500]}
\"\"\"

RESUME vs JD GAP EVALUATION:
- Verified Resume Strengths: {matched_sample or "General relevant background"}
- IDENTIFIED GAPS TO PROBE:
- {missing_sample}

CRITICAL ANTI-REPETITION CONSTRAINT:
The following questions have ALREADY been asked in this session:
{formatted_prev}

PRIMARY OBJECTIVE & TASK:
{strategy_instruction}

Rules:
1. STRICT: NEVER repeat, rephrase, or overlap with any previously asked questions.
2. Directly reference details from the candidate's actual projects, technologies, and past experience wherever appropriate.
3. Length: Strictly 1 to 2 lines (15 to 30 words max).
4. In 'reason', clearly explain what aspect of the candidate's resume or JD alignment is being evaluated.
"""

        # Construct intelligent fallback
        fallback_id = f"resume_jd_{uuid.uuid4().hex[:8]}"
        fallback_diff = difficulty or "medium"
        if turn == 1 and detected_projects:
            ref_proj = detected_projects[0].split(":")[0].strip()
            fallback_data = {
                "question_id": fallback_id,
                "question": self._enforce_concise_question(f"On your project '{ref_proj[:40]}', what was the biggest architectural bottleneck you resolved and how did you measure success?"),
                "competency": "Technical Depth & Domain Mastery",
                "difficulty": fallback_diff,
                "question_type": "technical",
                "reason": f"Evaluating candidate's direct contributions and architectural reasoning on resume project: {ref_proj[:50]}.",
                "context_type": "project_deep_dive",
                "resume_reference": ref_proj[:80],
            }
        elif turn == 2 and detected_experiences:
            ref_exp = detected_experiences[0].split(":")[0].strip()
            fallback_data = {
                "question_id": fallback_id,
                "question": self._enforce_concise_question(f"During your work with {ref_exp[:40]}, describe a critical production incident you diagnosed and remediated under pressure."),
                "competency": "Problem Solving",
                "difficulty": fallback_diff,
                "question_type": "behavioral",
                "reason": f"Evaluating crisis management and production resilience based on past work experience: {ref_exp[:50]}.",
                "context_type": "experience_probe",
                "resume_reference": ref_exp[:80],
            }
        else:
            first_gap = missing_skills_list[0] if missing_skills_list else "Cloud Architecture"
            fallback_data = {
                "question_id": fallback_id,
                "question": self._enforce_concise_question(f"The target role requires {first_gap}. How would you design and deploy a scalable, fault-tolerant service using {first_gap}?"),
                "competency": "Problem Solving",
                "difficulty": fallback_diff,
                "question_type": "technical",
                "reason": f"Testing candidate's ability to bridge resume experience to critical JD gap in {first_gap}.",
                "target_gap": first_gap,
                "context_type": "gap_probe",
                "resume_reference": f"Bridging to {first_gap}",
            }

        try:
            result = parse_structured_output(self.llm, prompt, QuestionAgentOutput, fallback_data)
            if not result.question_id:
                result.question_id = fallback_id
            if not result.context_type:
                result.context_type = fallback_data.get("context_type", "project_deep_dive")
            if not result.resume_reference:
                result.resume_reference = fallback_data.get("resume_reference")
            result.question = self._enforce_concise_question(result.question)
            if not result.difficulty or result.difficulty.lower() not in ["easy", "medium", "hard"]:
                result.difficulty = fallback_diff
            return result
        except Exception as e:
            logger.warning(f"Dynamic resume-jd question generation failed ({e}). Using strategy fallback.")
            return QuestionAgentOutput(**fallback_data)

    def _handle_hr_round(
        self,
        difficulty: Optional[str],
        topics: Optional[List[str]],
        previous_questions: List[str],
    ) -> QuestionAgentOutput:
        from app.models.entities import InterviewQuestion

        if self.db:
            query = self.db.query(InterviewQuestion).filter(
                InterviewQuestion.mode.like("%hr%")
            )
            candidates = query.all()
            available = [q for q in candidates if q.question not in previous_questions]

            if available:
                selected = random.choice(available)
                concise_q = self._enforce_concise_question(selected.question)
                return QuestionAgentOutput(
                    question_id=selected.question_id,
                    question=concise_q,
                    competency=selected.competency,
                    difficulty=difficulty or selected.difficulty or "medium",
                    question_type="behavioral",
                    reason=f"Selected HR behavioral question targeting competency '{selected.competency}'.",
                )

        # LLM dynamic generation for HR round when presets run out
        formatted_prev = self._format_previous_questions(previous_questions)
        topic_str = ", ".join(topics) if topics else "Conflict Resolution, Receiving Feedback, and Teamwork"

        prompt = f"""You are an Executive HR Director conducting a behavioral interview.
Topics of Focus: {topic_str}

CRITICAL DIFFICULTY CONSTRAINT:
Independently decide the difficulty level ('easy', 'medium', or 'hard') for this question. Output this in 'difficulty'.

CRITICAL CONCISENESS & LENGTH CONSTRAINT:
- The question MUST be strictly between 1 to 2 lines in length (approximately 15 to 30 words max).
- Direct and clear behavioral prompt (e.g. 'Tell me about a time when...').
- Avoid introductory fluff.

CRITICAL ANTI-REPETITION CONSTRAINT:
The following questions have ALREADY been asked in this session:
{formatted_prev}

TASK:
Generate a NEW, concise 1 to 2 line behavioral interview question using the STAR methodology.
Rules:
1. STRICT: Do NOT repeat or paraphrase any previously asked questions.
2. Pose a realistic workplace scenario probing interpersonal dynamics, conflict, resilience, or ownership.
3. Length: Strictly 1 to 2 lines (15 to 30 words).
4. In 'reason', explain what behavioral indicator this question measures.
"""

        fallback_diff = difficulty or "medium"
        fallback_data = {
            "question_id": f"hr_dyn_{uuid.uuid4().hex[:8]}",
            "question": self._enforce_concise_question("Tell me about a time you strongly disagreed with a team decision. How did you express your perspective and resolve it?"),
            "competency": "Teamwork & Conflict Resolution",
            "difficulty": fallback_diff,
            "question_type": "behavioral",
            "reason": "Evaluating constructive disagreement and interpersonal maturity.",
        }

        try:
            result = parse_structured_output(self.llm, prompt, QuestionAgentOutput, fallback_data)
            if not result.question_id:
                result.question_id = f"hr_dyn_{uuid.uuid4().hex[:8]}"
            result.question = self._enforce_concise_question(result.question)
            if not result.difficulty or result.difficulty.lower() not in ["easy", "medium", "hard"]:
                result.difficulty = fallback_diff
            return result
        except Exception as e:
            logger.warning(f"Dynamic HR question generation failed ({e}). Using fallback.")
            return QuestionAgentOutput(**fallback_data)

    def _handle_company_archetype(
        self,
        target_role: str,
        difficulty: Optional[str],
        topics: Optional[List[str]],
        previous_questions: List[str],
    ) -> QuestionAgentOutput:
        company = (topics[0] if topics and len(topics) > 0 else "amazon").lower()
        sub_topic = topics[1] if topics and len(topics) > 1 else None

        AMAZON_QUESTIONS = [
            ("amz_lp_01", "Tell me about a time when you took full ownership of a failing project without authorization. What trade-offs did you make?", "Ownership & Bias for Action", "Ownership"),
            ("amz_lp_02", "Give an example of a time you prioritized customer obsession over short-term engineering convenience.", "Customer Obsession", "Customer Obsession"),
            ("amz_lp_03", "Describe a situation where you had to disagree and commit with a leadership directive. How did you execute afterwards?", "Have Backbone; Disagree & Commit", "Disagree & Commit"),
            ("amz_lp_04", "Tell me about a complex issue where you had to dive deep into logs or metrics to uncover a hidden root cause.", "Dive Deep & Insist on Highest Standards", "Dive Deep"),
            ("amz_lp_05", "Describe a scenario where speed was critical but you lacked sufficient data. How did you demonstrate bias for action?", "Bias for Action", "Bias for Action"),
            ("amz_lp_06", "Tell me about a time you made a significant technical mistake. How did you communicate the failure and rebuild trust?", "Earn Trust", "Earn Trust"),
            ("amz_lp_07", "Describe a project with aggressive deadlines where resources were pulled. How did you prioritize to deliver results?", "Deliver Results", "Deliver Results"),
            ("amz_lp_08", "Tell me about a time you simplified a complex legacy architecture or process that was slowing down the team.", "Invent and Simplify", "Invent & Simplify"),
        ]

        GOOGLE_QUESTIONS = [
            ("goog_scale_01", "How would you design a distributed cache serving 10 million QPS across three regions with strong consistency?", "System Architecture & Global Scale", "Distributed Systems & Scale"),
            ("goog_scale_02", "Tell me about a time you navigated an ambiguous technical requirement with conflicting stakeholders under uncertainty.", "Navigating Ambiguity", "Navigating Ambiguity"),
            ("goog_scale_03", "How do you design backoff, load shedding, and circuit breaking to prevent cascading failures across microservices?", "Reliability Engineering & Resiliency", "Fault Tolerance & Reliability"),
            ("goog_scale_04", "How would you detect duplicate event streams in a real-time pipeline processing 500k events/sec with bounded memory?", "Algorithmic Invariants & Complexity", "Algorithmic Invariants & Complexity"),
            ("goog_scale_05", "Describe an architectural disagreement with a peer. How did you demonstrate intellectual humility and resolve it?", "Googliness & Collaboration", "Googliness & Collaboration"),
        ]

        MCKINSEY_QUESTIONS = [
            ("mck_case_01", "A retail client is facing a 15% margin decline despite 20% revenue growth. How would you structure your MECE framework to find the root cause?", "MECE Case Decomposition & Profitability", "MECE Profitability"),
            ("mck_case_02", "An EV battery company wants to acquire a lithium mining firm. How would you evaluate market sizing and synergy risks?", "M&A Valuation & Market Sizing", "M&A & Market Sizing"),
            ("mck_case_03", "A logistics provider is experiencing 35% delivery delays across regional hubs. How do you decompose the problem drivers?", "Operations & Supply Chain", "Operations & Supply Chain"),
            ("mck_case_04", "A legacy bank is losing market share to fintechs among Gen Z. Structure a digital product offering using the Pyramid Principle.", "Digital Transformation Strategy", "Digital Transformation"),
        ]

        pool = AMAZON_QUESTIONS if company == "amazon" else GOOGLE_QUESTIONS if company == "google" else MCKINSEY_QUESTIONS

        # Filter by sub-topic if specified
        if sub_topic:
            sub_matches = [q for q in pool if sub_topic.lower() in q[3].lower() or sub_topic.lower() in q[2].lower()]
            available = [q for q in sub_matches if q[1] not in previous_questions]
        else:
            available = [q for q in pool if q[1] not in previous_questions]

        if available:
            selected = random.choice(available)
            concise_q = self._enforce_concise_question(selected[1])
            return QuestionAgentOutput(
                question_id=selected[0],
                question=concise_q,
                competency=selected[2],
                difficulty=difficulty or "medium",
                question_type="behavioral" if company == "amazon" else "technical" if company == "google" else "case_study",
                reason=f"Tailored {company.capitalize()} Archetype interview prompt focusing on {selected[2]}.",
                target_gap=f"{company.upper()} • {sub_topic or selected[2]}",
            )

        # Fallback to LLM dynamic generation for company archetype
        formatted_prev = self._format_previous_questions(previous_questions)
        prompt = f"""You are a Senior Bar Raiser at {company.capitalize()}.
Target Role: {target_role}
Focus Principle / Competency: {sub_topic or 'Core Company Standard'}

CRITICAL DIFFICULTY CONSTRAINT:
Independently decide the difficulty level ('easy', 'medium', or 'hard') for this question. Output this in 'difficulty'.

CRITICAL CONCISENESS & LENGTH CONSTRAINT:
- The question MUST be strictly between 1 to 2 lines in length (approximately 15 to 30 words max).
- Direct and authentic question without conversational fluff.

CRITICAL ANTI-REPETITION CONSTRAINT:
The following questions have ALREADY been asked in this session or candidate history:
{formatted_prev}

TASK:
Generate a NEW, concise 1 to 2 line interview question embodying the exact interview bar of {company.capitalize()}.
STRICT: DO NOT repeat or rephrase any previous questions.
"""

        fallback_diff = difficulty or "medium"
        fallback_data = {
            "question_id": f"{company}_dyn_{uuid.uuid4().hex[:8]}",
            "question": self._enforce_concise_question(f"Describe a high-stakes decision you made with incomplete data while upholding {company.capitalize()}'s bar for {sub_topic or 'engineering standards'}."),
            "competency": sub_topic or "Strategic Decision Making",
            "difficulty": fallback_diff,
            "question_type": "technical" if company == "google" else "behavioral",
            "reason": f"Authentic dynamic {company.capitalize()} evaluation prompt for {sub_topic or 'leadership'}.",
            "target_gap": f"{company.upper()} • {sub_topic or 'Core Standard'}",
        }

        try:
            result = parse_structured_output(self.llm, prompt, QuestionAgentOutput, fallback_data)
            if not result.question_id:
                result.question_id = f"{company}_dyn_{uuid.uuid4().hex[:8]}"
            if not result.target_gap:
                result.target_gap = f"{company.upper()} • {sub_topic or result.competency}"
            result.question = self._enforce_concise_question(result.question)
            if not result.difficulty or result.difficulty.lower() not in ["easy", "medium", "hard"]:
                result.difficulty = fallback_diff
            return result
        except Exception as e:
            logger.warning(f"Dynamic company archetype generation failed ({e}). Using fallback.")
            res = QuestionAgentOutput(**fallback_data)
            res.target_gap = f"{company.upper()} • {sub_topic or 'Core Standard'}"
            return res
