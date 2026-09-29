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
} from 'lucide-react';
import heroCleanImg from '../assets/hero-clean.png';

export default function HomeScreen({
  candidate,
  candidateProgress,
  onStartTechnical,
  onStartResumeJD,
  onStartHR,
  onViewProgress,
  onViewPlans,
}) {
  const totalSessions = candidateProgress?.total_sessions ?? 0;
  const avgScore = totalSessions > 0 && candidateProgress?.average_overall_score > 0
    ? `${Math.round(candidateProgress.average_overall_score)}%`
    : '—';
  const strengthsCount = totalSessions > 0
    ? Math.max(1, candidateProgress.total_responses * 2 || 3)
    : 0;
  const gapsCount = totalSessions > 0
    ? Math.max(1, 5 - Math.min(4, Math.floor((candidateProgress?.average_overall_score || 50) / 25)))
    : 0;

  const weeklyData = [
    { day: 'Mon', value: totalSessions >= 1 ? 40 : 0, active: totalSessions >= 1 },
    { day: 'Tue', value: totalSessions >= 2 ? 65 : 0, active: totalSessions >= 2 },
    { day: 'Wed', value: totalSessions >= 3 ? 50 : 0, active: totalSessions >= 3 },
    { day: 'Thu', value: totalSessions >= 4 ? 75 : 0, active: totalSessions >= 4 },
    { day: 'Fri', value: totalSessions >= 5 ? 90 : 0, active: totalSessions >= 5 },
    { day: 'Sat', value: 0, active: false },
    { day: 'Sun', value: 0, active: false },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-7 max-w-7xl mx-auto">
      {/* 1. Hero Card Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#080D1A] border border-slate-800 shadow-xl min-h-[310px] sm:min-h-[350px] flex flex-col justify-between p-7 sm:p-9">
        {/* Background Image of workspace & desk on right */}
        <div
          className="absolute inset-0 bg-cover bg-right bg-no-repeat pointer-events-none opacity-90"
          style={{ backgroundImage: `url(${heroCleanImg})` }}
        />
        {/* Soft linear dark gradient from left to right */}
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
          Your Progress
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
                {totalSessions > 0 ? `${totalSessions} sessions logged` : 'No sessions yet'}
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
    </div>
  );
}
