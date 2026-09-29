import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, AlertCircle, Target, Lightbulb,
  ArrowRight, Compass, ShieldAlert, ChevronDown, ChevronUp,
  BookOpen, Code2, MessageSquare, Award, Check
} from 'lucide-react';

export default function SkillGapReport({ gapAnalysis, currentQuestion, isOpenDefault = false }) {
  const [isExpanded, setIsExpanded] = useState(isOpenDefault);
  const [activeTab, setActiveTab] = useState('gaps'); // 'gaps' | 'roadmap'

  if (!gapAnalysis) return null;

  const matchScore = gapAnalysis.match_score !== undefined ? gapAnalysis.match_score : 70;
  const expMatch = gapAnalysis.experience_level_match || "Mid to Senior Alignment";
  const summary = gapAnalysis.role_fit_summary || "";
  const matchedSkills = gapAnalysis.matched_skills || [];
  const missingSkills = gapAnalysis.missing_skills || [];
  const gapDetails = gapAnalysis.skill_gap_details || [];
  const roadmap = gapAnalysis.improvement_roadmap || [];

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30';
      case 'high':
        return 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30';
      default:
        return 'bg-[#0A84FF]/15 text-[#0A84FF] border-[#0A84FF]/30';
    }
  };

  return (
    <div className="mb-6 rounded-3xl bg-white/[0.03] border border-[#30D158]/35 shadow-apple-card backdrop-blur-2xl overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#30D158]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">Resume ↔ Job Skill Gap & Improvement Report</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30">
                {matchScore}% Fit
              </span>
            </div>
            <p className="text-[11px] text-[#98989D] mt-0.5">
              {expMatch}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white flex items-center space-x-1.5 transition border border-white/[0.08]"
          >
            <span>{isExpanded ? "Collapse Report" : "View Full Gap & Improvement Report"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Summary preview */}
      <div className="px-5 pt-3 pb-2 text-xs text-[#D1D1D6] leading-relaxed">
        {summary}
      </div>

      {/* High-level tags pill bar */}
      <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {matchedSkills.length > 0 && (
          <div className="p-3 rounded-2xl bg-[#30D158]/10 border border-[#30D158]/20">
            <div className="text-[11px] font-semibold text-[#30D158] mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Resume Strengths ({matchedSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-lg bg-[#30D158]/20 text-[#30D158] text-[10px] font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {missingSkills.length > 0 && (
          <div className="p-3 rounded-2xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20">
            <div className="text-[11px] font-semibold text-[#FF9F0A] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Identified JD Skill Gaps ({missingSkills.length})</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#FF9F0A]/80 font-medium">Probing in Questions</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((s, idx) => {
                const isTarget = currentQuestion?.target_gap && (
                  s.toLowerCase().includes(currentQuestion.target_gap.toLowerCase()) ||
                  currentQuestion.target_gap.toLowerCase().includes(s.toLowerCase())
                );
                return (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                      isTarget
                        ? "bg-[#FF9F0A] text-black font-bold ring-2 ring-[#FF9F0A]/60 shadow-sm"
                        : "bg-[#FF9F0A]/20 text-[#FF9F0A]"
                    }`}
                  >
                    {isTarget && "🎯 "}
                    {s}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Expanded In-Depth Report */}
      {isExpanded && (
        <div className="border-t border-white/[0.08] p-5 bg-white/[0.01]">
          {/* Sub Navigation */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('gaps')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'gaps'
                  ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40 font-semibold'
                  : 'text-[#98989D] hover:text-white bg-white/[0.04]'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Skill Gap Breakdown & How to Improve ({gapDetails.length || missingSkills.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'roadmap'
                  ? 'bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/40 font-semibold'
                  : 'text-[#98989D] hover:text-white bg-white/[0.04]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>3-Phase Strategic Roadmap</span>
            </button>
          </div>

          {/* TAB 1: Skill Gap Breakdown */}
          {activeTab === 'gaps' && (
            <div className="space-y-4">
              {gapDetails.length > 0 ? (
                gapDetails.map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06] mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getSeverityBadge(gap.severity)}`}>
                          {gap.severity || "High"} Gap
                        </span>
                        <h4 className="text-sm font-semibold text-white">{gap.skill_or_domain}</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[#98989D] font-medium block mb-1">Why It Matters for the Role:</span>
                        <p className="text-[#D1D1D6] leading-relaxed">{gap.why_it_matters}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[#98989D] font-medium block mb-1">Current Resume Status:</span>
                        <p className="text-[#D1D1D6] leading-relaxed">{gap.current_resume_status}</p>
                      </div>
                    </div>

                    {/* How to Improve & Recommended Actions */}
                    <div className="p-3 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 mb-3">
                      <div className="flex items-center space-x-1.5 text-[#30D158] font-semibold text-xs mb-1">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Actionable Improvement Plan:</span>
                      </div>
                      <p className="text-xs text-[#E5E5EA] leading-relaxed mb-2">{gap.how_to_improve}</p>

                      {gap.recommended_projects_or_actions?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#30D158]/20">
                          <span className="text-[11px] font-medium text-[#30D158] block mb-1 flex items-center gap-1">
                            <Code2 className="w-3 h-3" />
                            <span>Recommended Hands-On Projects / Exercises:</span>
                          </span>
                          <ul className="list-disc list-inside text-[11px] text-[#D1D1D6] space-y-1">
                            {gap.recommended_projects_or_actions.map((act, aIdx) => (
                              <li key={aIdx}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Talking points */}
                    {gap.talking_points && (
                      <div className="p-2.5 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-start space-x-2 text-xs">
                        <MessageSquare className="w-3.5 h-3.5 text-[#0A84FF] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-[#0A84FF]">Interview Strategy: </span>
                          <span className="text-[#D1D1D6]">{gap.talking_points}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-white/[0.03] text-xs text-[#98989D]">
                  No detailed gaps recorded. Continue practicing the probing questions.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Strategic Improvement Roadmap */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              {roadmap.length > 0 ? (
                roadmap.map((phase, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] text-xs font-bold flex items-center justify-center border border-[#0A84FF]/40">
                        {pIdx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{phase.phase}</h4>
                    </div>
                    <p className="text-xs text-[#A1A1A6] mb-3 ml-8">{phase.focus}</p>

                    <div className="ml-8 space-y-1.5">
                      {phase.actions?.map((act, actIdx) => (
                        <div key={actIdx} className="flex items-start space-x-2 text-xs text-[#D1D1D6]">
                          <Check className="w-3.5 h-3.5 text-[#30D158] shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-white/[0.03] text-xs text-[#98989D]">
                  Roadmap generated dynamically during interview practice sessions.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
