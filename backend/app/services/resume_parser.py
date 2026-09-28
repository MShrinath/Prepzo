import re
import io
from typing import Dict, Any, List, Optional
from pypdf import PdfReader


COMMON_SKILLS = [
    "python", "fastapi", "django", "flask", "javascript", "typescript", "react", "vue", "angular",
    "node.js", "express", "sql", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes",
    "aws", "azure", "gcp", "git", "ci/cd", "terraform", "graphql", "rest", "linux", "c++", "java",
    "golang", "rust", "kafka", "rabbitmq", "pandas", "numpy", "pytorch", "tensorflow", "scikit-learn",
    "system design", "microservices", "unit testing", "agile", "scrum"
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
            return f"Error extracting PDF: {str(e)}"

    @staticmethod
    def extract_skills_from_text(text: str) -> List[str]:
        """Extract normalized tech and domain skills from free-form text."""
        lowered = text.lower()
        found = []
        for skill in COMMON_SKILLS:
            # Match whole word
            pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"
            if re.search(pattern, lowered):
                # Preserve nice display casing
                found.append(skill.upper() if len(skill) <= 3 else skill.title())
        return list(dict.fromkeys(found))

    @staticmethod
    def parse_resume(text: str) -> Dict[str, Any]:
        """Parse structured elements from resume text."""
        skills = ResumeJDService.extract_skills_from_text(text)
        
        # Simple heuristic extraction of email
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        email = email_match.group(0) if email_match else None

        # Look for years of experience
        exp_match = re.search(r"(\d+)\+?\s*(?:years|yrs)\s+(?:of\s+)?experience", text, re.IGNORECASE)
        years = int(exp_match.group(1)) if exp_match else 2

        # Extract project mentions or experience lines
        projects = []
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for i, line in enumerate(lines):
            if any(term in line.lower() for term in ["project:", "project -", "built a", "developed a", "engineered"]):
                projects.append(line[:120])
                if len(projects) >= 4:
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
        
        # Seniority detection
        lowered = jd_text.lower()
        seniority = "Mid-Level"
        if any(w in lowered for w in ["senior", "lead", "staff", "principal"]):
            seniority = "Senior"
        elif any(w in lowered for w in ["junior", "entry", "associate", "intern"]):
            seniority = "Junior"

        return {
            "raw_text": jd_text,
            "required_skills": skills,
            "seniority": seniority,
        }

    @staticmethod
    def analyze_gap(resume_text: str, jd_text: str) -> Dict[str, Any]:
        """
        Compare Resume and Job Description:
        - Identify matched skills
        - Identify missing skills (in JD but absent in resume)
        - Generate tailored technical questions grounded strictly in resume facts
        - Generate gap-probing behavioral questions for missing skills
        """
        resume_data = ResumeJDService.parse_resume(resume_text)
        jd_data = ResumeJDService.parse_job_description(jd_text)

        resume_skills_set = {s.lower() for s in resume_data["skills"]}
        jd_skills_set = {s.lower() for s in jd_data["required_skills"]}

        matched = [s for s in jd_data["required_skills"] if s.lower() in resume_skills_set]
        missing = [s for s in jd_data["required_skills"] if s.lower() not in resume_skills_set]

        # Generate strictly grounded technical questions based on resume claims
        grounded_technical_questions = []
        for skill in matched[:3]:
            grounded_technical_questions.append(
                f"Your profile highlights experience with {skill}. Can you walk me through how you designed and implemented a production solution using {skill}, and what specific bottlenecks you encountered?"
            )
        if not grounded_technical_questions:
            grounded_technical_questions.append(
                "Can you walk me through the most technically challenging software architecture you have designed or maintained, detailing your individual contributions?"
            )

        # Generate behavioral questions probing the JD gaps
        gap_probing_questions = []
        for gap_skill in missing[:2]:
            gap_probing_questions.append(
                f"This role emphasizes {gap_skill}, which is not prominently featured on your resume. How have you approached learning or working with {gap_skill}, or similar technologies, when required for a critical project?"
            )
        gap_probing_questions.append(
            "Describe a situation where the project requirements demanded a technology stack or domain you had little prior experience with. How did you get up to speed and deliver on time?"
        )

        return {
            "matched_skills": matched,
            "missing_skills": missing,
            "experience_level_match": jd_data["seniority"],
            "tailored_focus_areas": missing + [f"Deep dive into {m}" for m in matched[:2]],
            "recommended_technical_questions": grounded_technical_questions,
            "recommended_gap_probing_questions": gap_probing_questions,
        }
