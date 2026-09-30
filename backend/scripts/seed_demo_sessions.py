import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import datetime
from app.database.connection import SessionLocal
from app.models.entities import (
    CandidateProfile,
    InterviewSession,
    CandidateResponse,
    CommunicationEvaluation,
    ContentEvaluation,
    STAREvaluation,
    CoachingFeedback,
    RecurringGap,
    ImprovementPlan,
)


def seed_demo_sessions():
    db = SessionLocal()
    try:
        cand_id = "candidate_001"
        profile = db.query(CandidateProfile).filter_by(candidate_id=cand_id).first()
        if not profile:
            profile = CandidateProfile(
                candidate_id=cand_id,
                name="Sai Revanth",
                email="sai.revanth@example.com",
                target_role="Software Engineer",
                experience_years=3,
                target_competencies=json.dumps([
                    "Problem Solving",
                    "Technical Depth & Domain Mastery",
                    "Communication & Clarity",
                    "Ownership & Accountability",
                ]),
                bio="Backend Software Engineer with hands-on experience designing high-throughput distributed systems in Python, FastAPI, and PostgreSQL."
            )
            db.add(profile)
            db.commit()

        # Remove existing demo sessions if any so we can re-seed cleanly
        demo_ids = ["sess_demo_sde_01", "sess_demo_hr_02", "sess_demo_resume_03", "sess_demo_design_04"]
        for d_id in demo_ids:
            old_s = db.query(InterviewSession).filter_by(session_id=d_id).first()
            if old_s:
                db.delete(old_s)
        db.commit()

        now = datetime.datetime.utcnow()

        demo_data = [
            {
                "session_id": "sess_demo_sde_01",
                "target_role": "Software Engineer",
                "mode": "role_practice",
                "difficulty": "medium",
                "competency": "Problem Solving & System Architecture",
                "status": "completed",
                "created_at": now - datetime.timedelta(minutes=5),
                "question": "How would you optimize a Python API endpoint that is experiencing high latency under heavy production traffic?",
                "response": "In my previous role at a fintech startup, our payment verification endpoint was hitting 2.8s response times during peak flash sales. As lead backend engineer, I began by attaching cProfile and py-spy to capture flamegraphs in staging under simulated load. The profiling revealed two major bottlenecks: a classic N+1 ORM query fetching user ledger records, and unindexed foreign key lookups on the transactions table. I refactored the ORM calls to use eager loading with select_related, added composite B-Tree indexes on (user_id, created_at), and introduced a Redis caching layer with a 60-second TTL for idempotent balance checks. This reduced average endpoint latency from 2.8s to 140ms (a 95% reduction) and scaled throughput from 250 to 3,200 requests per second.",
                "overall_score": 89.5,
                "comm_score": 9.0,
                "content_score": 9.0,
                "star_score": 9.0,
                "wpm": 138.0,
                "fillers": 0,
                "advice": [
                    "Lead with the punchline: state the problem scope and architecture within the first 20 seconds.",
                    "When discussing Redis caching, proactively address cache stampede and TTL eviction strategies.",
                    "Highlight post-deployment monitoring using Datadog or Prometheus metrics."
                ],
                "follow_up": "If the Redis cache experiences a cold restart during peak traffic, what stampede prevention pattern would you apply to avoid cascading database exhaustion?",
            },
            {
                "session_id": "sess_demo_hr_02",
                "target_role": "Software Engineer (HR Round)",
                "mode": "hr",
                "difficulty": "medium",
                "competency": "Conflict Resolution & Executive Communication",
                "status": "completed",
                "created_at": now - datetime.timedelta(minutes=15),
                "question": "Tell me about a time you strongly disagreed with a senior team member on an architectural decision. How did you handle it?",
                "response": "During our migration to microservices, a principal engineer proposed an immediate full-cutover, whereas I advocated for a phased strangler fig pattern to mitigate production downtime risks. Rather than escalating emotionally, I scheduled a 30-minute whiteboard session with benchmarking data from our past releases. I demonstrated how a staged rollout with canary traffic would let us validate latency increments without exposing 100% of users to potential rollbacks. We mutually agreed on the phased plan; the migration finished 2 weeks early with zero customer-facing downtime.",
                "overall_score": 87.0,
                "comm_score": 9.0,
                "content_score": 8.5,
                "star_score": 9.0,
                "wpm": 136.0,
                "fillers": 0,
                "advice": [
                    "Excellent personal agency using 'I scheduled' and 'I demonstrated' rather than passive 'we'.",
                    "Conclude by highlighting long-term relationship building with the senior peer.",
                    "Mention how this collaborative outcome influenced team documentation or post-mortems."
                ],
                "follow_up": "How did this experience shape how you approach cross-functional alignment on subsequent initiatives?",
            },
            {
                "session_id": "sess_demo_resume_03",
                "target_role": "Full Stack Developer",
                "mode": "resume_jd",
                "difficulty": "medium",
                "competency": "Bridge Resume to Cloud-Native JD Requirements",
                "status": "completed",
                "created_at": now - datetime.timedelta(minutes=30),
                "question": "The job description requires hands-on Kubernetes and cloud-native CI/CD, which is not prominent in your background. How would you approach bridging this gap on day one?",
                "response": "While my production experience is primarily rooted in Docker and AWS ECS container deployments, the core orchestration primitives—container lifecycle, rolling deployments, health checks, and service mesh routing—directly translate to Kubernetes Pods, Deployments, and Ingress controllers. To accelerate my ramp-up, I built a local Minikube cluster deploying my FastAPI microservices with Helm charts, and wrote a GitHub Actions workflow that executes automated linting, test suites, and staging deploys. This foundation allows me to deliver on day one while rapidly mastering cluster observability.",
                "overall_score": 83.5,
                "comm_score": 8.5,
                "content_score": 8.0,
                "star_score": 8.5,
                "wpm": 132.0,
                "fillers": 1,
                "advice": [
                    "Solid transferable architecture framing connecting Docker/ECS concepts to Kubernetes.",
                    "Highlight familiarity with Helm templates and ConfigMaps/Secrets management.",
                    "Discuss familiarity with cluster debugging tools like kubectl describe and k9s."
                ],
                "follow_up": "How would you debug a Kubernetes Pod stuck in CrashLoopBackOff during an automated deployment?",
            },
            {
                "session_id": "sess_demo_design_04",
                "target_role": "Senior Backend Engineer",
                "mode": "role_practice",
                "difficulty": "hard",
                "competency": "Distributed Transactions & Idempotency",
                "status": "completed",
                "created_at": now - datetime.timedelta(minutes=45),
                "question": "How do you design an idempotent payment processing system that guarantees exactly-once semantics even during network drops and third-party retry storms?",
                "response": "I enforce idempotency at the API gateway layer using client-generated idempotency keys with unique UUIDv4 tokens stored in Redis with an atomic SETNX lock and a 120-second lease time. Incoming requests check the cache: if a processing lock is active, subsequent requests receive a 409 Conflict or 202 Accepted polling state. Once the transaction completes in PostgreSQL with strict serializable isolation, we store the finalized payload in the database. Any repeated request with the same idempotency key returns the pre-computed receipt instantly without re-billing the user.",
                "overall_score": 91.5,
                "comm_score": 9.0,
                "content_score": 9.5,
                "star_score": 9.0,
                "wpm": 140.0,
                "fillers": 0,
                "advice": [
                    "Masterclass explanation of SETNX atomic locking and PostgreSQL serializable transactions.",
                    "Consider mentioning distributed tracing (e.g., OpenTelemetry correlation IDs) across payment webhook retries.",
                    "Proactively mention dead-letter queue (DLQ) reconciliation for unacknowledged events."
                ],
                "follow_up": "If the third-party payment gateway takes 45 seconds to respond and times out at the network boundary, how do you prevent ghost transactions?",
            }
        ]

        for s_info in demo_data:
            session = InterviewSession(
                session_id=s_info["session_id"],
                candidate_id=cand_id,
                mode=s_info["mode"],
                target_role=s_info["target_role"],
                difficulty=s_info["difficulty"],
                competency=s_info["competency"],
                status="completed",
                current_question=s_info["question"],
                question_count=1,
                questions_asked=1,
                questions_history=json.dumps([s_info["question"]]),
                created_at=s_info["created_at"],
            )
            db.add(session)
            db.flush()

            response = CandidateResponse(
                session_id=session.session_id,
                question_id=f"q_{session.session_id}",
                question_text=s_info["question"],
                response_type="voice",
                response_text=s_info["response"],
                transcript=s_info["response"],
                duration_seconds=75.0,
                speaking_rate=s_info["wpm"],
                filler_words_count=s_info["fillers"],
                pause_count=1,
                created_at=s_info["created_at"],
            )
            db.add(response)
            db.flush()

            # Evaluations
            db.add(CommunicationEvaluation(
                response_id=response.id,
                clarity_score=int(s_info["comm_score"]),
                conciseness_score=int(s_info["comm_score"]),
                structure_score=int(s_info["comm_score"]),
                communication_quality_score=int(s_info["comm_score"]),
                filler_words_score=s_info["fillers"],
                strengths=json.dumps(["Structured delivery starting with context and ending with verified metrics", "Zero hesitation pauses"]),
                weaknesses=json.dumps(["Could introduce deliberate 2-second pauses before complex trade-offs"]),
                evidence=json.dumps(["Maintained steady vocal cadence at optimal speaking rate"]),
            ))

            db.add(ContentEvaluation(
                response_id=response.id,
                relevance_score=int(s_info["content_score"]),
                correctness_score=int(s_info["content_score"]),
                completeness_score=int(s_info["content_score"]),
                technical_depth_score=int(s_info["content_score"]),
                evidence_quality_score=int(s_info["content_score"]),
                strengths=json.dumps(["Cited concrete production tools, database indexes, and architecture patterns", "Verifiable quantitative impact"]),
                gaps=json.dumps(["Could briefly address secondary fallback alternatives"]),
            ))

            db.add(STAREvaluation(
                response_id=response.id,
                applicable=True,
                situation_score=int(s_info["star_score"]),
                task_score=int(s_info["star_score"]),
                action_score=int(s_info["star_score"]),
                result_score=int(s_info["star_score"]),
                situation_evidence="Explicitly framed urgency, scale, and background challenge.",
                task_evidence="Delineated individual responsibility and technical ownership.",
                action_evidence="Walked through systematic diagnostic interventions and architectural implementation.",
                result_evidence="Concluded with verifiable numbers, latency deltas, and throughput metrics.",
                restructuring_recommendation="Answer adhered cleanly to STAR methodology.",
            ))

            db.add(CoachingFeedback(
                response_id=response.id,
                session_id=session.session_id,
                overall_score=s_info["overall_score"],
                strengths=json.dumps(["High domain depth with actionable metrics", "Clear personal agency throughout"]),
                improvement_areas=json.dumps(["Proactively articulate secondary architectural trade-offs"]),
                actionable_advice=json.dumps(s_info["advice"]),
                evidence_items=json.dumps([
                    {
                        "issue": "Proactive Trade-off Articulation",
                        "severity": "low",
                        "evidence": "Candidate successfully solved primary bottleneck.",
                        "recommendation": "Mention why you chose this design over 1 alternative."
                    }
                ]),
                improved_answer_structure=f"Exemplary structure for '{s_info['question'][:40]}...': Start with 15s context, 45s personal technical intervention, and 20s verified business/performance impact.",
                follow_up_question=s_info["follow_up"],
            ))

        # Seed recurring gaps for candidate
        db.query(RecurringGap).filter_by(candidate_id=cand_id).delete()
        db.add(RecurringGap(
            candidate_id=cand_id,
            gap_category="Proactive System Trade-offs",
            description="Responses demonstrate deep execution but can further contrast alternative design options before settling on the chosen architecture.",
            occurrence_count=2,
            status="improving",
        ))
        db.add(RecurringGap(
            candidate_id=cand_id,
            gap_category="Cache Stampede Mitigation",
            description="When architecting caching layers, articulate stampede locking and stale-while-revalidate patterns.",
            occurrence_count=2,
            status="active",
        ))

        # Seed 7-Day Improvement Plan
        db.query(ImprovementPlan).filter_by(candidate_id=cand_id).delete()
        plan_items = [
            {"day": 1, "focus": "Executive Pitch & Vocal Cadence", "task": "Practice 90s intro at 135 WPM with zero filler pauses.", "tips": "Record yourself using the vocal HUD."},
            {"day": 2, "focus": "STAR Action Ownership ('I' vs 'We')", "task": "Rehearse 3 behavioral stories highlighting personal decisions.", "tips": "Replace 'we decided' with 'I spearheaded and aligned the team'."},
            {"day": 3, "focus": "Architectural Trade-offs & Profiling", "task": "Practice explaining N+1 ORM fixes and indexing.", "tips": "Mention flamegraphs and composite indexing."},
            {"day": 4, "focus": "Distributed Systems & Idempotency", "task": "Explain Redis SETNX atomic locking and retry storms.", "tips": "Structure: Client Token -> Cache Check -> Atomic Execution -> Receipt."},
            {"day": 5, "focus": "Failure Modes & Edge Cases", "task": "Walk through database connection exhaustion and circuit breakers.", "tips": "State latency thresholds and fallback degradations."},
            {"day": 6, "focus": "Cross-Functional Consensus Building", "task": "Rehearse navigating an engineering disagreement with senior staff.", "tips": "Emphasize data-driven whiteboard consensus."},
            {"day": 7, "focus": "Full Mock Simulation & Review", "task": "Complete a 4-question adaptive role practice session.", "tips": "Target 85%+ overall readiness score."}
        ]
        db.add(ImprovementPlan(
            candidate_id=cand_id,
            title="7-Day Executive Engineering & Communication Roadmap",
            duration_days=7,
            overview="Targeted curriculum synthesizing performance data across your recent SDE, HR Leadership, and System Architecture interviews.",
            items=json.dumps(plan_items)
        ))

        db.commit()
        print("Demo sessions successfully seeded!")
    except Exception as e:
        print("Error seeding demo sessions:", e)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_sessions()
