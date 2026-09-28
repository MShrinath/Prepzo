import os
import sys
import json
from pathlib import Path

# Add backend directory to sys.path so app imports work
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.database.connection import SessionLocal, init_db
from app.models.entities import (
    InterviewQuestion,
    CandidateProfile,
    CandidateSkill,
    CandidateProject,
)


def seed():
    print("Initializing database tables...")
    init_db()

    db = SessionLocal()
    try:
        # 1. Seed Questions from JSON
        questions_file = Path(__file__).resolve().parent.parent / "data" / "processed" / "questions.json"
        if questions_file.exists():
            with open(questions_file, "r", encoding="utf-8") as f:
                questions_data = json.load(f)

            count = 0
            for q in questions_data:
                existing = db.query(InterviewQuestion).filter_by(question_id=q["question_id"]).first()
                if not existing:
                    question_obj = InterviewQuestion(
                        question_id=q["question_id"],
                        question=q["question"],
                        mode=json.dumps(q.get("mode", ["role_practice"])),
                        role=q.get("role", "SDE"),
                        competency=q.get("competency", "Problem Solving"),
                        difficulty=q.get("difficulty", "medium"),
                        question_type=q.get("question_type", "technical"),
                        category=q.get("category", "General"),
                        tags=json.dumps(q.get("tags", [])),
                        expected_competencies=json.dumps(q.get("expected_competencies", [])),
                        evaluation_criteria=json.dumps(q.get("evaluation_criteria", [])),
                        follow_up_template=q.get("follow_up_template"),
                        is_preset=True,
                    )
                    db.add(question_obj)
                    count += 1
            db.commit()
            print(f"Seeded {count} new interview questions from {questions_file.name}.")

        # 2. Seed Default Candidate Profile (candidate_001)
        candidate = db.query(CandidateProfile).filter_by(candidate_id="candidate_001").first()
        if not candidate:
            print("Creating sample candidate profile 'candidate_001'...")
            candidate = CandidateProfile(
                candidate_id="candidate_001",
                name="Alex Taylor",
                email="alex.taylor@example.com",
                target_role="SDE",
                experience_years=2,
                education="B.S. in Computer Science",
                bio="Passionate software engineer experienced with Python, FastAPI, relational databases, and distributed backend services.",
                target_competencies=json.dumps([
                    "Problem Solving",
                    "Technical Depth & Domain Mastery",
                    "Communication & Clarity",
                    "Ownership & Accountability",
                ]),
            )
            db.add(candidate)
            db.flush()

            # Add skills
            skills_data = [
                ("Python", "Advanced", "Technical"),
                ("FastAPI", "Advanced", "Technical"),
                ("PostgreSQL", "Intermediate", "Technical"),
                ("Docker", "Intermediate", "Technical"),
                ("React", "Beginner", "Technical"),
                ("REST APIs", "Advanced", "Technical"),
            ]
            for s_name, prof, cat in skills_data:
                skill = CandidateSkill(
                    candidate_id="candidate_001",
                    skill_name=s_name,
                    proficiency=prof,
                    category=cat,
                )
                db.add(skill)

            # Add sample project
            project = CandidateProject(
                candidate_id="candidate_001",
                name="High-Throughput Analytics Gateway",
                description="Engineered a microservice in FastAPI to ingest telemetry events and batch process database transactions.",
                technologies=json.dumps(["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"]),
                role="Lead Backend Developer",
                measurable_impact="Reduced average endpoint latency by 45% and handled up to 3,500 requests per second.",
            )
            db.add(project)
            db.commit()
            print("Default candidate 'candidate_001' seeded successfully.")
        else:
            print("Candidate 'candidate_001' already exists.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
