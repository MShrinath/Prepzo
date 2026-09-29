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

    def select_or_generate_question(
        self,
        mode: str,
        target_role: str,
        difficulty: str = "medium",
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
        difficulty: str,
        competency: Optional[str],
        candidate_profile: Optional[Dict[str, Any]],
        previous_questions: List[str],
    ) -> QuestionAgentOutput:
        from app.models.entities import InterviewQuestion

        # Check for unasked curated questions in DB first
        if self.db:
            query = self.db.query(InterviewQuestion).filter(
                InterviewQuestion.role.ilike(f"%{target_role}%")
            )
            if competency:
                query = query.filter(InterviewQuestion.competency.ilike(f"%{competency}%"))

            candidates = query.all()
            available = [q for q in candidates if q.question not in previous_questions]

            if available:
                diff_match = [q for q in available if q.difficulty.lower() == difficulty.lower()]
                selected = random.choice(diff_match if diff_match else available)
                return QuestionAgentOutput(
                    question_id=selected.question_id,
                    question=selected.question,
                    competency=selected.competency,
                    difficulty=selected.difficulty,
                    question_type=selected.question_type,
                    reason=f"Selected curated question for role '{target_role}' targeting competency '{selected.competency}'.",
                )

        # If DB questions are exhausted or empty, generate dynamically with LLM to prevent repetition
        formatted_prev = self._format_previous_questions(previous_questions)
        profile_snippet = ""
        if candidate_profile:
            skills = ", ".join([s.get("skill_name", "") for s in candidate_profile.get("skills", [])])
            profile_snippet = f"\nCandidate Profile: Skills: {skills}; Target Role: {candidate_profile.get('target_role')}"

        prompt = f"""You are a Principal Technical Interviewer and Hiring Bar Raiser conducting an interview for the role: "{target_role}".
Target Difficulty: {difficulty}
Target Competency: {competency or "Problem Solving & Technical Depth"}{profile_snippet}

CRITICAL ANTI-REPETITION CONSTRAINT:
The following questions have ALREADY been asked in this session:
{formatted_prev}

TASK:
Generate a NEW, high-caliber interview question testing realistic skills for a "{target_role}" at the {difficulty} level.
Rules:
1. STRICT: Do NOT repeat, paraphrase, or ask anything similar to the previously asked questions listed above.
2. The question must be deeply practical and relevant to what an employer assesses for "{target_role}".
3. Target the competency: {competency or 'Core Problem Solving and Architectural or Domain Decision Making'}.
4. Provide a clear reason explaining what this question tests and why it is appropriate.
"""

        fallback_id = f"gen_role_{uuid.uuid4().hex[:8]}"
        fallback_data = {
            "question_id": fallback_id,
            "question": f"In your experience as a {target_role}, how do you approach diagnosing and resolving complex, unexpected issues when standard procedures fail?",
            "competency": competency or "Problem Solving",
            "difficulty": difficulty,
            "question_type": "technical" if target_role in ["SDE", "DevOps Engineer", "Cloud Engineer", "AI/ML Engineer"] else "situational",
            "reason": f"Evaluating practical problem-solving methodology for {target_role}.",
        }

        try:
            result = parse_structured_output(self.llm, prompt, QuestionAgentOutput, fallback_data)
            if not result.question_id:
                result.question_id = fallback_id

            # Save dynamically generated question to DB for future reference
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

        # 3. Perform or retrieve Gap Analysis
        analysis = ResumeJDService.analyze_gap(resume_content, jd_content, target_role=target_role)

        # 4. Generate next question dynamically using LLM, strictly avoiding previous questions
        formatted_prev = self._format_previous_questions(previous_questions)
        missing_skills_list = analysis.get("missing_skills", [])
        matched_sample = ", ".join(analysis.get("matched_skills", [])[:6])
        missing_sample = "\n- ".join(missing_skills_list[:8]) if missing_skills_list else "General specialized domain requirements"
        focus_sample = ", ".join(analysis.get("tailored_focus_areas", [])[:4])

        prompt = f"""You are a Principal Interviewer assessing a candidate for the role: "{target_role}".
Target Seniority/Difficulty: {difficulty}
Target Competency Focus: {competency or "Balanced mix of Technical Depth, Problem Solving, and Execution"}

CANDIDATE RESUME SUMMARY:
\"\"\"
{resume_content[:3000]}
\"\"\"

TARGET JOB DESCRIPTION:
\"\"\"
{jd_content[:2500]}
\"\"\"

RESUME vs JD GAP EVALUATION:
- Verified Resume Strengths: {matched_sample or "General relevant background"}
- IDENTIFIED GAPS TO PROBE (Requirements in JD not prominent in Resume):
- {missing_sample}
- Seniority Alignment: {analysis.get('experience_level_match', 'Mid to Senior')}
- Priority Focus Areas: {focus_sample or "System architecture and hands-on execution"}

CRITICAL ANTI-REPETITION CONSTRAINT:
The following questions have ALREADY been asked in this session:
{formatted_prev}

PRIMARY OBJECTIVE & TASK:
In Mode 2, your interview MUST EXPLICITLY FOCUS ON THE IDENTIFIED GAPS between the candidate's resume and the job description.
Select ONE specific gap from the list of 'IDENTIFIED GAPS TO PROBE' (or priority focus areas) that has not yet been thoroughly tested.
Generate a targeted, rigorous interview question that tests the candidate's proficiency, transferable knowledge, or architectural approach to solving challenges involving this gap.

Rules:
1. STRICT: NEVER repeat, rephrase, or overlap with any previously asked questions.
2. Focus deeply on the selected gap. Test how the candidate would design, implement, troubleshoot, or make trade-offs regarding this missing skill/responsibility on the job.
3. In 'target_gap', provide the EXACT short title of the gap being probed (e.g. 'Kubernetes Orchestration', 'Kafka Stream Ingestion', 'Vector Databases & RAG', 'Large-Scale Team Leadership').
4. In 'reason', clearly explain which gap in the resume is being evaluated and what evidence the candidate needs to demonstrate.
"""

        # Prepare rich fallbacks from gap analysis
        gap_questions = analysis.get("recommended_gap_probing_questions", [])
        tech_questions = analysis.get("recommended_technical_questions", [])
        
        # Prioritize gap questions first
        unasked_from_analysis = [q for q in gap_questions if q not in previous_questions]
        if not unasked_from_analysis:
            unasked_from_analysis = [q for q in tech_questions if q not in previous_questions]

        first_gap = missing_skills_list[0] if missing_skills_list else "Domain Architecture"
        if unasked_from_analysis:
            chosen_fallback = unasked_from_analysis[0]
            is_probing = chosen_fallback in gap_questions
            fallback_data = {
                "question_id": f"resume_jd_{uuid.uuid4().hex[:8]}",
                "question": chosen_fallback,
                "competency": "Ownership & Accountability" if is_probing else "Problem Solving",
                "difficulty": difficulty,
                "question_type": "behavioral" if is_probing else "technical",
                "reason": f"Probing critical JD gap: {first_gap}.",
                "target_gap": first_gap,
            }
        else:
            fallback_data = {
                "question_id": f"resume_jd_{uuid.uuid4().hex[:8]}",
                "question": f"One of the critical requirements in this {target_role} role is {first_gap}. How would you approach designing a production-ready solution leveraging or integrating {first_gap}, and how would you mitigate its known failure modes?",
                "competency": "Problem Solving",
                "difficulty": difficulty,
                "question_type": "technical",
                "reason": f"Evaluating candidate's capability to bridge the key JD gap in {first_gap}.",
                "target_gap": first_gap,
            }

        try:
            result = parse_structured_output(self.llm, prompt, QuestionAgentOutput, fallback_data)
            if not result.question_id:
                result.question_id = f"resume_jd_{uuid.uuid4().hex[:8]}"
            if not result.target_gap and missing_skills_list:
                result.target_gap = missing_skills_list[0]
            return result
        except Exception as e:
            logger.warning(f"Dynamic resume-jd question generation failed ({e}). Using gap analysis fallback.")
            return QuestionAgentOutput(**fallback_data)

    def _handle_hr_round(
        self,
        difficulty: str,
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
                return QuestionAgentOutput(
                    question_id=selected.question_id,
                    question=selected.question,
                    competency=selected.competency,
                    difficulty=selected.difficulty,
                    question_type="behavioral",
                    reason=f"Selected HR behavioral question targeting competency '{selected.competency}'.",
                )

        # LLM dynamic generation for HR round when presets run out
        formatted_prev = self._format_previous_questions(previous_questions)
        topic_str = ", ".join(topics) if topics else "Conflict Resolution, Receiving Feedback, and Teamwork"

        prompt = f"""You are an Executive HR Director conducting a behavioral interview.
Target Difficulty: {difficulty}
Topics of Focus: {topic_str}

CRITICAL ANTI-REPETITION CONSTRAINT:
The following questions have ALREADY been asked in this session:
{formatted_prev}

TASK:
Generate a NEW, nuanced behavioral interview question using the STAR (Situation, Task, Action, Result) methodology.
Rules:
1. STRICT: Do NOT repeat or paraphrase any previously asked questions.
2. Pose a realistic workplace scenario probing interpersonal dynamics, conflict, resilience, receiving feedback, or leadership.
3. Formulate the question clearly (e.g. 'Tell me about a time when...').
4. In 'reason', explain what behavioral indicator this question measures.
"""

        fallback_data = {
            "question_id": f"hr_dyn_{uuid.uuid4().hex[:8]}",
            "question": "Tell me about a time when you strongly disagreed with a colleague's or leader's decision. How did you express your perspective, and what was the outcome?",
            "competency": "Teamwork & Conflict Resolution",
            "difficulty": difficulty,
            "question_type": "behavioral",
            "reason": "Evaluating constructive disagreement and interpersonal maturity.",
        }

        try:
            result = parse_structured_output(self.llm, prompt, QuestionAgentOutput, fallback_data)
            if not result.question_id:
                result.question_id = f"hr_dyn_{uuid.uuid4().hex[:8]}"
            return result
        except Exception as e:
            logger.warning(f"Dynamic HR question generation failed ({e}). Using fallback.")
            return QuestionAgentOutput(**fallback_data)

    def _handle_company_archetype(
        self,
        target_role: str,
        difficulty: str,
        topics: Optional[List[str]],
        previous_questions: List[str],
    ) -> QuestionAgentOutput:
        company = (topics[0] if topics and len(topics) > 0 else "amazon").lower()
        sub_topic = topics[1] if topics and len(topics) > 1 else None

        AMAZON_QUESTIONS = [
            ("amz_lp_01", "Tell me about a time when you had to take full Ownership of a failing project without explicit authorization. What trade-offs did you make to Deliver Results?", "Ownership & Bias for Action", "Ownership"),
            ("amz_lp_02", "Give an example of a time you advocated for Customer Obsession over short-term engineering convenience or immediate quarterly metrics.", "Customer Obsession", "Customer Obsession"),
            ("amz_lp_03", "Describe a situation where you had to Disagree & Commit with a senior leadership directive. How did you execute afterwards without lingering resentment?", "Have Backbone; Disagree & Commit", "Disagree & Commit"),
            ("amz_lp_04", "Tell me about a complex issue where you had to Dive Deep into metrics or raw logs to uncover a root cause others missed.", "Dive Deep & Insist on Highest Standards", "Dive Deep"),
            ("amz_lp_05", "Describe a scenario where speed of execution was critical, but you lacked 50% of the requisite data. How did you demonstrate Bias for Action while managing downside risk?", "Bias for Action", "Bias for Action"),
            ("amz_lp_06", "Tell me about a time you made a significant mistake that impacted clients or peers. How did you communicate the failure and rebuild Earn Trust?", "Earn Trust", "Earn Trust"),
            ("amz_lp_07", "Describe a project with seemingly impossible deadlines where key team resources were pulled. How did you reprioritize to Deliver Results?", "Deliver Results", "Deliver Results"),
            ("amz_lp_08", "Tell me about a time you simplified a complex legacy architecture or process that was causing massive team friction. How did you Invent and Simplify?", "Invent and Simplify", "Invent & Simplify"),
        ]

        GOOGLE_QUESTIONS = [
            ("goog_scale_01", "How would you design a distributed cache system serving 10 million QPS across 3 geographic regions while guaranteeing strong consistency for critical financial records?", "System Architecture & Global Scale", "Distributed Systems & Scale"),
            ("goog_scale_02", "Tell me about a time you navigated an extremely ambiguous product requirement with conflicting cross-functional stakeholders. How did you structure your technical design under uncertainty?", "Navigating Ambiguity", "Navigating Ambiguity"),
            ("goog_scale_03", "Walk me through how you handle a cascading failure across microservices during a peak traffic event. How do you design backoff, load shedding, and circuit breaking?", "Reliability Engineering & Resiliency", "Fault Tolerance & Reliability"),
            ("goog_scale_04", "You need to detect duplicate event streams in a real-time ingestion pipeline processing 500k events/sec with bounded memory. How would you design this?", "Algorithmic Invariants & Complexity", "Algorithmic Invariants & Complexity"),
            ("goog_scale_05", "Tell me about a situation where you disagreed with a peer on an architectural approach. How did you demonstrate intellectual humility, resolve the trade-off, and preserve team Googliness?", "Googliness & Collaboration", "Googliness & Collaboration"),
        ]

        MCKINSEY_QUESTIONS = [
            ("mck_case_01", "A global retail client is experiencing a 15% margin decline despite 20% top-line revenue growth. How would you structure your MECE framework to isolate the root cause?", "MECE Case Decomposition & Profitability", "MECE Profitability"),
            ("mck_case_02", "An EV battery startup is considering acquiring a lithium mining firm. How would you evaluate market sizing, synergy valuation, and post-merger integration risks?", "M&A Valuation & Market Sizing", "M&A & Market Sizing"),
            ("mck_case_03", "A major logistics provider is suffering from 35% delivery delays across regional hubs. Decompose the operations value chain into MECE problem drivers.", "Operations & Supply Chain", "Operations & Supply Chain"),
            ("mck_case_04", "A legacy retail bank is losing market share to neo-banks among Gen Z customers. Structure a market entry and digital product offering strategy using the Pyramid Principle.", "Digital Transformation Strategy", "Digital Transformation"),
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
            return QuestionAgentOutput(
                question_id=selected[0],
                question=selected[1],
                competency=selected[2],
                difficulty=difficulty,
                question_type="behavioral" if company == "amazon" else "technical" if company == "google" else "case_study",
                reason=f"Tailored {company.capitalize()} Archetype interview prompt focusing on {selected[2]}.",
                target_gap=f"{company.upper()} • {sub_topic or selected[2]}",
            )

        # Fallback to LLM dynamic generation for company archetype
        formatted_prev = self._format_previous_questions(previous_questions)
        prompt = f"""You are a Senior Bar Raiser at {company.capitalize()}.
Target Role: {target_role}
Target Difficulty: {difficulty}
Focus Principle / Competency: {sub_topic or 'Core Company Standard'}

CRITICAL ANTI-REPETITION CONSTRAINT:
The following questions have ALREADY been asked in this session or candidate history:
{formatted_prev}

TASK:
Generate a NEW, authentic interview question embodying the exact interview bar of {company.capitalize()}.
- If Amazon: Formulate an intense behavioral scenario probing Amazon's Leadership Principles (focus: {sub_topic or 'Ownership / Customer Obsession / Deliver Results'}), demanding concrete data, metrics, and trade-offs.
- If Google: Formulate a planetary-scale distributed systems or algorithmic complexity problem (focus: {sub_topic or '10M+ QPS Scale / Ambiguity / Resiliency'}).
- If McKinsey: Formulate a structured MECE business strategy, profitability, or market-entry case prompt (focus: {sub_topic or 'MECE decomposition / Hypothesis testing'}).
STRICT: DO NOT repeat or rephrase any previous questions.
"""

        fallback_data = {
            "question_id": f"{company}_dyn_{uuid.uuid4().hex[:8]}",
            "question": f"Walk me through a situation where you had to make a high-stakes decision under incomplete information adhering strictly to {company.capitalize()}'s bar for {sub_topic or 'strategic ownership'}.",
            "competency": sub_topic or "Strategic Decision Making",
            "difficulty": difficulty,
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
            return result
        except Exception as e:
            logger.warning(f"Dynamic company archetype generation failed ({e}). Using fallback.")
            res = QuestionAgentOutput(**fallback_data)
            res.target_gap = f"{company.upper()} • {sub_topic or 'Core Standard'}"
            return res
