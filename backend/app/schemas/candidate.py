from typing import List, Optional
from pydantic import BaseModel, Field


class SkillBase(BaseModel):
    skill_name: str
    proficiency: str = "Intermediate"
    category: str = "Technical"


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: List[str] = []
    role: Optional[str] = None
    measurable_impact: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: Optional[str] = None

    class Config:
        from_attributes = True


class CandidateProfileBase(BaseModel):
    candidate_id: str
    name: str
    email: Optional[str] = None
    target_role: str = "SDE"
    experience_years: int = 1
    education: Optional[str] = None
    bio: Optional[str] = None
    target_competencies: List[str] = ["Problem Solving", "Communication", "Technical Knowledge"]


class CandidateProfileCreate(CandidateProfileBase):
    skills: List[SkillCreate] = []
    projects: List[ProjectCreate] = []


class CandidateProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    target_role: Optional[str] = None
    experience_years: Optional[int] = None
    education: Optional[str] = None
    bio: Optional[str] = None
    target_competencies: Optional[List[str]] = None
    skills: Optional[List[SkillCreate]] = None
    projects: Optional[List[ProjectCreate]] = None


class CandidateProfileResponse(CandidateProfileBase):
    id: Optional[str] = None
    skills: List[SkillResponse] = []
    projects: List[ProjectResponse] = []
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
