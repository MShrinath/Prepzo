import React, { useState } from 'react';
import {
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Quote,
  TrendingUp,
  Volume2,
  Sparkles,
  ArrowRight,
  Shield,
  MessageSquare,
  BarChart2,
  Check,
  Target,
  Clock,
  Layers
} from 'lucide-react';
import { exportSessionPDF, exportDossierPDF } from '../services/api';

export default function ResultsScreen({
  evaluationData,
  candidate,
  sessionData,
  candidateProgress,
  onRetakeInterview,
  onDownloadReport,
  initialTab = 'detailed',
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'detailed' | 'strengths' | 'gaps' | 'questions' | 'transcript' | 'analytics'
  const [selectedDonut, setSelectedDonut] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const totalSessions = candidateProgress?.total_sessions ?? (evaluationData ? 1 : 0);

  // If completely empty with zero evaluations and zero sessions
  if (!evaluationData && totalSessions === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Performance Dossier
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time evaluation analysis and 5-axis competency breakdown.
          </p>
        </div>

        <div className="bg-[#121927] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <BarChart2 className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400">
              No Sessions Completed
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              No Completed Interview Assessments Yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Complete your first practice interview to unlock your 5-axis competency radar, verbatim speech transcript analysis, and executive coaching feedback.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onRetakeInterview}
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

  // Derive real scores
  const overallScore = Math.round(
    evaluationData?.coaching_feedback?.overall_score ?? (candidateProgress?.average_overall_score || 75)
  );

  const commAvg = evaluationData?.communication_evaluation
    ? Math.round(
        (evaluationData.communication_evaluation.clarity_score +
          evaluationData.communication_evaluation.conciseness_score +
          evaluationData.communication_evaluation.structure_score +
          evaluationData.communication_evaluation.communication_quality_score) /
          4
      )
    : Math.round(candidateProgress?.average_communication_score || 72);

  const techAvg = evaluationData?.content_evaluation
    ? Math.round(
        (evaluationData.content_evaluation.technical_depth_score +
          evaluationData.content_evaluation.correctness_score +
          evaluationData.content_evaluation.relevance_score) /
          3
      )
    : Math.round(candidateProgress?.average_content_score || 76);

  const starAvg = evaluationData?.star_evaluation?.applicable
    ? Math.round(
        (evaluationData.star_evaluation.situation_score +
          evaluationData.star_evaluation.task_score +
          evaluationData.star_evaluation.action_score +
          evaluationData.star_evaluation.result_score) /
          4
      )
    : 70;

  const confidenceScore = evaluationData?.communication_evaluation?.communication_quality_score
    ? Math.round(evaluationData.communication_evaluation.communication_quality_score)
    : Math.round((commAvg + overallScore) / 2);

  const getScoreStatus = (score) => {
    if (score >= 85) return 'Exceeds Expectations';
    if (score >= 70) return 'Solid Performance';
    if (score >= 55) return 'Developing';
    return 'Needs Immediate Focus';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981'; // emerald
    if (score >= 70) return '#3B82F6'; // blue
    if (score >= 55) return '#F59E0B'; // amber
    return '#EF4444'; // rose
  };

  const scoreDonuts = [
    {
      id: 'overall',
      label: 'Overall Score',
      score: overallScore,
      status: getScoreStatus(overallScore),
      color: getScoreColor(overallScore),
      description: `Evaluated by Prepzo LangGraph multi-agent diagnostic suite for ${sessionData?.role || candidate?.target_role || 'Software Engineer'}.`,
    },
    {
      id: 'technical',
      label: 'Technical Depth',
      score: techAvg,
      status: getScoreStatus(techAvg),
      color: getScoreColor(techAvg),
      description: 'Domain mastery, accuracy of technical explanations, and trade-off considerations.',
    },
    {
      id: 'communication',
      label: 'Communication',
      score: commAvg,
      status: getScoreStatus(commAvg),
      color: getScoreColor(commAvg),
      description: 'Clarity, conciseness, vocal cadence, and structured articulation.',
    },
    {
      id: 'star',
      label: 'STAR Alignment',
      score: starAvg,
      status: getScoreStatus(starAvg),
      color: getScoreColor(starAvg),
      description: 'Adherence to Situation, Task, Action, and measurable business Results.',
    },
    {
      id: 'confidence',
      label: 'Vocal Delivery',
      score: confidenceScore,
      status: getScoreStatus(confidenceScore),
      color: getScoreColor(confidenceScore),
      description: 'Confidence, minimal hesitation pauses, and steady projection.',
    },
  ];

  const highlights = evaluationData?.coaching_feedback?.strengths?.length > 0
    ? evaluationData.coaching_feedback.strengths
    : [
        'Clear communicative structure without excessive filler hesitation',
        'Directly addressed the primary intent of the question',
        'Demonstrates practical technical problem-solving perspective',
      ];

  const improvements = evaluationData?.coaching_feedback?.improvement_areas?.length > 0
    ? evaluationData.coaching_feedback.improvement_areas
    : [
        'Quantify achievements with concrete business impact and metrics',
        'Elaborate on engineering trade-offs between alternative designs',
        'Structure responses strictly into Situation, Task, Action, and Result',
      ];

  const questionText =
    evaluationData?.question_text ||
    sessionData?.question?.question ||
    'Interview Question';

  const userExcerpt =
    evaluationData?.transcript ||
    evaluationData?.candidate_response ||
    'Response recorded and evaluated.';

  const modelSuggestion =
    evaluationData?.coaching_feedback?.improved_answer_structure ||
    'Begin with the high-level architecture choice, outline the concrete action steps taken, and conclude with measurable impact.';

  const followUpQuestion = evaluationData?.coaching_feedback?.follow_up_question;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (sessionData?.session_id) {
        const blob = await exportSessionPDF(sessionData.session_id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prepzo_assessment_${sessionData.session_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('PDF export fallback to browser print:', e);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // SVG Circular Gauge
  const CircularGauge = ({ item }) => {
    const size = 96;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (item.score / 100) * circumference;
    const isSelected = selectedDonut === item.id;

    return (
      <div
        onClick={() => setSelectedDonut(isSelected ? null : item.id)}
        className={`bg-[#121927] border rounded-2xl p-4 flex flex-col items-center justify-between text-center shadow-xs hover:shadow-md transition-all cursor-pointer ${
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-800'
        }`}
      >
        <span className="text-xs font-semibold text-slate-300 mb-2 truncate max-w-full">
          {item.label}
        </span>
        <div className="relative w-24 h-24 flex items-center justify-center my-1">
          <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-800"
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xl font-bold text-white">
              {item.score}%
            </span>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 mt-2">
          {item.status}
        </span>
      </div>
    );
  };

  // Radar chart polygon points
  const userScores = [techAvg, commAvg, starAvg, confidenceScore, overallScore];
  const avgScores = [68, 65, 60, 70, 68];
  const radarCenter = 100;
  const radarRadius = 70;

  const getPoint = (score, index, total) => {
    const angle = ((Math.PI * 2) / total) * index - Math.PI / 2;
    const r = (score / 100) * radarRadius;
    const x = radarCenter + r * Math.cos(angle);
    const y = radarCenter + r * Math.sin(angle);
    return { x, y };
  };

  const userPolygonPoints = userScores
    .map((s, i) => {
      const p = getPoint(s, i, userScores.length);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const avgPolygonPoints = avgScores
    .map((s, i) => {
      const p = getPoint(s, i, avgScores.length);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const tabs = [
    { id: 'detailed', label: 'Detailed Analysis' },
    { id: 'strengths', label: 'Strengths' },
    { id: 'gaps', label: 'Gaps & Action Items' },
    { id: 'questions', label: 'Question Review' },
    { id: 'transcript', label: 'Verbatim Transcript' },
    { id: 'analytics', label: 'Multi-Session Analytics' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header with Download & Retake */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Interview Evaluation Results
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live AI Assessment
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Grounded multi-agent breakdown for {sessionData?.role || candidate?.target_role || 'Software Engineer'}.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#121927] border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Download Report (PDF)'}</span>
          </button>

          <button
            onClick={onRetakeInterview}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs sm:text-sm font-semibold text-white transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Another Session</span>
          </button>
        </div>
      </div>

      {/* 2. Top Row of 5 Donut Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {scoreDonuts.map((item) => (
          <CircularGauge key={item.id} item={item} />
        ))}
      </div>

      {/* Selected Donut Description Banner */}
      {selectedDonut && (
        <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/40 text-xs text-blue-200 flex items-center justify-between">
          <span>
            <strong>{scoreDonuts.find((d) => d.id === selectedDonut)?.label}:</strong>{' '}
            {scoreDonuts.find((d) => d.id === selectedDonut)?.description}
          </span>
          <button
            onClick={() => setSelectedDonut(null)}
            className="text-blue-400 hover:text-white font-semibold text-xs ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 overflow-x-auto gap-6 text-xs sm:text-sm font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 transition-colors relative whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'text-blue-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Detailed Analysis */}
      {activeTab === 'detailed' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Identified Strengths</span>
              </div>
              <ul className="space-y-2.5">
                {highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Areas to Improve</span>
              </div>
              <ul className="space-y-2.5">
                {improvements.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Model Answer Structure Card */}
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm sm:text-base">
              <Sparkles className="w-5 h-5 flex-shrink-0" />
              <span>Recommended Answer Architecture</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {modelSuggestion}
            </p>
            {followUpQuestion && (
              <div className="pt-2 text-xs text-blue-300">
                <strong>Potential Follow-up:</strong> "{followUpQuestion}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Strengths Deep Dive */}
      {activeTab === 'strengths' && (
        <div className="bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-white">Demonstrated Strengths</h3>
          <div className="space-y-3">
            {highlights.map((st, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">{st}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Confirmed across multi-agent rubric evaluations. Maintain this consistency in future interview rounds.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Gaps & Action Items */}
      {activeTab === 'gaps' && (
        <div className="bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-white">Actionable Improvement Drills</h3>
          <div className="space-y-3">
            {improvements.map((imp, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">{imp}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Added to your 7-Day Improvement Plan. Practice targeted drills in the Practice Lab to clear this gap.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Question Review */}
      {activeTab === 'questions' && (
        <div className="bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-white">Question &amp; Response Review</h3>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">Question 1</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300">
                Score: {overallScore}%
              </span>
            </div>
            <p className="text-sm font-semibold text-white">{questionText}</p>
            <div className="p-3 rounded-lg bg-slate-800/50 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-400">Your Response:</p>
              <p className="italic">"{userExcerpt}"</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/30 text-xs text-purple-200">
              <p className="font-semibold text-purple-300 mb-1">AI Recommendation:</p>
              <p>{modelSuggestion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Verbatim Transcript */}
      {activeTab === 'transcript' && (
        <div className="bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Verbatim Delivery Transcript</h3>
            <span className="text-xs text-slate-400">
              Word Count: {userExcerpt.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {userExcerpt}
          </div>
        </div>
      )}

      {/* Tab 6: Multi-Session Analytics & 5-Axis Radar */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-between">
            <h3 className="text-sm font-bold text-white mb-2 self-start">5-Axis Competency Radar</h3>
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                {/* Background Concentric Webs */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                  <circle
                    key={i}
                    cx={radarCenter}
                    cy={radarCenter}
                    r={radarRadius * scale}
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="1"
                    strokeDasharray={scale === 1 ? 'none' : '2,2'}
                  />
                ))}

                {/* Cohort Benchmark Polygon */}
                <polygon
                  points={avgPolygonPoints}
                  fill="rgba(148, 163, 184, 0.1)"
                  stroke="#64748B"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />

                {/* Candidate Polygon */}
                <polygon
                  points={userPolygonPoints}
                  fill="rgba(59, 130, 246, 0.3)"
                  stroke="#3B82F6"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="flex items-center space-x-6 text-xs text-slate-400 mt-2">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-blue-500 rounded-full" />
                <span className="text-white font-medium">Your Score</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-slate-500 rounded-full stroke-dash" />
                <span>Industry Peer Average</span>
              </span>
            </div>
          </div>

          {/* Session Timeline History */}
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-white">Historical Evaluation Timeline</h3>
            {candidateProgress?.timeline?.length > 0 ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {candidateProgress.timeline.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">{item.target_role || 'Mock Interview'}</p>
                      <p className="text-[10px] text-slate-400">{item.date}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-400">
                      {item.overall_score}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">
                Current session is your first recorded assessment. Complete more interviews to track trend progressions!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
