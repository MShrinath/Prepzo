import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  MessageSquare,
  Cpu,
  Compass,
  Check,
  BookOpen,
  Target,
  AlertCircle
} from 'lucide-react';
import { fetchImprovementPlan, regenerateImprovementPlan } from '../services/api';

export default function PlansScreen({
  candidate,
  candidateProgress,
  evaluationData,
  onStartPractice,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'resources'
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState(false);
  const [backendPlan, setBackendPlan] = useState(null);

  const totalSessions = candidateProgress?.total_sessions ?? (evaluationData ? 1 : 0);

  // Load backend improvement plan if candidate has completed sessions
  useEffect(() => {
    if (totalSessions > 0) {
      fetchImprovementPlan(candidate?.candidate_id || 'candidate_001')
        .then((plan) => {
          if (plan) setBackendPlan(plan);
        })
        .catch((err) => console.log('Using diagnostic-driven plan:', err));
    }
  }, [totalSessions, candidate]);

  // Scores derived from latest evaluation or candidate averages
  const overallScore = evaluationData?.coaching_feedback?.overall_score ?? (candidateProgress?.average_overall_score || 0);
  const commScore = evaluationData?.communication_evaluation?.communication_quality_score
    ? evaluationData.communication_evaluation.communication_quality_score * 10
    : (candidateProgress?.average_communication_score || 0);
  const techScore = evaluationData?.content_evaluation?.technical_depth_score
    ? evaluationData.content_evaluation.technical_depth_score * 10
    : (candidateProgress?.average_content_score || 0);
  const starScore = evaluationData?.star_evaluation?.applicable
    ? ((evaluationData.star_evaluation.situation_score + evaluationData.star_evaluation.action_score + evaluationData.star_evaluation.result_score) / 3) * 10
    : 70;

  // Auto-complete status based on real performance milestones
  const isCommMastered = commScore >= 75;
  const isTechMastered = techScore >= 75;
  const isStarMastered = starScore >= 75;

  const [checkedTasks, setCheckedTasks] = useState(() => {
    const initial = {};
    if (isCommMastered) initial['d1_0'] = true;
    if (isStarMastered) initial['d1_1'] = true;
    if (isTechMastered) initial['d2_0'] = true;
    return initial;
  });

  const toggleTask = (id) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const plan = await regenerateImprovementPlan(candidate?.candidate_id || 'candidate_001');
      if (plan) {
        setBackendPlan(plan);
        setRegenSuccess(true);
        setTimeout(() => setRegenSuccess(false), 3500);
      }
    } catch (e) {
      console.warn('Failed to regenerate plan with AI:', e);
    } finally {
      setIsRegenerating(false);
    }
  };

  // State 1: Prerequisite requirement (Zero completed interviews)
  if (totalSessions === 0 && !evaluationData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            7-Day Improvement Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personalized daily roadmap tailored to your specific interview diagnostics.
          </p>
        </div>

        {/* Empty / Prerequisite Lock Card */}
        <div className="bg-[#121927] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <Target className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
              Assessment Required
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Need minimum 1 interview assessment then can plan
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Complete at least one practice interview so our multi-agent diagnostic engine can evaluate your communication patterns, technical depth, and STAR structure to generate your custom 7-Day Plan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-2 text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <p className="text-xs font-semibold text-white mb-1">1. Practice Mock</p>
              <p className="text-[11px] text-slate-400">Record spoken or typed answers to live questions.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <p className="text-xs font-semibold text-white mb-1">2. AI Diagnosis</p>
              <p className="text-[11px] text-slate-400">LangGraph analyzes pacing, trade-offs, and gaps.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <p className="text-xs font-semibold text-white mb-1">3. Auto 7-Day Plan</p>
              <p className="text-[11px] text-slate-400">Unlocks dynamic daily tasks that update as you improve.</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onStartPractice}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <span>Start Practice Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Active Plan generated dynamically from LLM evaluation diagnostics
  const fallbackDays = [
    {
      day: 'Day 1',
      date: 'Today',
      badge: 'Active Focus',
      badgeType: 'today',
      title: isStarMastered ? 'Refine Executive Impact in STAR Stories' : 'Master STAR Behavioral Framework',
      statusNote: isStarMastered ? 'Prior score: 75%+ (Advanced Polish)' : 'Priority Focus: Structure needs measurable results',
      tasks: [
        {
          id: 'd1_0',
          text: 'Practice 2 behavioral questions focusing strictly on measurable business Results',
          autoCompleted: isStarMastered,
        },
        {
          id: 'd1_1',
          text: 'Rehearse STAR Story Bank examples using the Action-to-Result formula',
          autoCompleted: isStarMastered,
        },
        {
          id: 'd1_2',
          text: 'Listen to AI Executive Voice Shadowing delivery demo',
          autoCompleted: false,
        },
      ],
      color: 'blue',
    },
    {
      day: 'Day 2',
      date: 'Day 2',
      badge: isTechMastered ? 'Refining' : 'High Priority',
      badgeType: 'upcoming',
      title: 'Strengthen System Design & Architectural Trade-offs',
      statusNote: isTechMastered ? 'Solid technical baseline (75%+)' : 'Gap Detected: Articulate trade-offs and edge cases',
      tasks: [
        {
          id: 'd2_0',
          text: `Practice distributed system design question for ${candidate?.target_role || 'Software Engineer'}`,
          autoCompleted: isTechMastered,
        },
        {
          id: 'd2_1',
          text: 'Explain latency vs throughput bottlenecks and caching strategies',
          autoCompleted: false,
        },
      ],
      color: 'green',
    },
    {
      day: 'Day 3',
      date: 'Day 3',
      badge: isCommMastered ? 'Maintained' : 'Cadence Drill',
      badgeType: 'upcoming',
      title: 'Vocal Delivery & Filler Word Reduction',
      statusNote: isCommMastered ? 'Pacing is currently in optimal range (130-160 WPM)' : 'Target: Keep filler words under 2 per answer',
      tasks: [
        {
          id: 'd3_0',
          text: 'Complete 1 Voice Recording practice with Live Vocal HUD active',
          autoCompleted: isCommMastered,
        },
        {
          id: 'd3_1',
          text: 'Practice 3-second strategic pausing instead of saying "um" or "like"',
          autoCompleted: false,
        },
      ],
      color: 'slate',
    },
    {
      day: 'Day 4',
      date: 'Day 4',
      badge: 'Portfolio',
      badgeType: 'upcoming',
      title: 'Resume Project Deep Dive & Edge Cases',
      statusNote: 'Align claimed resume accomplishments with technical verification',
      tasks: [
        {
          id: 'd4_0',
          text: 'Answer project architecture probing questions based on your resume portfolio',
          autoCompleted: false,
        },
        {
          id: 'd4_1',
          text: 'Prepare talking points explaining production outages or trade-offs made',
          autoCompleted: false,
        },
      ],
      color: 'slate',
    },
    {
      day: 'Day 5',
      date: 'Day 5',
      badge: 'Company Bar',
      badgeType: 'upcoming',
      title: 'Company Archetype Simulation (Amazon / Google / McKinsey)',
      statusNote: 'Test against top-tier tech bar raiser rubrics',
      tasks: [
        {
          id: 'd5_0',
          text: 'Take 1 Amazon Leadership Principles or Google Scale simulation round',
          autoCompleted: false,
        },
      ],
      color: 'slate',
    },
    {
      day: 'Day 6',
      date: 'Day 6',
      badge: 'Stress Test',
      badgeType: 'upcoming',
      title: 'Rapid-Fire Timed Interview Round',
      statusNote: 'Simulate high-pressure live interview timing',
      tasks: [
        {
          id: 'd6_0',
          text: 'Complete 3 sequential questions with a strict 2-minute answer timer',
          autoCompleted: false,
        },
      ],
      color: 'slate',
    },
    {
      day: 'Day 7',
      date: 'Day 7',
      badge: 'Milestone',
      badgeType: 'upcoming',
      title: 'Final Full-Length Interview & Executive Dossier Export',
      statusNote: 'Review comprehensive 5-axis score improvements',
      tasks: [
        {
          id: 'd7_0',
          text: 'Complete full multi-turn conversational session and export Assessment PDF',
          autoCompleted: false,
        },
      ],
      color: 'slate',
    },
  ];

  const daysData = (backendPlan?.items && backendPlan.items.length > 0)
    ? backendPlan.items.map((item, idx) => {
        const isMastered = idx === 0 ? isCommMastered : (idx === 1 ? isStarMastered : isTechMastered);
        return {
          day: `Day ${item.day || idx + 1}`,
          date: idx === 0 ? 'Today' : `Day ${item.day || idx + 1}`,
          badge: idx === 0 ? 'Active Focus' : (idx === 1 ? 'Priority Drill' : 'Targeted Drill'),
          badgeType: idx === 0 ? 'today' : 'upcoming',
          title: item.focus || `Day ${idx + 1} Practice`,
          statusNote: item.tips || 'Grounded in your recent performance evaluation',
          tasks: [
            {
              id: `bp_${idx}_0`,
              text: item.task,
              autoCompleted: idx === 0 ? isCommMastered : (idx === 1 ? isStarMastered : false),
            },
            ...(item.tips ? [{
              id: `bp_${idx}_1`,
              text: `Coach Tip: ${item.tips}`,
              autoCompleted: false,
            }] : []),
          ],
          color: idx === 0 ? 'blue' : (idx === 1 ? 'green' : 'slate'),
        };
      })
    : fallbackDays;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header with Status & Regenerate Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              7-Day Improvement Plan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live AI Diagnostics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personalized curriculum generated by LLM coach based on your live interview responses.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {regenSuccess && (
            <span className="text-xs font-medium text-emerald-400 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Plan synchronized with latest session!</span>
            </span>
          )}

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#121927] border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRegenerating ? 'Generating Plan...' : 'Sync with Latest Evaluation'}</span>
          </button>

          <button
            onClick={onStartPractice}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs sm:text-sm font-semibold text-white transition-all shadow-sm cursor-pointer"
          >
            <span>Practice Today's Drill</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic AI Plan Overview Banner */}
      {backendPlan?.overview && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-[#121927] border border-blue-900/40 text-xs sm:text-sm text-slate-300 flex items-start gap-3 shadow-xs">
          <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white mb-0.5">
              {backendPlan.title || 'Personalized 7-Day Improvement Plan'}
            </p>
            <p className="text-slate-300 leading-relaxed text-xs">
              {backendPlan.overview}
            </p>
          </div>
        </div>
      )}

      {/* 2. Top Diagnostic Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#121927] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Communication Cadence</span>
            <span className={`text-xs font-bold ${isCommMastered ? 'text-emerald-400' : 'text-amber-400'}`}>
              {commScore > 0 ? `${Math.round(commScore)}%` : '70%'} {isCommMastered ? '(Optimal)' : '(Focus)'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${isCommMastered ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${commScore || 70}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121927] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Technical Depth &amp; Correctness</span>
            <span className={`text-xs font-bold ${isTechMastered ? 'text-emerald-400' : 'text-blue-400'}`}>
              {techScore > 0 ? `${Math.round(techScore)}%` : '75%'} {isTechMastered ? '(Strong)' : '(Emerging)'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${isTechMastered ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${techScore || 75}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121927] border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">STAR Framework Structure</span>
            <span className={`text-xs font-bold ${isStarMastered ? 'text-emerald-400' : 'text-purple-400'}`}>
              {starScore > 0 ? `${Math.round(starScore)}%` : '70%'} {isStarMastered ? '(Solid)' : '(Action Needed)'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${isStarMastered ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${starScore || 70}%` }} />
          </div>
        </div>
      </div>

      {/* 3. 7-Day Timeline Cards */}
      <div className="space-y-4">
        {daysData.map((d) => (
          <div
            key={d.day}
            className="p-5 rounded-2xl bg-[#121927] border border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs">
                  {d.day}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {d.title}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  {d.statusNote}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  d.badgeType === 'today'
                    ? 'bg-blue-900/40 text-blue-300 border border-blue-800/40'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {d.badge}
                </span>
              </div>
            </div>

            {/* Daily Tasks Checkbox List */}
            <div className="space-y-2 pt-1">
              {d.tasks.map((task) => {
                const isChecked = checkedTasks[task.id] || task.autoCompleted;
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-300'
                        : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40 text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-between text-xs sm:text-sm">
                      <span className={isChecked ? 'line-through text-slate-400' : ''}>
                        {task.text}
                      </span>
                      {task.autoCompleted && (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex-shrink-0">
                          Auto-Passed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
