import json
import logging
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger("InterviewCoachDB")

# Resolve canonical database URL for SQLite to avoid cwd discrepancy
db_url = settings.database_url
connect_args = {}
if db_url.startswith("sqlite:///./") or db_url == "sqlite:///interview_coach.db":
    root_dir = Path(__file__).resolve().parents[3]
    db_file = root_dir / "interview_coach.db"
    db_url = f"sqlite:///{db_file.as_posix()}"
    connect_args = {"check_same_thread": False}
elif db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_defaults():
    """Ensure candidate_001 and default question bank exist in the database."""
    from app.models.entities import CandidateProfile, CandidateSkill, CandidateProject, InterviewQuestion

    db = SessionLocal()
    try:
        # 1. Seed candidate_001 if missing
        candidate = db.query(CandidateProfile).filter_by(candidate_id="candidate_001").first()
        if not candidate:
            logger.info("Auto-seeding default profile 'candidate_001'...")
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

            skills_data = [
                ("Python", "Advanced", "Technical"),
                ("FastAPI", "Advanced", "Technical"),
                ("PostgreSQL", "Intermediate", "Technical"),
                ("Docker", "Intermediate", "Technical"),
                ("React", "Beginner", "Technical"),
                ("REST APIs", "Advanced", "Technical"),
            ]
            for s_name, prof, cat in skills_data:
                db.add(CandidateSkill(
                    candidate_id="candidate_001",
                    skill_name=s_name,
                    proficiency=prof,
                    category=cat,
                ))

            db.add(CandidateProject(
                candidate_id="candidate_001",
                name="High-Throughput Analytics Gateway",
                description="Engineered a microservice in FastAPI to ingest telemetry events and batch process database transactions.",
                technologies=json.dumps(["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"]),
                role="Lead Backend Developer",
                measurable_impact="Reduced average endpoint latency by 45% and handled up to 3,500 requests per second.",
            ))
            db.commit()

        # 2. Seed question bank if empty
        q_count = db.query(InterviewQuestion).count()
        if q_count == 0:
            root_dir = Path(__file__).resolve().parents[3]
            q_file = root_dir / "data" / "processed" / "questions.json"
            if not q_file.exists():
                q_file = Path(__file__).resolve().parents[2] / "data" / "processed" / "questions.json"

            if q_file.exists():
                logger.info(f"Auto-seeding questions from {q_file}...")
                with open(q_file, "r", encoding="utf-8") as f:
                    questions_data = json.load(f)
                for q in questions_data:
                    db.add(InterviewQuestion(
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
                    ))
                db.commit()
    except Exception as exc:
        logger.warning(f"Auto-seeding encountered non-fatal error: {exc}")
        db.rollback()
    finally:
        db.close()


def _migrate_add_columns():
    """Safely add new columns to existing tables for development migration."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE interview_sessions ADD COLUMN question_count INTEGER DEFAULT 5",
        "ALTER TABLE interview_sessions ADD COLUMN questions_asked INTEGER DEFAULT 0",
        "ALTER TABLE interview_sessions ADD COLUMN is_conversational BOOLEAN DEFAULT 0",
        "ALTER TABLE interview_sessions ADD COLUMN questions_history TEXT DEFAULT '[]'",
        "ALTER TABLE interview_sessions ADD COLUMN current_question TEXT DEFAULT NULL",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                # Column already exists or table doesn't exist yet
                try:
                    conn.rollback()
                except Exception:
                    pass


def init_db():
    Base.metadata.create_all(bind=engine)
    _migrate_add_columns()
    seed_defaults()

