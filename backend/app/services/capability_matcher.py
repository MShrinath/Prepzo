import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

ROLE_PROFILES = {
    "Software Development Engineer (SDE / Backend)": {
        "required_skills": ["python", "fastapi", "sql", "postgresql", "redis", "docker", "microservices", "system design", "rest"],
        "description": "Designs, implements, and maintains scalable backend services, distributed systems, and low-latency APIs.",
        "icon": "Code2",
    },
    "Full Stack Developer": {
        "required_skills": ["javascript", "typescript", "react", "node.js", "python", "sql", "rest", "git", "html", "css"],
        "description": "Bridges frontend user experiences with performant backend APIs, state management, and modern component systems.",
        "icon": "Layers",
    },
    "DevOps & Cloud Engineer": {
        "required_skills": ["docker", "kubernetes", "aws", "ci/cd", "terraform", "linux", "prometheus", "grafana", "nginx"],
        "description": "Automates cloud infrastructure, manages Kubernetes clusters, CI/CD delivery pipelines, and production reliability.",
        "icon": "Cloud",
    },
    "AI / Machine Learning Engineer": {
        "required_skills": ["python", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "rag", "docker", "fastapi"],
        "description": "Develops production machine learning models, fine-tunes LLMs, and builds real-time inference and retrieval pipelines.",
        "icon": "Cpu",
    },
    "Data Analyst / Data Engineer": {
        "required_skills": ["sql", "python", "pandas", "snowflake", "databricks", "etl", "data warehouse", "tableau", "dbt"],
        "description": "Transforms high-volume transaction data into analytical data warehouses, ETL pipelines, and executive dashboards.",
        "icon": "Database",
    },
    "Site Reliability Engineer (SRE)": {
        "required_skills": ["linux", "kubernetes", "docker", "aws", "prometheus", "grafana", "microservices", "incident management", "system design"],
        "description": "Ensures uptime, latency SLOs, fault tolerance, disaster recovery, and automated incident remediation.",
        "icon": "ShieldCheck",
    },
    "Technical Product Manager": {
        "required_skills": ["product management", "roadmap", "user stories", "kpis", "agile", "scrum", "system design", "stakeholder management"],
        "description": "Defines product requirements, aligns cross-functional engineering teams, and drives feature roadmaps from concept to release.",
        "icon": "Briefcase",
    },
}


class CapabilityMatcher:
    @staticmethod
    def evaluate_role_capabilities(
        candidate_skills: List[str],
        experience_years: int = 2,
        projects: List[Dict[str, Any]] = None,
        bio: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Evaluate candidate readiness across industry roles based on recognized skills,
        project tech stacks, experience years, and bio.
        """
        projects = projects or []
        combined_text = (bio + " " + " ".join(candidate_skills)).lower()

        # Collect project tech stack skills
        project_skills = set()
        for p in projects:
            techs = p.get("technologies") or []
            if isinstance(techs, str):
                import json
                try:
                    techs = json.loads(techs)
                except Exception:
                    techs = [techs]
            for t in techs:
                project_skills.add(str(t).lower())

        candidate_skill_set = {s.lower() for s in candidate_skills} | project_skills

        results = []
        for role_name, role_info in ROLE_PROFILES.items():
            req_skills = role_info["required_skills"]
            matched = []
            missing = []

            for rs in req_skills:
                # Direct match or substring match in skills/bio
                if rs in candidate_skill_set or any(rs in s for s in candidate_skill_set) or (rs in combined_text):
                    matched.append(rs.upper() if len(rs) <= 3 else rs.title())
                else:
                    missing.append(rs.upper() if len(rs) <= 3 else rs.title())

            # Base score from matched skills
            skill_ratio = len(matched) / max(1, len(req_skills))
            # Experience booster (up to +15%)
            exp_boost = min(15, experience_years * 3)
            # Projects booster (up to +10% if candidate has relevant project)
            proj_boost = 10 if (len(projects) > 0 and len(matched) >= 2) else (5 if len(projects) > 0 else 0)

            score = int(round((skill_ratio * 75) + exp_boost + proj_boost))
            score = max(25, min(96, score))

            if score >= 80:
                status = "Interview Ready"
                badge_color = "emerald"
            elif score >= 65:
                status = "Strong Candidate"
                badge_color = "blue"
            elif score >= 50:
                status = "Minor Ramp-Up Needed"
                badge_color = "amber"
            else:
                status = "Foundational Growth"
                badge_color = "slate"

            results.append({
                "role_name": role_name,
                "score": score,
                "status": status,
                "badge_color": badge_color,
                "description": role_info["description"],
                "icon": role_info["icon"],
                "matched_skills": matched,
                "missing_skills": missing[:4],
                "fit_summary": f"Matches {len(matched)} of {len(req_skills)} core requirements with {experience_years} years demonstrated experience.",
            })

        # Sort by score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    @staticmethod
    def generate_profile_summary(
        name: str,
        target_role: str,
        experience_years: int,
        skills: List[str],
        projects: List[Dict[str, Any]],
        bio: str = ""
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive profile summary and project analytics.
        """
        projects = projects or []
        project_count = len(projects)

        all_techs = []
        quantifiable_metrics = []
        for p in projects:
            techs = p.get("technologies") or []
            if isinstance(techs, str):
                import json
                try:
                    techs = json.loads(techs)
                except Exception:
                    techs = [techs]
            all_techs.extend(techs)

            impact = p.get("measurable_impact")
            if impact and len(str(impact).strip()) > 5:
                quantifiable_metrics.append(str(impact))

        unique_techs = list(dict.fromkeys([t.upper() if len(t) <= 3 else t.title() for t in all_techs]))
        primary_skills = skills[:6] if skills else unique_techs[:6]

        seniority = "Mid-Level Professional"
        if experience_years >= 5:
            seniority = "Senior / Lead Specialist"
        elif experience_years <= 1:
            seniority = "Associate / Entry Specialist"

        summary_text = (
            f"{name} is an experienced {target_role} with {experience_years}+ years of practical software engineering experience. "
            f"Demonstrates strong proficiency across {', '.join(primary_skills[:4]) if primary_skills else 'core backend systems'} with {project_count} validated production project(s). "
            f"Technical background emphasizes scalable microservices, database architecture, and performance optimization."
        )

        return {
            "seniority_level": seniority,
            "executive_summary": summary_text,
            "project_stats": {
                "total_projects": project_count,
                "distinct_technologies": len(unique_techs),
                "technologies_used": unique_techs,
                "quantifiable_impact_highlights": quantifiable_metrics[:3],
            },
        }
