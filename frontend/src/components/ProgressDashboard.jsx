import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle, Calendar, Award, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { fetchCandidateProgress, fetchRecurringGaps, fetchImprovementPlan, clearCandidateSessions } from '../services/api';

export default function ProgressDashboard({ candidate }) {
  const [progressData, setProgressData] = useState(null);
  const [recurringGaps, setRecurringGaps] = useState([]);
  const [improvementPlan, setImprovementPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const candidateId = candidate?.candidate_id || 'candidate_001';

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [prog, gaps, plan] = await Promise.all([
        fetchCandidateProgress(candidateId),
        fetchRecurringGaps(candidateId),
        fetchImprovementPlan(candidateId),
      ]);
      setProgressData(prog);
      setRecurringGaps(gaps);
      setImprovementPlan(plan);
    } catch (err) {
      console.error("Failed to load progress dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your practice session history? This will start your analytics with a completely clean slate.")) {
      return;
    }
    try {
      await clearCandidateSessions(candidateId);
      await loadDashboardData();
    } catch (err) {
      alert("Failed to reset session history: " + err.message);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading progress analytics and improvement roadmap...</p>
      </div>
    );
  }

  const timeline = progressData?.timeline || [];
  const totalSessions = progressData?.total_sessions || timeline.length || 0;
  const avgOverall = totalSessions > 0 ? (progressData?.average_overall_score ?? 0) : null;
  const avgComm = totalSessions > 0 ? (progressData?.average_communication_score ?? 0) : null;
  const avgContent = totalSessions > 0 ? (progressData?.average_content_score ?? 0) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Performance Analytics & Growth
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tracking longitudinal score progression, recurring weaknesses, and daily practice plans for {progressData?.candidate_name || candidate?.name || 'Candidate'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalSessions > 0 && (
            <button
              onClick={handleResetHistory}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1.5 transition"
              title="Clear all past sessions to start fresh"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset History</span>
            </button>
          )}

          <button
            onClick={loadDashboardData}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Sessions
          </span>
          <div className="text-3xl font-black text-white">
            {totalSessions}
          </div>
          <span className="text-[11px] text-slate-500">Practice rounds</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Avg Overall Score
          </span>
          <div className="text-3xl font-black text-indigo-400">
            {avgOverall !== null ? (
              <>{avgOverall}<span className="text-sm text-slate-500 font-normal">/100</span></>
            ) : (
              <span className="text-slate-600 text-2xl font-bold">--</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            {totalSessions > 0 ? "Cumulative avg" : "No sessions yet"}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Communication
          </span>
          <div className="text-3xl font-black text-white">
            {avgComm !== null ? (
              <>{avgComm}<span className="text-sm text-slate-500 font-normal">/100</span></>
            ) : (
              <span className="text-slate-600 text-2xl font-bold">--</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">Clarity & cadence</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Content Mastery
          </span>
          <div className="text-3xl font-black text-emerald-400">
            {avgContent !== null ? (
              <>{avgContent}<span className="text-sm text-slate-500 font-normal">/100</span></>
            ) : (
              <span className="text-slate-600 text-2xl font-bold">--</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">Technical depth</span>
        </div>
      </div>

      {/* Score Progression Line Chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <span>Longitudinal Performance Trends Across Sessions</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Comparing Overall Score, Communication Clarity, and Technical Content Depth over time.
        </p>

        {timeline.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="overall_score" name="Overall Score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="communication" name="Communication" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="content" name="Content Quality" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No practice sessions completed yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Start practicing with Role Practice, Resume Match, or HR Round to build your longitudinal performance graph.
            </p>
          </div>
        )}
      </div>

      {/* Grid: Recurring Gaps & 7-Day Improvement Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recurring Gaps Detection */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Detected Recurring Weaknesses</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
              Cross-Session Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Patterns that appeared in 2 or more separate practice sessions, automatically flagged by the Coach Agent.
          </p>

          {recurringGaps.length > 0 ? (
            <div className="space-y-3">
              {recurringGaps.map((gap, i) => (
                <div key={i} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white text-sm">{gap.gap_category}</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                      Flagged {gap.occurrence_count} times
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-2">{gap.description}</p>
                  <div className="text-[11px] text-indigo-400 font-medium">
                    Status: <span className="capitalize">{gap.status || "active focus"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No chronic recurring gaps detected yet.</p>
              <p className="mt-1 text-slate-500">Complete more practice sessions to activate longitudinal weakness tracking.</p>
            </div>
          )}
        </div>

        {/* Personalized 7-Day Improvement Plan */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span>{improvementPlan?.title || "7-Day Personalized Improvement Plan"}</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                Actionable Roadmap
              </span>
            </div>

            {improvementPlan?.overview && (
              <p className="text-xs text-indigo-200 bg-indigo-950/30 border border-indigo-500/20 p-3 rounded-xl mb-4 leading-relaxed">
                {improvementPlan.overview}
              </p>
            )}

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {(improvementPlan?.items || []).map((item, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-indigo-400">Day {item.day}: {item.focus}</span>
                  </div>
                  <p className="text-slate-200 font-medium mb-1">{item.task}</p>
                  <p className="text-[11px] text-slate-400 italic">Tip: {item.tips}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
