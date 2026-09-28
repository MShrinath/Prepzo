import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, ArrowRight, Sparkles, MessageSquare,
  Award, ShieldAlert, CornerDownRight, RotateCcw, Send, Volume2
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

  const overallScore = Math.round(coach.overall_score || 75);
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

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-red-400 border-red-500/30 bg-red-500/10";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner: Overall Score & Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Agent Synthesis Complete</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Evaluation & Coaching Report
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Specialized analysis by Communication, Content, and STAR Agents synthesized by the Coach Agent.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="text-center">
              <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Overall Score
              </span>
              <div className="text-4xl font-black text-white tracking-tight">
                {overallScore}<span className="text-lg text-slate-500 font-normal">/100</span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${getScoreColor(overallScore)}`}>
              {overallScore >= 80 ? "Exceeds Expectations" : (overallScore >= 60 ? "Proficient" : "Needs Practice")}
            </div>
          </div>
        </div>

        {/* Question & Answer Summary Accordion */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
            <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">Original Question:</span>
            <p className="text-slate-200 font-medium">{questionText}</p>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
            <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">Candidate Answer / Transcript:</span>
            <p className="text-slate-300 italic line-clamp-3">"{responseText}"</p>
          </div>
        </div>
      </div>

      {/* Tri-Agent Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Communication Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>Communication</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                {comm.communication_quality_score ? `${comm.communication_quality_score}/10` : '8/10'}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Clarity:</span>
                <span className="font-semibold text-white">{comm.clarity_score || 8}/10</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Conciseness:</span>
                <span className="font-semibold text-white">{comm.conciseness_score || 7}/10</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Structure:</span>
                <span className="font-semibold text-white">{comm.structure_score || 8}/10</span>
              </div>
              {comm.filler_words_score !== undefined && (
                <div className="flex justify-between text-slate-400">
                  <span>Filler Words:</span>
                  <span className="font-semibold text-amber-400">{comm.filler_words_score} detected</span>
                </div>
              )}
            </div>

            {comm.weaknesses && comm.weaknesses.length > 0 && (
              <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span className="font-semibold text-slate-300 block mb-1">Key Observation:</span>
                <p className="text-slate-300">{comm.weaknesses[0]}</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Content Evaluation Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>Content & Depth</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                {content.relevance_score ? `${content.relevance_score}/10` : '8/10'}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Relevance:</span>
                <span className="font-semibold text-white">{content.relevance_score || 8}/10</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Technical Depth:</span>
                <span className="font-semibold text-white">{content.technical_depth_score || 7}/10</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Correctness:</span>
                <span className="font-semibold text-white">{content.correctness_score || 8}/10</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Completeness:</span>
                <span className="font-semibold text-white">{content.completeness_score || 7}/10</span>
              </div>
            </div>

            {content.gaps && content.gaps.length > 0 && (
              <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span className="font-semibold text-slate-300 block mb-1">Missing Detail:</span>
                <p className="text-slate-300">{content.gaps[0]}</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. STAR Structure Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>STAR Structure</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                {star.applicable ? "Behavioral" : "Technical"}
              </span>
            </div>

            {star.applicable ? (
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Situation</span>
                  <span className="font-bold text-white">{star.situation?.score || 7}/10</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Task</span>
                  <span className="font-bold text-white">{star.task?.score || 6}/10</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Action</span>
                  <span className="font-bold text-white">{star.action?.score || 7}/10</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Result</span>
                  <span className="font-bold text-white">{star.result?.score || 5}/10</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 mb-4">
                STAR structure is role-tailored for behavioral responses. For technical questions, problem scoping and architectural trade-offs are prioritized.
              </div>
            )}

            {star.restructuring_recommendation && (
              <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span className="font-semibold text-slate-300 block mb-1">Structure Advice:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{star.restructuring_recommendation}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evidence-Based Coaching Findings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>Evidence-Based Feedback & Actionable Recommendations</span>
        </h3>

        {coach.evidence_items && coach.evidence_items.length > 0 ? (
          <div className="space-y-4">
            {coach.evidence_items.map((item, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">{item.issue}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.severity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    item.severity === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {item.severity} severity
                  </span>
                </div>
                <div className="mb-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-slate-300 italic">
                  <span className="font-semibold not-italic text-slate-400 mr-1">Evidence:</span>
                  "{item.evidence}"
                </div>
                <div className="text-indigo-300 font-medium">
                  <span className="font-semibold text-slate-400 mr-1">Recommendation:</span>
                  {item.recommendation}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No critical evidence gaps detected in this answer.</p>
        )}

        {/* Actionable Advice List */}
        {coach.actionable_advice && coach.actionable_advice.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Actionable Coaching Priorities:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {coach.actionable_advice.map((adv, i) => (
                <div key={i} className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 text-xs text-slate-300 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Improved Answer Structure Example */}
      {coach.improved_answer_structure && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <CornerDownRight className="w-5 h-5 text-indigo-400" />
            <span>Optimal Answer Restructuring</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            How you can reframe this exact scenario for maximum executive clarity and impact:
          </p>
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 text-xs font-mono text-indigo-200 whitespace-pre-line leading-relaxed">
            {coach.improved_answer_structure}
          </div>
        </div>
      )}

      {/* Interactive Personalized Follow-Up Practice */}
      {followUpQuestion && (
        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
            <RotateCcw className="w-4 h-4" />
            <span>Targeted Follow-up Question</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            "{followUpQuestion}"
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            The Coach Agent generated this follow-up directly from your answer to test unaddressed trade-offs and personal ownership.
          </p>

          {!followUpFeedback ? (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={followUpAnswer}
                onChange={(e) => setFollowUpAnswer(e.target.value)}
                placeholder="Type your response to the follow-up question..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  disabled={submittingFollowUp || !followUpAnswer.trim()}
                  onClick={handleFollowUpSubmit}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingFollowUp ? "Evaluating..." : "Submit Follow-up"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/80 p-4 rounded-xl border border-indigo-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">Follow-up Evaluated Successfully</span>
                <span className="font-bold text-white">
                  Score: {Math.round(followUpFeedback.coaching_feedback?.overall_score || 80)}/100
                </span>
              </div>
              <p className="text-slate-300">
                {followUpFeedback.coaching_feedback?.actionable_advice?.[0] || "Good refinement addressing the targeted gap."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onExit}
          className="text-xs font-semibold text-slate-400 hover:text-white px-4 py-2 rounded-xl transition"
        >
          Return to Mode Selection
        </button>

        <button
          onClick={onNextQuestion}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition"
        >
          <span>Practice Another Question</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
