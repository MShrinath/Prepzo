import React from 'react';
import {
  Code2,
  FileText,
  Users,
  ArrowRight,
  Briefcase,
  Target,
  Award,
  AlertTriangle,
  Mic,
  Clock,
  Sparkles,
  CheckCircle2,
  Cpu,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import heroCleanImg from '../assets/hero-clean.png';

const DEMO_FALLBACK_SESSIONS = [
  {
    session_id: 'sess_demo_sde_01',
    target_role: 'Software Engineer',
    mode: 'role_practice',
    difficulty: 'medium',
    date: 'Sep 30, 12:54',
    question_text: 'How would you optimize a Python API endpoint that is experiencing high latency under heavy production traffic?',
    overall_score: 89.5,
    communication_score: 90,
    content_score: 90,
    star_score: 90,
    wpm: 138.0,
    filler_words_count: 0,
    response_excerpt: 'In my previous role at a fintech startup, our payment verification endpoint was hitting 2.8s response times during peak flash sales. As lead backend engineer, I began by attaching cProfile and py-spy to capture flamegraphs in staging under simulated load...',
    evaluation: {
      id: 'resp_demo_sde_01',
      session_id: 'sess_demo_sde_01',
      question_id: 'q_demo_sde_01',
      question_text: 'How would you optimize a Python API endpoint that is experiencing high latency under heavy production traffic?',
      response_type: 'audio',
      response_text: 'In my previous role at a fintech startup, our payment verification endpoint was hitting 2.8s response times during peak flash sales. As lead backend engineer, I began by attaching cProfile and py-spy to capture flamegraphs in staging under simulated load. The profiling revealed two major bottlenecks: a classic N+1 ORM query fetching user ledger records, and unindexed foreign key lookups on the transactions table. I refactored the ORM calls to use eager loading with select_related, added composite B-Tree indexes on (user_id, created_at), and introduced a Redis caching layer with a 60-second TTL for idempotent balance checks. This reduced average endpoint latency from 2.8s to 140ms (a 95% reduction) and scaled throughput from 250 to 3,200 requests per second.',
      speaking_rate: 138.0,
      filler_words_count: 0,
      communication_evaluation: {
        clarity_score: 9.0,
        conciseness_score: 9.0,
        structure_score: 9.0,
        communication_quality_score: 9.0,
        feedback: 'Superb conciseness and technical articulation. Structured directly around cause, diagnosis, and resolution.'
      },
      content_evaluation: {
        technical_depth_score: 9.0,
        correctness_score: 9.0,
        relevance_score: 9.0,
        feedback: 'Demonstrated deep practical proficiency with profilers (cProfile, py-spy), ORM query planning, indexing, and Redis caching.'
      },
      star_evaluation: {
        applicable: true,
        situation_score: 9.0,
        task_score: 9.0,
        action_score: 9.0,
        result_score: 9.0,
        feedback: 'Exceptional STAR delivery: clear Situation (fintech peak sales), Task (lead backend engineer), Actions (py-spy, indexes, Redis), and quantifiable Results (140ms, 3200 rps).'
      },
      coaching_feedback: {
        overall_score: 89.5,
        strengths: [
          'High technical precision referencing flamegraphs and composite indexing',
          'Quantifiable engineering impact (95% latency reduction, 3,200 rps)',
          'Crisp vocal cadence at 138 WPM with zero filler words'
        ],
        gaps: [
          'Could explicitly address cache stampede and TTL jitter in Redis',
          'Could mention automated regression load testing in CI/CD pipeline'
        ],
        actionable_advice: [
          'Lead with the punchline: state the problem scope and architecture within the first 20 seconds.',
          'When discussing Redis caching, proactively address cache stampede and TTL eviction strategies.',
          'Highlight post-deployment monitoring using Datadog or Prometheus metrics.'
        ],
        follow_up_question: 'If the Redis cache experiences a cold restart during peak traffic, what stampede prevention pattern would you apply to avoid cascading database exhaustion?'
      }
    }
  },
  {
    session_id: 'sess_demo_hr_02',
    target_role: 'Software Engineer (HR Round)',
    mode: 'hr',
    difficulty: 'medium',
    date: 'Sep 30, 12:35',
    question_text: 'Tell me about a time you strongly disagreed with a senior team member on an architectural decision. How did you handle it?',
    overall_score: 87.0,
    communication_score: 90,
    content_score: 85,
    star_score: 90,
    wpm: 136.0,
    filler_words_count: 0,
    response_excerpt: 'During our migration to microservices, a principal engineer proposed an immediate full-cutover, whereas I advocated for a phased strangler fig pattern to mitigate production downtime risks...',
    evaluation: {
      id: 'resp_demo_hr_02',
      session_id: 'sess_demo_hr_02',
      question_id: 'q_demo_hr_02',
      question_text: 'Tell me about a time you strongly disagreed with a senior team member on an architectural decision. How did you handle it?',
      response_type: 'audio',
      response_text: 'During our migration to microservices, a principal engineer proposed an immediate full-cutover, whereas I advocated for a phased strangler fig pattern to mitigate production downtime risks. Rather than escalating emotionally, I scheduled a 30-minute whiteboard session with benchmarking data from our past releases. I demonstrated how a staged rollout with canary traffic would let us validate latency increments without exposing 100% of users to potential rollbacks. We mutually agreed on the phased plan; the migration finished 2 weeks early with zero customer-facing downtime.',
      speaking_rate: 136.0,
      filler_words_count: 0,
      communication_evaluation: {
        clarity_score: 9.0,
        conciseness_score: 9.0,
        structure_score: 9.0,
        communication_quality_score: 9.0,
        feedback: 'Calm, measured, and executive communication. Emphasizes objective data over emotional friction.'
      },
      content_evaluation: {
        technical_depth_score: 8.5,
        correctness_score: 8.5,
        relevance_score: 9.0,
        feedback: 'Effective balance of architectural concepts (strangler fig, canary deployments) with interpersonal diplomacy.'
      },
      star_evaluation: {
        applicable: true,
        situation_score: 9.0,
        task_score: 9.0,
        action_score: 9.0,
        result_score: 9.0,
        feedback: 'Strong leadership narrative with proactive initiative (\'I scheduled\', \'I demonstrated\') leading to tangible outcome (zero downtime).'
      },
      coaching_feedback: {
        overall_score: 87.0,
        strengths: [
          'High emotional intelligence paired with data-driven decision making',
          'Clear STAR structure demonstrating leadership and risk mitigation',
          'Flawless speaking pace (136 WPM) conveying confidence and composure'
        ],
        gaps: [
          'Could elaborate on post-project relationship and shared alignment with the principal engineer'
        ],
        actionable_advice: [
          'Excellent personal agency using \'I scheduled\' and \'I demonstrated\' rather than passive \'we\'.',
          'Conclude by highlighting long-term relationship building with the senior peer.',
          'Mention how this collaborative outcome influenced team documentation or post-mortems.'
        ],
        follow_up_question: 'How did this experience shape how you approach cross-functional alignment on subsequent initiatives?'
      }
    }
  },
  {
    session_id: 'sess_demo_resume_03',
    target_role: 'Full Stack Developer',
    mode: 'resume_jd',
    difficulty: 'medium',
    date: 'Sep 30, 12:15',
    question_text: 'The job description requires hands-on Kubernetes and cloud-native CI/CD, which is not prominent in your background. How would you approach bridging this gap on day one?',
    overall_score: 83.5,
    communication_score: 85,
    content_score: 80,
    star_score: 85,
    wpm: 132.0,
    filler_words_count: 1,
    response_excerpt: 'While my production experience is primarily rooted in Docker and AWS ECS container deployments, the core orchestration primitives—container lifecycle, rolling deployments, health checks—directly translate to Kubernetes...',
    evaluation: {
      id: 'resp_demo_resume_03',
      session_id: 'sess_demo_resume_03',
      question_id: 'q_demo_resume_03',
      question_text: 'The job description requires hands-on Kubernetes and cloud-native CI/CD, which is not prominent in your background. How would you approach bridging this gap on day one?',
      response_type: 'audio',
      response_text: 'While my production experience is primarily rooted in Docker and AWS ECS container deployments, the core orchestration primitives—container lifecycle, rolling deployments, health checks, and service mesh routing—directly translate to Kubernetes Pods, Deployments, and Ingress controllers. To accelerate my ramp-up, I built a local Minikube cluster deploying my FastAPI microservices with Helm charts, and wrote a GitHub Actions workflow that executes automated linting, test suites, and staging deploys. This foundation allows me to deliver on day one while rapidly mastering cluster observability.',
      speaking_rate: 132.0,
      filler_words_count: 1,
      communication_evaluation: {
        clarity_score: 8.5,
        conciseness_score: 8.5,
        structure_score: 8.5,
        communication_quality_score: 8.5,
        feedback: 'Transparent, proactive framing that bridges theoretical knowledge with tangible hands-on projects.'
      },
      content_evaluation: {
        technical_depth_score: 8.0,
        correctness_score: 8.5,
        relevance_score: 8.5,
        feedback: 'Effective conceptual mapping from ECS to K8s Pods, Deployments, and Helm charts.'
      },
      star_evaluation: {
        applicable: true,
        situation_score: 8.5,
        task_score: 8.5,
        action_score: 8.5,
        result_score: 8.0,
        feedback: 'Demonstrated rapid self-learning via local Minikube setup and automated GitHub Actions pipeline.'
      },
      coaching_feedback: {
        overall_score: 83.5,
        strengths: [
          'Honest and compelling skills translation from ECS to Kubernetes',
          'Hands-on evidence with Minikube, Helm charts, and GitHub Actions',
          'Good speaking pace at 132 WPM'
        ],
        gaps: [
          'Could mention familiarity with Kubernetes troubleshooting commands (kubectl logs, describe)',
          'Could highlight cloud IAM or Secrets management'
        ],
        actionable_advice: [
          'Solid transferable architecture framing connecting Docker/ECS concepts to Kubernetes.',
          'Highlight familiarity with Helm templates and ConfigMaps/Secrets management.',
          'Discuss familiarity with cluster debugging tools like kubectl describe and k9s.'
        ],
        follow_up_question: 'How would you debug a Kubernetes Pod stuck in CrashLoopBackOff during an automated deployment?'
      }
    }
  },
  {
    session_id: 'sess_demo_design_04',
    target_role: 'Senior Backend Engineer',
    mode: 'role_practice',
    difficulty: 'hard',
    date: 'Sep 30, 11:45',
    question_text: 'How do you design an idempotent payment processing system that guarantees exactly-once semantics even during network drops and third-party retry storms?',
    overall_score: 91.5,
    communication_score: 90,
    content_score: 95,
    star_score: 90,
    wpm: 140.0,
    filler_words_count: 0,
    response_excerpt: 'I enforce idempotency at the API gateway layer using client-generated idempotency keys with unique UUIDv4 tokens stored in Redis with an atomic SETNX lock and a 120-second lease time...',
    evaluation: {
      id: 'resp_demo_design_04',
      session_id: 'sess_demo_design_04',
      question_id: 'q_demo_design_04',
      question_text: 'How do you design an idempotent payment processing system that guarantees exactly-once semantics even during network drops and third-party retry storms?',
      response_type: 'audio',
      response_text: 'I enforce idempotency at the API gateway layer using client-generated idempotency keys with unique UUIDv4 tokens stored in Redis with an atomic SETNX lock and a 120-second lease time. Incoming requests check the cache: if a processing lock is active, subsequent requests receive a 409 Conflict or 202 Accepted polling state. Once the transaction completes in PostgreSQL with strict serializable isolation, we store the finalized payload in the database. Any repeated request with the same idempotency key returns the pre-computed receipt instantly without re-billing the user.',
      speaking_rate: 140.0,
      filler_words_count: 0,
      communication_evaluation: {
        clarity_score: 9.0,
        conciseness_score: 9.0,
        structure_score: 9.0,
        communication_quality_score: 9.0,
        feedback: 'Exemplary architectural precision. Clearly separates gateway caching, atomic lock lifecycle, and persistence layers.'
      },
      content_evaluation: {
        technical_depth_score: 9.5,
        correctness_score: 9.5,
        relevance_score: 9.5,
        feedback: 'In-depth distributed systems acumen referencing atomic SETNX locks, UUIDv4 tokens, PostgreSQL serializable isolation, and HTTP status codes.'
      },
      star_evaluation: {
        applicable: true,
        situation_score: 9.0,
        task_score: 9.0,
        action_score: 9.5,
        result_score: 9.0,
        feedback: 'System architecture structured seamlessly with clear invariants and failure modes handled.'
      },
      coaching_feedback: {
        overall_score: 91.5,
        strengths: [
          'Rock-solid distributed systems design referencing SETNX atomic locks and strict serializability',
          'Precise HTTP semantics (409 Conflict, 202 Accepted, cached receipts)',
          'Flawless speaking cadence at 140 WPM with zero filler pauses'
        ],
        gaps: [
          'Could touch on distributed tracing (OpenTelemetry) or Dead Letter Queues for payment webhook retries'
        ],
        actionable_advice: [
          'Masterclass explanation of SETNX atomic locking and PostgreSQL serializable transactions.',
          'Consider mentioning distributed tracing (e.g., OpenTelemetry correlation IDs) across payment webhook retries.',
          'Proactively mention dead-letter queue (DLQ) reconciliation for unacknowledged events.'
        ],
        follow_up_question: 'What happens if the Redis lock expires after 120 seconds while the downstream payment processor is still executing?'
      }
    }
  }
];

export default function HomeScreen({
  candidate,
  candidateProgress,
  onStartTechnical,
  onStartResumeJD,
  onStartHR,
  onViewProgress,
  onViewPlans,
  onSelectSession,
}) {
  const totalSessions = candidateProgress?.total_sessions ?? 0;
  const avgScore = totalSessions > 0 && candidateProgress?.average_overall_score > 0
    ? `${Math.round(candidateProgress.average_overall_score)}%`
    : '88%';
  const strengthsCount = totalSessions > 0
    ? Math.max(1, candidateProgress.total_responses * 2 || 3)
    : 3;
  const gapsCount = totalSessions > 0
    ? Math.max(1, 5 - Math.min(4, Math.floor((candidateProgress?.average_overall_score || 50) / 25)))
    : 2;

  const weeklyData = [
    { day: 'Mon', value: totalSessions >= 1 ? 40 : 35, active: true },
    { day: 'Tue', value: totalSessions >= 2 ? 65 : 60, active: true },
    { day: 'Wed', value: totalSessions >= 3 ? 50 : 45, active: true },
    { day: 'Thu', value: totalSessions >= 4 ? 75 : 70, active: true },
    { day: 'Fri', value: totalSessions >= 5 ? 90 : 85, active: true },
    { day: 'Sat', value: 0, active: false },
    { day: 'Sun', value: 0, active: false },
  ];

  // Merge backend recent_sessions with DEMO_FALLBACK_SESSIONS ensuring rich display
  const rawRecent = candidateProgress?.recent_sessions || [];
  const displaySessions = (rawRecent.length > 0 ? rawRecent : DEMO_FALLBACK_SESSIONS).slice(0, 4).map((sess) => {
    // If evaluation missing in API payload, match against fallback evaluation
    if (!sess.evaluation) {
      const match = DEMO_FALLBACK_SESSIONS.find((fb) => fb.session_id === sess.session_id);
      if (match?.evaluation) {
        return { ...sess, evaluation: match.evaluation };
      }
    }
    return sess;
  });

  const getModeBadge = (mode, role) => {
    const roleLower = (role || '').toLowerCase();
    if (mode === 'hr' || roleLower.includes('hr') || roleLower.includes('behavioral')) {
      return {
        label: 'HR / Behavioral & Leadership',
        icon: Users,
        badgeStyle: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      };
    }
    if (mode === 'resume_jd' || roleLower.includes('full stack')) {
      return {
        label: 'Resume & Cloud Gap',
        icon: FileText,
        badgeStyle: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      };
    }
    if (roleLower.includes('senior') || roleLower.includes('backend') || roleLower.includes('design')) {
      return {
        label: 'Distributed Systems Architecture',
        icon: Cpu,
        badgeStyle: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      };
    }
    return {
      label: 'Technical / SDE Practice',
      icon: Code2,
      badgeStyle: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    };
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 85) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (score >= 75) return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Hero Card Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#080D1A] border border-slate-800 shadow-xl min-h-[310px] sm:min-h-[350px] flex flex-col justify-between p-7 sm:p-9">
        <div
          className="absolute inset-0 bg-cover bg-right bg-no-repeat pointer-events-none opacity-90"
          style={{ backgroundImage: `url(${heroCleanImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080D1A] via-[#080D1A]/90 via-50% to-transparent pointer-events-none" />

        {/* Top Row: Prepzo Badge */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-xs font-medium text-slate-200 shadow-sm">
            <svg
              className="w-3.5 h-3.5 text-blue-400 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L3 7v9l9 5 9-5V7l-9-5zm0 2.2l6.5 3.6-2.5 1.4-6.5-3.6 2.5-1.4zM5.5 8.7l5.5 3.1v6.9L5.5 15.6V8.7zm7.5 10v-6.9l5.5-3.1v6.9l-5.5 3.1z" />
            </svg>
            <span className="font-semibold text-white tracking-tight">Prepzo</span>
            <span className="text-blue-400 font-bold ml-0.5">~</span>
          </div>
        </div>

        {/* Center/Left: Main Hero Content */}
        <div className="relative z-10 max-w-lg my-4">
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white leading-[1.15] font-sans">
            Practice Today <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Perform Tomorrow
            </span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-md">
            AI-powered multi-agent interview simulations with real-time vocal calibration, depth verification, and STAR structure feedback.
          </p>

          <div className="mt-6 flex items-center">
            <button
              onClick={onStartTechnical}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer group"
            >
              <span>Start a Practice Interview</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Three Feature Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Technical Interview */}
        <div
          onClick={onStartTechnical}
          className="group relative rounded-2xl bg-[#121927] border border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-indigo-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-purple-950/50 border border-purple-900/40 text-purple-400 flex items-center justify-center font-mono font-bold text-base">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-sm sm:text-base font-bold text-white">
              Technical Interview
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Practice algorithms, system architecture, database trade-offs, and backend fundamentals.
            </p>
          </div>
        </div>

        {/* Resume + Job Mode */}
        <div
          onClick={onStartResumeJD}
          className="group relative rounded-2xl bg-[#121927] border border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-sm sm:text-base font-bold text-white">
              Resume + Job Mode
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Get targeted questions specifically probing your resume projects and job requirement gaps.
            </p>
          </div>
        </div>

        {/* HR / Behavioral Mode */}
        <div
          onClick={onStartHR}
          className="group relative rounded-2xl bg-[#121927] border border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-amber-950/50 border border-amber-900/40 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-sm sm:text-base font-bold text-white">
              HR / Behavioral Mode
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Master the STAR framework (Situation, Task, Action, Result) with leadership questions.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Your Progress & Weekly Activity Section */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
          Performance Overview
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: 4 Metric Cards (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Interviews Taken */}
            <div
              onClick={() => onViewProgress?.()}
              className="bg-[#121927] border border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-900/30 text-blue-400 flex items-center justify-center mb-3">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalSessions}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Interviews Taken
                </div>
              </div>
            </div>

            {/* Average Score */}
            <div
              onClick={() => onViewProgress?.()}
              className="bg-[#121927] border border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-900/30 text-emerald-400 flex items-center justify-center mb-3">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{avgScore}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Average Score
                </div>
              </div>
            </div>

            {/* Strengths Identified */}
            <div
              onClick={() => onViewProgress?.('strengths')}
              className="bg-[#121927] border border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-900/30 text-purple-400 flex items-center justify-center mb-3">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{strengthsCount}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Strengths Identified
                </div>
              </div>
            </div>

            {/* Areas to Improve */}
            <div
              onClick={() => onViewProgress?.('gaps')}
              className="bg-[#121927] border border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-900/30 text-amber-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{gapsCount}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Areas to Improve
                </div>
              </div>
            </div>
          </div>

          {/* Right: Weekly Activity Card (4 cols) */}
          <div className="lg:col-span-4 bg-[#121927] border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                Weekly Activity
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-full">
                {totalSessions > 0 ? `${totalSessions} sessions logged` : '4 Showcase Sessions'}
              </span>
            </div>

            {/* Bar Chart Mon - Sun */}
            <div className="mt-4 flex items-end justify-between gap-1.5 h-20 pt-2">
              {weeklyData.map((item) => (
                <div
                  key={item.day}
                  onClick={() => onViewProgress?.()}
                  title={`${item.day}: ${item.value > 0 ? `${item.value}% completed` : 'No activity'}`}
                  className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-full bg-slate-800/80 rounded-md flex items-end h-16 overflow-hidden p-0.5">
                    <div
                      style={{ height: `${item.value}%` }}
                      className={`w-full rounded-sm transition-all duration-300 ${
                        item.active
                          ? 'bg-blue-500 shadow-xs'
                          : 'bg-slate-700/50 group-hover:bg-slate-600'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] font-medium text-slate-400 group-hover:text-slate-200">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Completed Mock Sessions & Past Evaluations (Review-Ready) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Past Interview Sessions & Live Dossiers
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                {displaySessions.length} Evaluated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select any past session to inspect the 5-axis competency radar, speech cadence (WPM), STAR framework breakdown, and custom coaching drills.
            </p>
          </div>
          <button
            onClick={() => onViewProgress?.('detailed')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 self-start sm:self-center transition-colors cursor-pointer"
          >
            <span>View Full Performance Dossier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Performance Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B101D] border border-slate-800/90 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Avg Showcase Score</div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>87.9%</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">Strong Hire</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 border-l border-slate-800/60">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Speaking Cadence</div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>136.5 WPM</span>
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded">Optimal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 border-l border-slate-800/60">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Clarity & Depth</div>
              <div className="text-sm sm:text-base font-bold text-white">
                88.8% <span className="text-[10px] text-purple-400 font-medium">High</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 border-l border-slate-800/60">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">STAR Framework</div>
              <div className="text-sm sm:text-base font-bold text-white">
                88.8% <span className="text-[10px] text-amber-400 font-medium">Agency</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displaySessions.map((session) => {
            const badge = getModeBadge(session.mode, session.target_role);
            const Icon = badge.icon;
            const scoreClass = getScoreBadgeClass(session.overall_score);

            return (
              <div
                key={session.session_id}
                onClick={() => (onSelectSession ? onSelectSession(session) : onViewProgress?.('detailed'))}
                className="group relative rounded-2xl bg-[#121927] border border-slate-800 hover:border-blue-500/50 p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
              >
                {/* Header row: Badge, Date, Score */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.badgeStyle}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{session.date}</span>
                    </span>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${scoreClass}`}
                  >
                    {Math.round(session.overall_score)}%
                  </span>
                </div>

                {/* Question Text */}
                <div>
                  <h4 className="text-sm font-semibold text-white leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
                    {session.question_text}
                  </h4>
                  {session.response_excerpt && (
                    <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 italic leading-relaxed line-clamp-2">
                      "{session.response_excerpt}"
                    </div>
                  )}
                </div>

                {/* Speech Cadence & Competency Metrics */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-[11px] font-medium border border-blue-500/20">
                      <Mic className="w-3 h-3 text-blue-400" />
                      <span>{session.wpm} WPM</span>
                      <span className="text-[9px] text-emerald-400 font-semibold">(Optimal)</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[11px] font-medium">
                      {session.filler_words_count || 0} Fillers
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[11px] font-medium border border-purple-500/20">
                      {session.communication_score}% Comm
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-medium border border-emerald-500/20">
                      {session.content_score}% Depth
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all">
                    <span>Inspect Evaluation</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
