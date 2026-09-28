import React, { useState } from 'react';
import {
  CheckCircle2, ArrowRight, Sparkles, MessageSquare,
  Award, ShieldAlert, CornerDownRight, RotateCcw, Send, Volume2,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { submitFollowUpAnswer } from '../services/api';

export default function FeedbackView({ evaluationData, onNextQuestion, onExit }) {
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [followUpFeedback, setFollowUpFeedback] = useState(null);

  const coach = evaluationData?.coaching_feedback || {};
  const comm = evaluationData?.communication_evaluation || {};
  const content = evaluationData?.content_evaluation || {};
  const star = evaluationData?.star_evaluation || {};

  const overallScore = Math.round(coach.overall_score !== undefined ? coach.overall_score : 75);
  const questionText = evaluationData?.question_text || "Interview Question";
  const responseText = evaluationData?.response_text || evaluationData?.transcript || "";
  const followUpQuestion = coach.follow_up_question;

  const handleFollowUpSubmit = async () => {
    if (!followUpAnswer.trim()) return;
    setSubmittingFollowUp(true);
    try {
      const res = await submitFollowUpAnswer(
        evaluationData.session_id,
        followUpAnswer,
        followUpQuestion
      );
      setFollowUpFeedback(res);
    } catch (err) {
      console.error("Failed to submit follow-up:", err);
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const getScoreInfo = (score) => {
    if (score >= 80) {
      return {
        label: "Exceeds Expectations",
        color: "text-[#30D158]",
        bg: "bg-[#30D158]/15",
        border: "border-[#30D158]/30",
        ringColor: "#30D158",
      };
    }
    if (score >= 60) {
      return {
        label: "Proficient",
        color: "text-[#FF9F0A]",
        bg: "bg-[#FF9F0A]/15",
        border: "border-[#FF9F0A]/30",
        ringColor: "#FF9F0A",
      };
    }
    return {
      label: "Needs Practice",
      color: "text-[#FF453A]",
      bg: "bg-[#FF453A]/15",
      border: "border-[#FF453A]/30",
      ringColor: "#FF453A",
    };
  };

  const scoreInfo = getScoreInfo(overallScore);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-7">
      {/* Dossier Header & Overall Score */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-apple-card backdrop-blur-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#0A84FF] tracking-wide uppercase mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluation Report</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Session Assessment
            </h1>
            <p className="text-xs sm:text-sm text-[#98989D] mt-1 max-w-lg leading-relaxed">
              Consolidated evaluation of your response across communication clarity, technical depth, and structural impact.
            </p>
          </div>

          {/* Apple-style Metric Badge */}
          <div className="flex items-center space-x-4 bg-white/[0.04] border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-sm">
            <div className="text-center pr-4 border-r border-white/[0.08]">
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-[#98989D] mb-0.5">
                Overall Score
              </span>
              <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {overallScore}<span className="text-base text-[#636366] font-normal">/100</span>
              </div>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-[#98989D] mb-1">
                Verdict
              </span>
              <div className={`px-3 py-1 rounded-full border text-xs font-semibold tracking-wide ${scoreInfo.color} ${scoreInfo.bg} ${scoreInfo.border}`}>
                {scoreInfo.label}
              </div>
            </div>
          </div>
        </div>

        {/* Question & Answer Summary */}
        <div className="mt-6 pt-6 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
            <span className="text-[#98989D] font-medium block mb-1">Question Prompt</span>
            <p className="text-white leading-relaxed font-medium">{questionText}</p>
          </div>
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#98989D] font-medium">Your Response</span>
              <span className="text-[11px] text-[#636366]">
                {responseText ? responseText.split(/\s+/).length : 0} words
              </span>
            </div>
            <p className="text-[#D1D1D6] italic line-clamp-3 leading-relaxed">
              "{responseText || "No response text captured."}"
            </p>
          </div>
        </div>
      </div>

      {/* Tri-Agent Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Communication Agent */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-apple-card backdrop-blur-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0A84FF]" />
                <span>Delivery & Clarity</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] font-semibold border border-[#0A84FF]/25">
                {comm.communication_quality_score ? `${comm.communication_quality_score}/10` : '—'}
              </span>
            </div>

            <div className="space-y-2.5 mb-4 text-xs">
              <div className="flex justify-between text-[#98989D]">
                <span>Clarity:</span>
                <span className="font-semibold text-white">{comm.clarity_score !== undefined ? comm.clarity_score : '—'}/10</span>
              </div>
              <div className="flex justify-between text-[#98989D]">
                <span>Conciseness:</span>
                <span className="font-semibold text-white">{comm.conciseness_score !== undefined ? comm.conciseness_score : '—'}/10</span>
              </div>
              <div className="flex justify-between text-[#98989D]">
                <span>Structure:</span>
                <span className="font-semibold text-white">{comm.structure_score !== undefined ? comm.structure_score : '—'}/10</span>
              </div>
              {comm.filler_words_score !== undefined && (
                <div className="flex justify-between text-[#98989D]">
                  <span>Filler Words:</span>
                  <span className={`font-semibold ${comm.filler_words_score > 3 ? 'text-[#FF9F0A]' : 'text-[#30D158]'}`}>
                    {comm.filler_words_score} detected
                  </span>
                </div>
              )}
            </div>

            {comm.weaknesses && comm.weaknesses.length > 0 && (
              <div className="text-xs text-[#98989D] border-t border-white/[0.06] pt-3">
                <span className="text-white font-medium block mb-1">Key Observation:</span>
                <p className="text-[#D1D1D6] leading-relaxed text-[11px]">{comm.weaknesses[0]}</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Content Evaluation Agent */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-apple-card backdrop-blur-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#30D158]" />
                <span>Technical Depth</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] font-semibold border border-[#30D158]/25">
                {content.relevance_score ? `${content.relevance_score}/10` : '—'}
              </span>
            </div>

            <div className="space-y-2.5 mb-4 text-xs">
              <div className="flex justify-between text-[#98989D]">
                <span>Relevance:</span>
                <span className="font-semibold text-white">{content.relevance_score !== undefined ? content.relevance_score : '—'}/10</span>
              </div>
              <div className="flex justify-between text-[#98989D]">
                <span>Technical Depth:</span>
                <span className="font-semibold text-white">{content.technical_depth_score !== undefined ? content.technical_depth_score : '—'}/10</span>
              </div>
              <div className="flex justify-between text-[#98989D]">
                <span>Correctness:</span>
                <span className="font-semibold text-white">{content.correctness_score !== undefined ? content.correctness_score : '—'}/10</span>
              </div>
              <div className="flex justify-between text-[#98989D]">
                <span>Completeness:</span>
                <span className="font-semibold text-white">{content.completeness_score !== undefined ? content.completeness_score : '—'}/10</span>
              </div>
            </div>

            {content.gaps && content.gaps.length > 0 && (
              <div className="text-xs text-[#98989D] border-t border-white/[0.06] pt-3">
                <span className="text-white font-medium block mb-1">Missing Concept:</span>
                <p className="text-[#D1D1D6] leading-relaxed text-[11px]">{content.gaps[0]}</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. STAR Structure Agent */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-apple-card backdrop-blur-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF9F0A]" />
                <span>STAR Framework</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] font-semibold border border-[#FF9F0A]/25">
                {star.applicable ? "Behavioral" : "Technical"}
              </span>
            </div>

            {star.applicable ? (
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
                  <span className="text-[#98989D] block text-[10px]">SITUATION</span>
                  <span className="font-semibold text-white">{star.situation?.score || 0}/10</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
                  <span className="text-[#98989D] block text-[10px]">TASK</span>
                  <span className="font-semibold text-white">{star.task?.score || 0}/10</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
                  <span className="text-[#98989D] block text-[10px]">ACTION</span>
                  <span className="font-semibold text-white">{star.action?.score || 0}/10</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
                  <span className="text-[#98989D] block text-[10px]">RESULT</span>
                  <span className="font-semibold text-white">{star.result?.score || 0}/10</span>
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/[0.06] text-xs text-[#98989D] mb-4 leading-relaxed">
                STAR framework is tailored for behavioral questions. For system design and technical prompts, architectural trade-offs are prioritized.
              </div>
            )}

            {star.restructuring_recommendation && (
              <div className="text-xs text-[#98989D] border-t border-white/[0.06] pt-3">
                <span className="text-white font-medium block mb-1">Structural Guidance:</span>
                <p className="text-[#D1D1D6] text-[11px] leading-relaxed">{star.restructuring_recommendation}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evidence-Based Coaching Findings */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-apple-card backdrop-blur-2xl">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#FF9F0A]" />
          <span>Evidence-Based Observations</span>
        </h3>

        {coach.evidence_items && coach.evidence_items.length > 0 ? (
          <div className="space-y-3.5">
            {coach.evidence_items.map((item, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white text-sm">{item.issue}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    item.severity === 'high' ? 'bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/25' :
                    item.severity === 'medium' ? 'bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/25' :
                    'bg-white/[0.06] text-[#98989D]'
                  }`}>
                    {item.severity} severity
                  </span>
                </div>
                <div className="mb-2 bg-black/40 p-3 rounded-xl border border-white/[0.06] text-[#D1D1D6] italic text-[11px] leading-relaxed">
                  <span className="font-semibold not-italic text-[#98989D] mr-2">Observed:</span>
                  "{item.evidence}"
                </div>
                <div className="text-[#0A84FF] font-medium leading-relaxed">
                  <span className="text-[#98989D] mr-2">Coach Suggestion:</span>
                  {item.recommendation}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#98989D]">No critical evidence gaps detected in this answer.</p>
        )}

        {/* Actionable Advice List */}
        {coach.actionable_advice && coach.actionable_advice.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/[0.08]">
            <h4 className="text-xs font-semibold text-[#98989D] uppercase tracking-wider mb-3">
              Actionable Priorities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {coach.actionable_advice.map((adv, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 text-xs text-[#EBEBF5] flex items-start space-x-2 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-[#0A84FF] shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Improved Answer Structure Example */}
      {coach.improved_answer_structure && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-apple-card backdrop-blur-2xl">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <CornerDownRight className="w-5 h-5 text-[#0A84FF]" />
            <span>Exemplary Structural Restructuring</span>
          </h3>
          <p className="text-xs text-[#98989D] mb-4">
            How a senior candidate frames this exact scenario for executive clarity and impact:
          </p>
          <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-2xl p-4 sm:p-5 text-xs text-[#0A84FF]/90 whitespace-pre-line leading-relaxed font-mono">
            {coach.improved_answer_structure}
          </div>
        </div>
      )}

      {/* Interactive Personalized Follow-Up Practice */}
      {followUpQuestion && (
        <div className="bg-white/[0.04] border border-[#0A84FF]/30 rounded-3xl p-6 sm:p-8 shadow-apple-card backdrop-blur-2xl">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0A84FF] tracking-wide uppercase mb-2">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Targeted Follow-Up Question</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2 leading-snug">
            "{followUpQuestion}"
          </h3>
          <p className="text-xs text-[#98989D] mb-4">
            Direct follow-up generated by the Coach Agent to probe unaddressed trade-offs and decision ownership.
          </p>

          {!followUpFeedback ? (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={followUpAnswer}
                onChange={(e) => setFollowUpAnswer(e.target.value)}
                placeholder="Type your response to the follow-up question..."
                className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-2xl p-3.5 text-white text-xs focus:outline-none focus:border-[#0A84FF] transition leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  disabled={submittingFollowUp || !followUpAnswer.trim()}
                  onClick={handleFollowUpSubmit}
                  className="bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-medium text-xs px-5 py-2 rounded-full shadow-apple-pill flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingFollowUp ? "Evaluating..." : "Submit Follow-Up"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.04] p-4 rounded-2xl border border-[#0A84FF]/25 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#30D158] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Follow-Up Evaluated
                </span>
                <span className="font-bold text-white">
                  Score: {Math.round(followUpFeedback.coaching_feedback?.overall_score || 80)}/100
                </span>
              </div>
              <p className="text-[#D1D1D6] leading-relaxed">
                {followUpFeedback.coaching_feedback?.actionable_advice?.[0] || "Good refinement addressing the targeted gap."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
        <button
          onClick={onExit}
          className="text-xs font-medium text-[#98989D] hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition"
        >
          Return to Mode Selection
        </button>

        <button
          onClick={onNextQuestion}
          className="w-full sm:w-auto bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-medium text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-apple-pill flex items-center justify-center space-x-2 transition"
        >
          <span>Practice Another Question</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
