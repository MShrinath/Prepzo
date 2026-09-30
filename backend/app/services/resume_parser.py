import re
import io
import logging
from typing import Dict, Any, List, Optional
from pypdf import PdfReader

from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import (
    GapAnalysisOutput,
    ComprehensiveResumeAnalysis,
    DetectedProject,
    WorkExperienceItem,
    ExperienceAnalysis,
    ProjectAnalysis,
    SkillsAnalysis,
    SkillGapDetail,
    StrategicRoadmapPhase,
)

logger = logging.getLogger(__name__)

COMMON_SKILLS = [
    # Programming & Frameworks
    "python", "fastapi", "django", "flask", "javascript", "typescript", "react", "vue", "angular",
    "next.js", "node.js", "express", "sql", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes",
    "aws", "azure", "gcp", "git", "ci/cd", "terraform", "graphql", "rest", "linux", "c++", "java", "spring boot",
    "golang", "rust", "kafka", "rabbitmq", "pandas", "numpy", "pytorch", "tensorflow", "scikit-learn",
    "system design", "microservices", "unit testing", "agile", "scrum", "distributed systems",
    # Data & Analytics
    "snowflake", "databricks", "spark", "hadoop", "tableau", "power bi", "etl", "data warehouse", "dbt",
    # DevOps & Cloud
    "helm", "ansible", "prometheus", "grafana", "nginx", "jenkins", "gitlab ci", "github actions",
    # Product, Sales & Leadership
    "product management", "roadmap", "user stories", "kpis", "okrs", "jira", "a/b testing",
    "sales", "pipeline management", "crm", "hubspot", "salesforce", "customer success", "churn reduction",
    "stakeholder management", "mentorship", "code review", "cross-functional"
]


class ResumeJDService:
    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        """Extract plain text from uploaded PDF bytes."""
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
        except Exception as e:
            logger.warning(f"Error extracting PDF: {e}")
            return f"Error extracting PDF: {str(e)}"

    @staticmethod
    def extract_skills_from_text(text: str) -> List[str]:
        """Extract normalized tech and domain skills from free-form text."""
        lowered = text.lower()
        found = []
        for skill in COMMON_SKILLS:
            pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"
            if re.search(pattern, lowered):
                found.append(skill.upper() if len(skill) <= 3 else skill.title())
        return list(dict.fromkeys(found))

    @staticmethod
    def parse_resume(text: str) -> Dict[str, Any]:
        """Parse structured elements from resume text, extracting skills, experience, and projects."""
        skills = ResumeJDService.extract_skills_from_text(text)
        
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        email = email_match.group(0) if email_match else None

        exp_match = re.search(r"(\d+)\+?\s*(?:years|yrs)\s+(?:of\s+)?experience", text, re.IGNORECASE)
        years = int(exp_match.group(1)) if exp_match else 2

        projects = []
        work_experiences = []
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines:
            line_lower = line.lower()
            if any(term in line_lower for term in ["project:", "project -", "built a", "developed a", "engineered", "designed a", "architected", "implemented", "created a"]):
                projects.append(line[:160])
            elif any(term in line_lower for term in ["software engineer", "developer", "backend", "fullstack", "architect", "lead", "intern"]) and len(line) < 120:
                work_experiences.append(line)

        return {
            "raw_text": text,
            "email": email,
            "skills": skills,
            "experience_years": years,
            "detected_projects": projects[:6],
            "detected_experiences": work_experiences[:4],
        }

    @staticmethod
    def parse_job_description(jd_text: str) -> Dict[str, Any]:
        """Parse requirements and skills from a Job Description."""
        skills = ResumeJDService.extract_skills_from_text(jd_text)
        
        lowered = jd_text.lower()
        seniority = "Mid-Level"
        if any(w in lowered for w in ["senior", "lead", "staff", "principal", "architect", "head of", "director"]):
            seniority = "Senior / Lead"
        elif any(w in lowered for w in ["junior", "entry", "associate", "intern"]):
            seniority = "Junior / Associate"

        return {
            "raw_text": jd_text,
            "required_skills": skills,
            "seniority": seniority,
        }

    @staticmethod
    def analyze_resume_and_jd(resume_text: str, jd_text: str, target_role: Optional[str] = None) -> Dict[str, Any]:
        """
        Deep LLM analysis of Candidate Resume against the Target Job Description and Role:
        - Extracts candidate profile (name, email, detected experience years, seniority)
        - Analyzes experience history and alignment with the JD role
        - Extracts and evaluates projects (technologies, measurable impact, relevance to JD, probing areas)
        - Matches skills (matched skills, missing skills, additional skills, detailed gap breakdown)
        - Evaluates overall role fit, top strengths, critical hiring risks
        - Generates role-grounded technical questions and scenario/gap-probing questions
        - Generates 3-phase strategic roadmap to close the gap
        """
        target_role_str = target_role or "Software Engineer"
        clean_resume = (resume_text or "").strip()
        clean_jd = (jd_text or "").strip()

        # Generate heuristic baseline as fallback
        resume_data = ResumeJDService.parse_resume(clean_resume)
        jd_data = ResumeJDService.parse_job_description(clean_jd) if clean_jd else {
            "raw_text": "",
            "required_skills": ["python", "system design", "sql", "api"],
            "seniority": "Mid-Level"
        }

        resume_skills_set = {s.lower() for s in resume_data["skills"]}
        matched = [s for s in jd_data["required_skills"] if s.lower() in resume_skills_set]
        missing = [s for s in jd_data["required_skills"] if s.lower() not in resume_skills_set]
        additional = [s for s in resume_data["skills"] if s.lower() not in {m.lower() for m in matched}]

        sample_project = resume_data["detected_projects"][0] if resume_data["detected_projects"] else None

        fallback_tech_q = []
        if sample_project:
            fallback_tech_q.append(
                f"In your resume, you noted: '{sample_project}'. Walk me through the end-to-end architecture, the key technical trade-offs you made, and how you validated performance or correctness."
            )
        for s in matched[:2]:
            fallback_tech_q.append(
                f"Your profile highlights experience with {s}. Can you describe a specific high-impact system or workflow you built using {s}, and how you handled performance trade-offs?"
            )
        if not fallback_tech_q:
            fallback_tech_q.append(
                f"Walk me through the most technically complex project from your background that is relevant to this {target_role_str} role, detailing your individual contributions and design decisions."
            )
            fallback_tech_q.append(
                f"How have you designed and maintained scalable, fault-tolerant solutions in your previous roles when facing tight deadlines?"
            )

        fallback_gap_q = []
        for g in missing[:3]:
            fallback_gap_q.append(
                f"The job requirements emphasize hands-on proficiency in {g}, which is not prominently featured on your resume. How would you approach quickly bridging this gap to deliver results on day one?"
            )
        if not fallback_gap_q:
            fallback_gap_q.append(
                "Describe a situation where a critical project required an unfamiliar technology stack or domain. How did you rapidly ramp up and ensure successful delivery?"
            )

        calc_score = int(max(35, min(95, round((len(matched) / max(1, len(matched) + len(missing))) * 100)))) if (matched or missing) else 75

        fallback_gap_details = []
        for idx, g in enumerate(missing[:4]):
            first_matched = matched[0] if matched else "core engineering"
            fallback_gap_details.append({
                "skill_or_domain": g,
                "severity": "Critical" if idx == 0 else ("High" if idx == 1 else "Medium"),
                "why_it_matters": f"The target job description emphasizes {g} as an essential requirement for {target_role_str} responsibilities and team velocity.",
                "current_resume_status": f"The resume demonstrates foundations in {first_matched}, but does not show demonstrated production artifacts using {g}.",
                "how_to_improve": f"Deep dive into the core architecture, primitives, and best practices of {g}. Build a focused proof-of-concept connecting {g} to your existing stack.",
                "recommended_projects_or_actions": [
                    f"Build a standalone microservice or demo incorporating {g} with {first_matched} to demonstrate end-to-end integration.",
                    f"Study common failure modes, concurrency issues, and scaling bottlenecks associated with {g} to excel in system design rounds."
                ],
                "talking_points": f"In the interview, highlight how your mastery of {first_matched} provides direct architectural parallels to {g}, and explain your structured learning ramp-up plan."
            })

        fallback_roadmap = [
            {
                "phase": "Phase 1: Rapid Architectural Fundamentals (Days 1–3)",
                "focus": f"Master the core mental models, life cycles, and design patterns of {missing[0] if missing else 'target frameworks'}.",
                "actions": [
                    f"Complete deep dive on {missing[0] if missing else 'required tools'} architecture docs and real-world case studies.",
                    "Map out technical trade-offs between your existing tools and the new requirements."
                ]
            },
            {
                "phase": "Phase 2: Hands-On Portfolio Proof-of-Concept (Days 4–5)",
                "focus": "Build a verifiable code sample or architecture repository demonstrating practical capability.",
                "actions": [
                    f"Implement an end-to-end prototype leveraging {missing[0] if missing else 'the JD technologies'}.",
                    "Write automated tests and document throughput/latency benchmarks in a clean README."
                ]
            },
            {
                "phase": "Phase 3: Interview Articulation & STAR Rehearsal (Days 6–7)",
                "focus": "Rehearse executive communication and articulate transferable experience during probing questions.",
                "actions": [
                    "Prepare a concise STAR example showcasing a past time you mastered an unfamiliar tool under tight production deadlines.",
                    "Practice answering technical trade-off questions with confidence, acknowledging gaps while emphasizing velocity."
                ]
            }
        ]

        fallback_projects = [
            {
                "name": p.split(":")[0].strip() if ":" in p else p[:35].strip(),
                "description": p,
                "technologies": matched[:4] or ["Python", "SQL"],
                "measurable_impact": "Demonstrated technical implementation from resume portfolio.",
                "relevance_to_role": "High",
                "strengths_for_role": "Directly proves ability to architect and ship software features.",
                "probing_areas": ["Concurrency and error handling", "Database query optimization and caching trade-offs"],
            } for p in (resume_data.get("detected_projects") or [f"{target_role_str} Implementation Project"])
        ]

        fallback_experiences = [
            {
                "role_title": exp.split(" at ")[0] if " at " in exp else exp,
                "company_or_org": exp.split(" at ")[1] if " at " in exp else "Engineering Organization",
                "duration_or_dates": "Recent",
                "relevance_to_role": "High",
                "key_achievements": [exp]
            } for exp in (resume_data.get("detected_experiences") or [f"{target_role_str} Professional Experience"])
        ]

        fallback_data = {
            "candidate_name": resume_data.get("name") or "Candidate",
            "email": resume_data.get("email"),
            "target_role": target_role_str,
            "overall_match_score": calc_score,
            "experience_level_match": f"Candidate has approximately {resume_data['experience_years']} YOE vs {jd_data['seniority']} requirements.",
            "role_fit_summary": f"Candidate demonstrates foundational competencies for {target_role_str}. Key focus is validating depth in claimed resume projects and probing unfamiliar JD requirements.",
            "top_strengths": [
                f"Strong demonstrated proficiency in {', '.join(matched[:3])}" if matched else "Core software engineering fundamentals",
                "Practical production development and system execution",
                "Proven capability delivering features across modern stacks"
            ],
            "critical_risks_or_gaps": [
                f"Limited demonstrated production depth in {', '.join(missing[:3])}" if missing else "Needs verification on high-scale distributed systems trade-offs",
                f"May require ramp-up on {missing[0]} architecture and best practices" if missing else "Domain-specific edge case handling"
            ],
            "experience_analysis": {
                "detected_years": resume_data["experience_years"],
                "seniority_level": jd_data["seniority"],
                "experience_match_score": calc_score,
                "experience_match_summary": f"Candidate displays ~{resume_data['experience_years']} years of experience relevant to {target_role_str}.",
                "work_history": fallback_experiences,
                "experience_strengths": [f"Demonstrated background in {m}" for m in (matched[:2] or ["Software Engineering"])],
                "experience_gaps": [f"Unproven experience with {ms}" for ms in (missing[:2] or ["Enterprise Scale Deployments"])],
            },
            "project_analysis": {
                "detected_projects": fallback_projects,
                "portfolio_strengths": [
                    "Hands-on execution of end-to-end functionality",
                    "Application of modern development tooling"
                ],
                "recommended_projects_to_build": [
                    f"Build a production microservice integrating {missing[0] if missing else 'event-driven architecture'} with test coverage and CI/CD.",
                    f"Implement latency benchmarking and caching metrics comparing {matched[0] if matched else 'relational'} and key-value storage."
                ]
            },
            "skills_analysis": {
                "matched_skills": matched or ["Problem Solving", "Software Design"],
                "missing_skills": missing or ["Advanced Architecture & Scale Verification"],
                "additional_skills": additional[:5],
                "skills_match_score": calc_score,
                "skill_gap_details": fallback_gap_details,
            },
            "matched_skills": matched or ["Problem Solving", "Software Design"],
            "missing_skills": missing or ["Advanced Architecture & Scale Verification"],
            "match_score": calc_score,
            "tailored_focus_areas": [
                f"Deep dive into {m}" for m in (matched[:2] if matched else ["Architecture & Implementation"])
            ] + [
                f"Probe proficiency in {ms}" for ms in (missing[:2] if missing else ["Domain-Specific Tools"])
            ],
            "recommended_technical_questions": fallback_tech_q,
            "recommended_gap_probing_questions": fallback_gap_q,
            "skill_gap_details": fallback_gap_details,
            "improvement_roadmap": fallback_roadmap,
        }

        # Attempt LLM comprehensive evaluation
        try:
            llm = get_llm(temperature=0.2)
            prompt = f"""You are a Principal Technical Hiring Manager and Staff Interviewer assessing a candidate for the role: "{target_role_str}".
Evaluate the Candidate's Resume against the attached Job Description with deep, rigorous precision.

CANDIDATE RESUME:
\"\"\"
{clean_resume[:5000]}
\"\"\"

TARGET JOB DESCRIPTION:
\"\"\"
{clean_jd[:4000] if clean_jd else f"Role: {target_role_str}. Core responsibilities and skills required for a modern {target_role_str}."}
\"\"\"

Produce an in-depth analysis covering:
1. 'candidate_name' & 'email' if found in resume.
2. 'target_role': "{target_role_str}".
3. 'overall_match_score': Integer (0-100) reflecting overall alignment between resume and JD.
4. 'experience_level_match': Candid evaluation of candidate's seniority vs JD requirements.
5. 'role_fit_summary': 2-3 sentence executive assessment of fit, readiness, and interview priorities.
6. 'top_strengths': 3 to 5 standout capabilities for this role proven by resume.
7. 'critical_risks_or_gaps': 2 to 4 key risks, missing requirements, or gaps for this role.
8. 'experience_analysis':
   - 'detected_years': Calculated total professional years of experience (int).
   - 'seniority_level': Candidate's seniority level (Junior, Mid-Level, Senior, Lead/Staff, Principal).
   - 'experience_match_score': 0-100 score on experience alignment.
   - 'experience_match_summary': Detailed assessment of candidate's background against JD expectations.
   - 'work_history': List of detected past jobs/roles with:
     * 'role_title': Job title.
     * 'company_or_org': Company name.
     * 'duration_or_dates': Date range or duration.
     * 'relevance_to_role': 'High', 'Medium', or 'Low'.
     * 'key_achievements': Key metrics and responsibilities in this position.
   - 'experience_strengths': Key background strengths for this role.
   - 'experience_gaps': Scale, leadership, or domain experience gaps.
9. 'project_analysis':
   - 'detected_projects': List of distinct projects/systems extracted from resume with:
     * 'name': Project title.
     * 'description': Clear overview of architecture, problem solved, and candidate's contribution.
     * 'technologies': List of languages, frameworks, databases, and tools used.
     * 'measurable_impact': Specific numbers, throughput, latency, user metrics, or business impact.
     * 'relevance_to_role': 'High', 'Medium', or 'Low'.
     * 'strengths_for_role': Why this project proves capability for the target role.
     * 'probing_areas': 2-3 specific architectural bottlenecks, trade-offs, or edge cases an interviewer should probe.
   - 'portfolio_strengths': Assessment of project depth.
   - 'recommended_projects_to_build': 2 concrete project ideas to build to prove missing JD skills.
10. 'skills_analysis':
   - 'matched_skills': Specific tools, languages, frameworks present in resume satisfying the JD.
   - 'missing_skills': Requirements, tools, scale milestones emphasized in JD that are missing or weak in resume.
   - 'additional_skills': Valuable skills candidate has not explicitly asked by JD.
   - 'skills_match_score': 0-100 score on skills match.
   - 'skill_gap_details': List of detailed objects for key missing skills with:
     * 'skill_or_domain': Name of missing skill.
     * 'severity': 'Critical', 'High', or 'Medium'.
     * 'why_it_matters': Why employer needs this for {target_role_str}.
     * 'current_resume_status': What resume currently shows.
     * 'how_to_improve': Actionable instructions to study and master this.
     * 'recommended_projects_or_actions': Concrete hands-on projects/exercises to build.
     * 'talking_points': Practical advice on how candidate can speak to adjacent skills in interview.
11. 'matched_skills': Duplicate of skills_analysis.matched_skills for root compatibility.
12. 'missing_skills': Duplicate of skills_analysis.missing_skills for root compatibility.
13. 'match_score': Same as overall_match_score.
14. 'tailored_focus_areas': 3-5 critical areas the interview should evaluate.
15. 'recommended_technical_questions': 4 to 6 nuanced technical questions directly referencing candidate's real resume projects, metrics, and tools tested against JD expectations.
16. 'recommended_gap_probing_questions': 3 to 5 scenario/behavioral questions probing missing requirements.
17. 'improvement_roadmap': 3-phase strategic roadmap (Phase 1: Rapid Fundamentals, Phase 2: Portfolio PoC, Phase 3: Interview Articulation).
"""
            result = parse_structured_output(llm, prompt, ComprehensiveResumeAnalysis, fallback_data)
            return result.model_dump()
        except Exception as e:
            logger.warning(f"LLM comprehensive resume analysis failed ({e}). Using robust fallback.")
            return fallback_data

    @staticmethod
    def analyze_gap(resume_text: str, jd_text: str, target_role: Optional[str] = None) -> Dict[str, Any]:
        """
        Compare Resume and Job Description using LLM analysis.
        Returns GapAnalysisOutput-compatible dictionary with rich insights.
        """
        return ResumeJDService.analyze_resume_and_jd(resume_text, jd_text, target_role=target_role)

