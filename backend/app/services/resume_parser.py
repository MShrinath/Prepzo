import re
import io
import logging
from typing import Dict, Any, List, Optional
from pypdf import PdfReader

from app.llm.provider import get_llm, parse_structured_output
from app.schemas.agent_evaluations import GapAnalysisOutput

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
        """Parse structured elements from resume text."""
        skills = ResumeJDService.extract_skills_from_text(text)
        
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        email = email_match.group(0) if email_match else None

        exp_match = re.search(r"(\d+)\+?\s*(?:years|yrs)\s+(?:of\s+)?experience", text, re.IGNORECASE)
        years = int(exp_match.group(1)) if exp_match else 2

        projects = []
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines:
            if any(term in line.lower() for term in ["project:", "project -", "built a", "developed a", "engineered", "designed a", "led "]):
                projects.append(line[:120])
                if len(projects) >= 5:
                    break

        return {
            "raw_text": text,
            "email": email,
            "skills": skills,
            "experience_years": years,
            "detected_projects": projects,
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
    def analyze_gap(resume_text: str, jd_text: str, target_role: Optional[str] = None) -> Dict[str, Any]:
        """
        Compare Resume and Job Description using an LLM:
        - Identifies matched skills and competencies
        - Identifies missing skills and requirements from the JD
        - Assesses seniority and experience level match
        - Outlines tailored focus areas
        - Generates role-grounded technical questions (specific to the resume & JD)
        - Generates gap-probing behavioral/scenario questions
        """
        target_role_str = target_role or "Target Role"
        clean_resume = (resume_text or "").strip()
        clean_jd = (jd_text or "").strip()

        # Heuristic baseline fallback
        resume_data = ResumeJDService.parse_resume(clean_resume)
        jd_data = ResumeJDService.parse_job_description(clean_jd)

        resume_skills_set = {s.lower() for s in resume_data["skills"]}
        matched = [s for s in jd_data["required_skills"] if s.lower() in resume_skills_set]
        missing = [s for s in jd_data["required_skills"] if s.lower() not in resume_skills_set]

        fallback_tech_q = []
        for s in matched[:3]:
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

        calc_score = int(max(35, min(95, round((len(matched) / max(1, len(matched) + len(missing))) * 100))))
        fallback_data = {
            "matched_skills": matched or ["Core Problem Solving", "Domain Fundamentals"],
            "missing_skills": missing or ["Advanced Architecture & Scale Verification"],
            "experience_level_match": f"Candidate has approximately {resume_data['experience_years']} YOE vs {jd_data['seniority']} requirements.",
            "tailored_focus_areas": [
                f"Deep dive into {m}" for m in (matched[:2] if matched else ["Architecture & Implementation"])
            ] + [
                f"Probe proficiency in {ms}" for ms in (missing[:2] if missing else ["Domain-Specific Tools"])
            ],
            "recommended_technical_questions": fallback_tech_q,
            "recommended_gap_probing_questions": fallback_gap_q,
            "role_fit_summary": f"Candidate demonstrates foundational competencies for {target_role_str}. Key focus is validating depth in claimed tools and probing unfamiliar requirements.",
            "match_score": calc_score,
        }

        # Attempt LLM evaluation
        try:
            llm = get_llm(temperature=0.2)
            prompt = f"""You are a Principal Hiring Manager and Staff Interviewer assessing a candidate for the role: "{target_role_str}".
Evaluate the Candidate's Resume against the Job Description with rigorous precision.

CANDIDATE RESUME:
\"\"\"
{clean_resume[:4000]}
\"\"\"

TARGET JOB DESCRIPTION:
\"\"\"
{clean_jd[:3000]}
\"\"\"

Instructions:
1. 'matched_skills': Specific tools, languages, frameworks, architectural concepts, and domain capabilities explicitly supported by the resume that satisfy the JD.
2. 'missing_skills': Requirements, tools, scale milestones, or responsibilities emphasized in the JD that are absent, weak, or unproven in the resume. Be clear and specific about each gap.
3. 'experience_level_match': Candid assessment of candidate's seniority vs JD requirements (Junior, Mid, Senior, Staff/Lead).
4. 'tailored_focus_areas': 3 to 5 critical areas the interview should evaluate.
5. 'recommended_technical_questions': 4 to 6 nuanced, highly specific technical/domain questions directly referencing the candidate's actual projects, tools, metrics, or architecture from the resume and testing them against the bar demanded by the JD. (DO NOT use boilerplate phrasing like 'Your profile highlights experience with X...').
6. 'recommended_gap_probing_questions': 3 to 5 insightful scenario or behavioral questions probing how the candidate handles the missing requirements or unfamiliar domains from the JD.
7. 'role_fit_summary': A clear 2-3 sentence executive summary of candidate fit and interview focus.
8. 'match_score': An integer (0-100) reflecting how well the resume fulfills the job description requirements.
"""
            result = parse_structured_output(llm, prompt, GapAnalysisOutput, fallback_data)
            return result.model_dump()
        except Exception as e:
            logger.warning(f"LLM gap analysis failed or not available ({e}). Using heuristic fallback.")
            return fallback_data

