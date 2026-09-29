import React, { useState } from 'react';
import {
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Quote,
  TrendingUp,
  ArrowDownCircle,
  FileCheck,
  Play,
  Volume2,
  Sparkles,
  ArrowRight,
  Layers,
  Shield,
  MessageSquare,
  BarChart2,
  Check
} from 'lucide-react';

export default function ResultsScreen({
  evaluationData,
  onRetakeInterview,
  onDownloadReport,
  candidate,
  initialTab = 'detailed',
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'detailed' | 'strengths' | 'gaps' | 'questions' | 'transcript' | 'analytics'
  const [selectedDonut, setSelectedDonut] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const scoreDonuts = [
    {
      id: 'overall',
      label: 'Overall Score',
      score: 78,
      status: 'Good Performance',
      color: '#10B981', // green
      description: 'Above the 75th percentile for Mid-Level Software Engineer interviews.',
    },
    {
      id: 'technical',
      label: 'Technical Knowledge',
      score: 82,
      status: 'Strong',
      color: '#3B82F6', // blue
      description: 'Solid grasp of distributed systems, indexing, and transactional boundaries.',
    },
    {
      id: 'communication',
      label: 'Communication',
      score: 75,
      status: 'Good',
      color: '#F59E0B', // orange
      description: 'Crisp delivery with natural cadence; minimal hesitation.',
    },
    {
      id: 'star',
      label: 'STAR Structure',
      score: 70,
      status: 'Needs Work',
      color: '#8B5CF6', // purple
      description: 'Actions were described well, but measurable business results can be sharper.',
    },
    {
      id: 'confidence',
      label: 'Confidence',
      score: 78,
      status: 'Good',
      color: '#14B8A6', // teal
      description: 'Steady vocal pitch and confident voice projection throughout.',
    },
  ];

  const highlights = [
    'Good understanding of technical fundamentals',
    'Clear and concise explanations',
    'Relevant real-world examples',
    'Good problem-solving approach',
  ];

  const improvements = [
    'Provide more structured STAR responses',
    'Avoid filler words and long pauses',
    'Go deeper into trade-offs and edge cases',
    'Be more concise in your answers',
  ];

  const questionsReview = [
    {
      qNum: 1,
      question: 'Explain the difference between SQL and NoSQL databases. When would you choose one over the other?',
      score: 84,
      status: 'Strong',
      userExcerpt: 'SQL databases are relational and use a fixed schema, while NoSQL databases are non-relational and more flexible...',
      modelSuggestion: 'Good job highlighting ACID vs BASE. Mentioning CAP theorem tradeoffs (Partition tolerance vs Consistency) would elevate this to Senior level.',
    },
    {
      qNum: 2,
      question: 'Can you give a real-world example where you used or would prefer NoSQL over SQL?',
      score: 78,
      status: 'Good',
      userExcerpt: 'In our e-commerce platform, we used MongoDB for catalog management because products had heterogeneous attributes...',
      modelSuggestion: 'Clear architecture rationale. Highlight the migration strategy or data validation mechanisms used in production.',
    },
    {
      qNum: 3,
      question: 'Tell me about a time you had a technical disagreement with a team member. How did you resolve it?',
      score: 72,
      status: 'Needs STAR Polish',
      userExcerpt: 'We disagreed on whether to use GraphQL or REST. I set up a spike benchmark to compare payload latency...',
      modelSuggestion: 'Good Action step! Add a concrete measurable Result (e.g. reduced mobile bundle size by 35% and unblocked the team by 3 days).',
    },
  ];

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      window.print();
    }, 400);
  };

  // SVG Circular Gauge helper
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
        className={`bg-white dark:bg-[#121927] border rounded-2xl p-4 flex flex-col items-center justify-between text-center shadow-xs hover:shadow-md transition-all cursor-pointer ${
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400'
            : 'border-slate-200 dark:border-slate-800/90'
        }`}
      >
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 truncate max-w-full">
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
              className="text-slate-100 dark:text-slate-800"
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
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {item.score}%
            </span>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
          {item.status}
        </span>
      </div>
    );
  };

  // Radar Calculations
  const userScores = [82, 75, 70, 78, 85];
  const avgScores = [68, 65, 60, 70, 68];
  const radarCenter = 100;
  const radarRadius = 70;

  const getPoint = (score, index, total) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
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

  const trendData = [
    { label: 'Oct 1', score: 35, x: 25, y: 75 },
    { label: 'Oct 8', score: 50, x: 95, y: 62 },
    { label: 'Oct 15', score: 58, x: 165, y: 55 },
    { label: 'Oct 22', score: 68, x: 235, y: 42 },
    { label: 'Oct 30', score: 78, x: 305, y: 28 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header with Download & Retake */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Interview Results
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's a detailed analysis of your performance.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating Report...' : 'Download Report'}</span>
          </button>

          <button
            onClick={onRetakeInterview}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs sm:text-sm font-semibold text-white transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Interview</span>
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
        <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {scoreDonuts.find((d) => d.id === selectedDonut)?.label}:
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              {scoreDonuts.find((d) => d.id === selectedDonut)?.description}
            </span>
          </div>
          <button
            onClick={() => setSelectedDonut(null)}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Secondary Nav Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center space-x-6 overflow-x-auto text-xs sm:text-sm font-medium scrollbar-none">
        {[
          { id: 'detailed', label: 'Detailed Feedback' },
          { id: 'strengths', label: 'Strengths' },
          { id: 'gaps', label: 'Areas to Improve' },
          { id: 'questions', label: 'Question Review' },
          { id: 'transcript', label: 'Transcript' },
          { id: 'analytics', label: 'Analytics' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 whitespace-nowrap cursor-pointer transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 4. Tab Content Area */}

      {/* TAB 1: Detailed Feedback (Default / Screenshot Match) */}
      {activeTab === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Overall Feedback + Highlights + Areas to Improve */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overall Feedback Card */}
            <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Overall Feedback
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You demonstrated a good understanding of core concepts and explained your thought process clearly. Your examples were relevant, but you can improve on providing more structured answers, especially for behavioral questions.
              </p>

              {/* Quote Box */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start space-x-3">
                <Quote className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 fill-blue-600/10" />
                <p className="text-xs text-blue-900 dark:text-blue-200 font-medium leading-relaxed italic">
                  "Your technical explanations are clear and show practical knowledge. With more structured answers using the STAR method, your responses can be even stronger."
                </p>
              </div>
            </div>

            {/* Highlights & Areas to Improve Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Key Highlights */}
              <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Key Highlights
                </h4>
                <ul className="space-y-2.5">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Areas to Improve
                </h4>
                <ul className="space-y-2.5">
                  {improvements.map((imp, i) => (
                    <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <ArrowDownCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Skill Breakdown Radar & Score Trend Chart */}
          <div className="lg:col-span-5 space-y-6">
            {/* Skill Breakdown Radar Chart */}
            <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Skill Breakdown
                </h3>
                <div className="flex items-center space-x-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                    <span>Your Score</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" />
                    <span>Average</span>
                  </span>
                </div>
              </div>

              {/* Radar Canvas */}
              <div className="relative flex items-center justify-center p-2">
                <svg viewBox="0 0 200 200" className="w-full max-w-[240px] h-auto overflow-visible">
                  {[0.25, 0.5, 0.75, 1.0].map((scale) => {
                    const pts = [0, 1, 2, 3, 4]
                      .map((i) => {
                        const p = getPoint(scale * 100, i, 5);
                        return `${p.x},${p.y}`;
                      })
                      .join(' ');
                    return (
                      <polygon
                        key={scale}
                        points={pts}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-slate-200 dark:text-slate-700/60"
                      />
                    );
                  })}

                  {[0, 1, 2, 3, 4].map((i) => {
                    const p = getPoint(100, i, 5);
                    return (
                      <line
                        key={i}
                        x1={radarCenter}
                        y1={radarCenter}
                        x2={p.x}
                        y2={p.y}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-slate-200 dark:text-slate-700/60"
                      />
                    );
                  })}

                  {/* Average Polygon */}
                  <polygon
                    points={avgPolygonPoints}
                    fill="rgba(148, 163, 184, 0.15)"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                  />

                  {/* Candidate Polygon */}
                  <polygon
                    points={userPolygonPoints}
                    fill="rgba(59, 130, 246, 0.25)"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />

                  {userScores.map((s, i) => {
                    const p = getPoint(s, i, userScores.length);
                    return (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="#3B82F6"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  <text x="100" y="20" textAnchor="middle" className="text-[9px] fill-slate-500 dark:fill-slate-400 font-medium">Technical</text>
                  <text x="178" y="75" textAnchor="start" className="text-[9px] fill-slate-500 dark:fill-slate-400 font-medium">Communication</text>
                  <text x="150" y="185" textAnchor="middle" className="text-[9px] fill-slate-500 dark:fill-slate-400 font-medium">STAR</text>
                  <text x="50" y="185" textAnchor="middle" className="text-[9px] fill-slate-500 dark:fill-slate-400 font-medium">Confidence</text>
                  <text x="15" y="75" textAnchor="end" className="text-[9px] fill-slate-500 dark:fill-slate-400 font-medium">Problem Solving</text>
                </svg>
              </div>
            </div>

            {/* Score Trend Card */}
            <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Score Trend
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">78%</span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    +12%
                  </span>
                </div>
              </div>

              <div className="relative pt-2">
                <svg viewBox="0 0 330 100" className="w-full h-24 overflow-visible">
                  <line x1="25" y1="20" x2="310" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" />
                  <line x1="25" y1="50" x2="310" y2="50" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" />
                  <line x1="25" y1="80" x2="310" y2="80" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" />

                  <text x="5" y="24" className="text-[8px] fill-slate-400">80</text>
                  <text x="5" y="54" className="text-[8px] fill-slate-400">40</text>
                  <text x="5" y="84" className="text-[8px] fill-slate-400">0</text>

                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 25 75 Q 95 62 165 55 T 305 28 L 305 85 L 25 85 Z"
                    fill="url(#trendGradient)"
                  />
                  <path
                    d="M 25 75 Q 95 62 165 55 T 305 28"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {trendData.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#3B82F6"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  ))}

                  {trendData.map((pt, i) => (
                    <text
                      key={i}
                      x={pt.x}
                      y="96"
                      textAnchor="middle"
                      className="text-[8px] fill-slate-400"
                    >
                      {pt.label}
                    </text>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Strengths Deep Dive */}
      {activeTab === 'strengths' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {highlights.map((h, i) => (
            <div key={i} className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  Strength #{i + 1}
                </span>
                <span className="text-xs font-bold text-emerald-500">92% Mastery</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{h}</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Demonstrated high fluency and clarity during your architectural comparison between relational and non-relational database trade-offs.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Areas to Improve Deep Dive */}
      {activeTab === 'gaps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {improvements.map((imp, i) => (
            <div key={i} className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  Growth Area #{i + 1}
                </span>
                <span className="text-xs font-bold text-amber-500">Priority High</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <ArrowDownCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{imp}</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Structured drills are scheduled in your 7-Day Improvement Plan to resolve this specific speech habit before your final round.
              </p>
              <button
                onClick={onRetakeInterview}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1 cursor-pointer"
              >
                <span>Practice this skill now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Question Review */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {questionsReview.map((q) => (
            <div key={q.qNum} className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  Question #{q.qNum}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Score: {q.score}% ({q.status})
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {q.question}
              </h4>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 italic">
                "{q.userExcerpt}"
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-bold">Coach Tip:</span> {q.modelSuggestion}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: Transcript */}
      {activeTab === 'transcript' && (
        <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Full Interview Transcript
          </h3>
          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-purple-600 dark:text-purple-400 mr-2">[10:14 AM] AI Interviewer:</span>
              <span className="text-slate-800 dark:text-slate-200">Explain the difference between SQL and NoSQL databases. When would you choose one over the other?</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
              <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">[10:16 AM] Sai Revanth:</span>
              <span className="text-slate-800 dark:text-slate-200">SQL databases are relational and use a fixed schema, while NoSQL databases are non-relational and more flexible. I would choose SQL when data consistency and complex queries are important, and NoSQL when dealing with large scale, unstructured data or when we need high scalability.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-purple-600 dark:text-purple-400 mr-2">[10:16 AM] AI Interviewer:</span>
              <span className="text-slate-800 dark:text-slate-200">Good answer! Can you give a real-world example where you used or would prefer NoSQL over SQL?</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Speaking Pace</span>
            <div className="text-2xl font-bold text-emerald-500">142 WPM</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Optimal conversation speed. Not rushed.</p>
          </div>
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Filler Frequency</span>
            <div className="text-2xl font-bold text-blue-500">1.2%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Only 2 fillers across 4.5 minutes of recording.</p>
          </div>
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Voice Modulation</span>
            <div className="text-2xl font-bold text-purple-500">86/100</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Strong conviction and clear vocal inflection.</p>
          </div>
        </div>
      )}
    </div>
  );
}
