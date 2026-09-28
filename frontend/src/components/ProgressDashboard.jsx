import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { BarChart2, TrendingUp, AlertTriangle, Calendar, CheckCircle2, RefreshCw, Trash2, ArrowUpRight } from 'lucide-react';
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
    if (!window.confirm("Are you sure you want to clear your practice session history? This will start your analytics with a clean slate.")) {
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
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0A84FF] mx-auto mb-3" />
        <p className="text-xs text-[#98989D]">Loading performance analytics...</p>
      </div>
    );
  }

  const timeline = progressData?.timeline || [];
  const totalSessions = progressData?.total_sessions || timeline.length || 0;
  const avgOverall = totalSessions > 0 ? (progressData?.average_overall_score ?? 0) : null;
  const avgComm = totalSessions > 0 ? (progressData?.average_communication_score ?? 0) : null;
  const avgContent = totalSessions > 0 ? (progressData?.average_content_score ?? 0) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#98989D] mt-1">
            Score progression, recurring gaps, and practice roadmap for {progressData?.candidate_name || candidate?.name || 'Candidate'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalSessions > 0 && (
            <button
              onClick={handleResetHistory}
              className="text-xs px-3.5 py-1.5 rounded-full bg-[#FF453A]/10 hover:bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/25 flex items-center space-x-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset History</span>
            </button>
          )}

          <button
            onClick={loadDashboardData}
            className="text-xs px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/[0.04] border border-white/[0.08] p-5 rounded-3xl shadow-apple-card backdrop-blur-2xl">
          <span className="text-[11px] font-medium text-[#98989D] block mb-1">
            Total Sessions
          </span>
          <div className="text-3xl font-bold text-white tracking-tight">
            {totalSessions}
          </div>
          <span className="text-[11px] text-[#636366]">Practice rounds</span>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] p-5 rounded-3xl shadow-apple-card backdrop-blur-2xl">
          <span className="text-[11px] font-medium text-[#98989D] block mb-1">
            Average Score
          </span>
          <div className="text-3xl font-bold text-[#0A84FF] tracking-tight">
            {avgOverall !== null ? (
              <>{avgOverall}<span className="text-sm text-[#636366] font-normal">/100</span></>
            ) : (
              <span className="text-[#636366] text-2xl">—</span>
            )}
          </div>
          <span className="text-[11px] text-[#636366]">
            {totalSessions > 0 ? "Cumulative avg" : "No sessions yet"}
          </span>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] p-5 rounded-3xl shadow-apple-card backdrop-blur-2xl">
          <span className="text-[11px] font-medium text-[#98989D] block mb-1">
            Communication
          </span>
          <div className="text-3xl font-bold text-white tracking-tight">
            {avgComm !== null ? (
              <>{avgComm}<span className="text-sm text-[#636366] font-normal">/100</span></>
            ) : (
              <span className="text-[#636366] text-2xl">—</span>
            )}
          </div>
          <span className="text-[11px] text-[#636366]">Delivery & clarity</span>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] p-5 rounded-3xl shadow-apple-card backdrop-blur-2xl">
          <span className="text-[11px] font-medium text-[#98989D] block mb-1">
            Content Quality
          </span>
          <div className="text-3xl font-bold text-[#30D158] tracking-tight">
            {avgContent !== null ? (
              <>{avgContent}<span className="text-sm text-[#636366] font-normal">/100</span></>
            ) : (
              <span className="text-[#636366] text-2xl">—</span>
            )}
          </div>
          <span className="text-[11px] text-[#636366]">Technical depth</span>
        </div>
      </div>

      {/* Score Progression Line Chart */}
      <div className="bg-white/[0.04] border border-white/[0.08] p-6 sm:p-7 rounded-3xl shadow-apple-card backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0A84FF]" />
            <span>Performance Progression</span>
          </h3>
          <span className="text-xs text-[#98989D]">Multi-session telemetry</span>
        </div>
        <p className="text-xs text-[#98989D] mb-6">
          Comparing composite score, communication clarity, and technical content over practice history.
        </p>

        {timeline.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#636366" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#636366" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1C1E',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    color: '#fff',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="overall_score" name="Overall Score" stroke="#0A84FF" strokeWidth={3} dot={{ r: 4, fill: '#0A84FF' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="communication" name="Communication" stroke="#5E5CE6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="content" name="Content Quality" stroke="#30D158" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-white/[0.1] rounded-2xl bg-white/[0.01]">
            <BarChart2 className="w-8 h-8 text-[#636366] mx-auto mb-2" />
            <h4 className="text-sm font-medium text-white">No practice sessions completed yet</h4>
            <p className="text-xs text-[#98989D] max-w-sm mx-auto mt-1">
              Start practicing with Role Practice, Resume Match, or HR Round to build your progress trends.
            </p>
          </div>
        )}
      </div>

      {/* Grid: Recurring Gaps & 7-Day Improvement Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Gaps Detection */}
        <div className="bg-white/[0.04] border border-white/[0.08] p-6 rounded-3xl shadow-apple-card backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF9F0A]" />
              <span>Recurring Observations</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] font-medium border border-[#FF9F0A]/25">
              Cross-Session
            </span>
          </div>
          <p className="text-xs text-[#98989D] mb-4">
            Patterns observed across 2 or more distinct practice sessions.
          </p>

          {recurringGaps.length > 0 ? (
            <div className="space-y-3">
              {recurringGaps.map((gap, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white text-sm">{gap.gap_category}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/25 text-[10px] font-semibold">
                      Flagged {gap.occurrence_count} times
                    </span>
                  </div>
                  <p className="text-[#D1D1D6] leading-relaxed mb-2">{gap.description}</p>
                  <div className="text-[11px] text-[#0A84FF] font-medium">
                    Status: <span className="capitalize">{gap.status || "active focus"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center text-xs text-[#98989D]">
              <CheckCircle2 className="w-6 h-6 text-[#30D158] mx-auto mb-2" />
              <p className="font-medium text-white">No chronic recurring gaps detected.</p>
              <p className="mt-1 text-[#636366]">Complete more practice rounds to activate longitudinal tracking.</p>
            </div>
          )}
        </div>

        {/* Personalized 7-Day Improvement Plan */}
        <div className="bg-white/[0.04] border border-white/[0.08] p-6 rounded-3xl shadow-apple-card backdrop-blur-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0A84FF]" />
                <span>{improvementPlan?.title || "7-Day Practice Roadmap"}</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] font-medium border border-[#0A84FF]/25">
                Action Plan
              </span>
            </div>

            {improvementPlan?.overview && (
              <p className="text-xs text-[#D1D1D6] bg-white/[0.02] border border-white/[0.06] p-3 rounded-2xl mb-4 leading-relaxed">
                {improvementPlan.overview}
              </p>
            )}

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {(improvementPlan?.items || []).map((item, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#0A84FF]">Day {item.day}: {item.focus}</span>
                  </div>
                  <p className="text-white font-medium mb-1">{item.task}</p>
                  <p className="text-[11px] text-[#98989D] italic">Tip: {item.tips}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
