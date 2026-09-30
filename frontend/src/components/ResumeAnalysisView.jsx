import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  FileCheck,
  Cpu,
  Layers,
  Award,
  X,
  Target,
  Clock,
  Compass,
  HelpCircle,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { uploadCandidateResume, startResumeJDInterview } from '../services/api';

const SAMPLE_RESUME = `Alex Rivera
Email: alex.rivera@example.com
Role: Senior Backend & Cloud Engineer (4+ Years Experience)

Summary:
Backend engineer specialized in Python, FastAPI, PostgreSQL, and distributed cloud microservices. Proven record designing low-latency event-driven architectures and production Kubernetes workloads.

Technical Skills:
Python, FastAPI, Django, PostgreSQL, Redis, Docker, Kubernetes, AWS (ECS, RDS, S3), Git, CI/CD, Terraform, Linux, System Design, REST APIs, Microservices.

Work Experience:
• Senior Software Engineer at FinFlow Inc. (2023 - Present)
  - Designed distributed microservices handling 25M monthly transactions with sub-30ms P99 latency using FastAPI and PostgreSQL.
  - Reduced cloud infrastructure costs by 35% through Redis caching layers and AWS auto-scaling configurations.
  - Mentored 4 junior engineers on code reviews, design patterns, and unit testing best practices.

• Software Engineer at CloudData Labs (2021 - 2023)
  - Built ingestion REST APIs in Python/Django processing 10,000 requests/second.
  - Containerized 15 legacy applications using Docker and orchestrated zero-downtime rolling deployments via Kubernetes.

Key Projects:
• High-Throughput Stream Ingestion Engine
  - Architected asynchronous event pipeline using FastAPI, Kafka, and Redis.
  - Handled 15k RPS burst traffic with 99.98% uptime, reducing latency bottlenecks by 45%.
• Enterprise Schema Optimization & DB Sharding
  - Partitioned 500GB+ PostgreSQL customer analytics database, improving analytical query execution by 4x.`;

const SAMPLE_JD = `Senior Backend Engineer - Platform & Scale
Company: CloudScale Technologies
Location: Remote

Role Overview:
We are looking for a Senior Backend Engineer to architect, build, and scale our core platform microservices. You will collaborate across teams to design resilient distributed systems, optimize database performance, and ensure 99.99% availability under massive concurrency.

Required Qualifications & Skills:
• 4+ years of professional backend engineering experience.
• High proficiency in Python and modern frameworks (FastAPI or Django).
• Strong relational database fundamentals with PostgreSQL (indexing, query tuning, connection pooling).
• Hands-on production experience with containerization and orchestration (Docker, Kubernetes).
• Experience designing and managing microservices in Cloud environments (AWS or GCP).
• Familiarity with message brokers (Kafka or RabbitMQ) and caching strategies (Redis).
• Strong understanding of system design, distributed consensus, and fault-tolerant architecture.`;

export default function ResumeAnalysisView({ onStartInterview, candidate }) {
  const [targetRole, setTargetRole] = useState(candidate?.target_role || '');
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'experience' | 'projects' | 'skills' | 'questions'

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setError(null);
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === 'string') {
            setResumeText(event.target.result);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
  };

  const handleLoadSample = () => {
    setTargetRole('Senior Backend Engineer');
    setResumeFile(null);
    setResumeText(SAMPLE_RESUME);
    setJdText(SAMPLE_JD);
    setError(null);
  };

  const handleClearAll = () => {
    setResumeFile(null);
    setResumeText('');
    setJdText('');
    setOverviewData(null);
    setError(null);
  };

  // Generate Overview via LLM
  const handleGenerateOverview = async () => {
    if (!resumeFile && !resumeText.trim()) {
      setError('Please upload a resume file (.pdf, .txt) or paste your resume text on the left.');
      return;
    }
    if (!jdText.trim()) {
      setError('Please paste the target Job Description (JD) so the LLM can match your resume against role requirements.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await uploadCandidateResume(
        candidate?.candidate_id || 'candidate_001',
        resumeFile,
        resumeFile ? null : resumeText,
        jdText,
        targetRole
      );
      setOverviewData(data);
      setActiveTab('summary');
    } catch (err) {
      console.warn('Resume analysis error:', err);
      setError(err.message || 'Failed to analyze resume with LLM.');
    } finally {
      setLoading(false);
    }
  };

  // Launch interview tailored to this role and gap analysis
  const handleStartInterviewFromOverview = async () => {
    if (!jdText.trim()) {
      setError('Please provide a target Job Description to focus the interview questions.');
      return;
    }
    setStartingInterview(true);
    setError(null);
    try {
      const session = await startResumeJDInterview(
        candidate?.candidate_id || 'candidate_001',
        targetRole || 'Software Engineer',
        jdText,
        resumeFile,
        resumeFile ? null : resumeText,
        true
      );
      onStartInterview?.(session);
    } catch (err) {
      console.warn('Failed to start interview:', err);
      setError(err.message || 'Failed to launch tailored interview.');
    } finally {
      setStartingInterview(false);
    }
  };

  const analysis = overviewData?.analysis;
  const matchScore = analysis?.overall_match_score ?? overviewData?.capabilities?.[0]?.score ?? 75;
  const expAnalysis = analysis?.experience_analysis;
  const projAnalysis = analysis?.project_analysis;
  const skillsAnalysis = analysis?.skills_analysis;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <span>AI Resume &amp; Role Analyzer</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Attach your resume and target Job Description. The LLM extracts your true experience, projects, and skills to evaluate role fit and generate actionable gap insights.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleLoadSample}
            type="button"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Load Sample Data</span>
          </button>
          <button
            onClick={handleClearAll}
            type="button"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-xs font-semibold text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-900 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900 text-red-300 text-xs sm:text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Split-Screen Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols): Inputs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Role Card */}
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span>Target Role Title</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer, AI/ML Specialist..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Resume Upload Card */}
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Candidate Resume</span>
              </div>
              <label className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{resumeFile ? 'Change File' : 'Upload (.pdf, .txt)'}</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {resumeFile ? (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {resumeFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(resumeFile.size / 1024).toFixed(1)} KB • Native file attached
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={6}
                  className="w-full p-3 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Paste candidate resume text, project bullets, skills, and work history here..."
                />
                <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                  <span>{resumeText ? `${resumeText.trim().split(/\s+/).length} words` : 'Empty'}</span>
                  <span>Supports markdown &amp; plain text</span>
                </div>
              </div>
            )}
          </div>

          {/* Target Job Description Card */}
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span>Target Job Description (JD)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Required for Match</span>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={6}
              className="w-full p-3 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              placeholder="Paste the target job description requirements, responsibilities, and expected tech stack here..."
            />
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>{jdText ? `${jdText.trim().split(/\s+/).length} words` : 'Empty'}</span>
              <span>Matched by LLM in real-time</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerateOverview}
            disabled={loading}
            className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{loading ? 'Sending to LLM & Analyzing...' : 'Analyze Resume & Match Role with AI'}</span>
          </button>
        </div>

        {/* RIGHT COLUMN (7 cols): LLM Insights Display */}
        <div className="lg:col-span-7 bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[580px] flex flex-col justify-between">
          {analysis ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Seniority, Fit Score & Start Interview Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 border ${
                    matchScore >= 75
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : matchScore >= 50
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  }`}>
                    <Award className="w-4 h-4" />
                    <span>{matchScore}% Role Match</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">
                      {analysis.target_role || targetRole}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {expAnalysis?.seniority_level || 'Role Fit Assessment'}{expAnalysis?.detected_years !== undefined && expAnalysis?.detected_years !== null ? ` • ${expAnalysis.detected_years} YOE Detected` : ''}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleStartInterviewFromOverview}
                  disabled={startingInterview}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span>{startingInterview ? 'Preparing Session...' : 'Practice for this Role'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center space-x-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 overflow-x-auto">
                {[
                  { id: 'summary', label: 'Executive Summary', icon: Sparkles },
                  { id: 'experience', label: 'Experience Match', icon: Clock },
                  { id: 'projects', label: 'Projects Portfolio', icon: Layers },
                  { id: 'skills', label: 'Skills & Gaps', icon: Cpu },
                  { id: 'questions', label: 'Interview Questions', icon: HelpCircle },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: EXECUTIVE SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Fit Summary Box */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                    <p className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span>Role Fit Evaluation</span>
                    </p>
                    <p>{analysis.role_fit_summary}</p>
                  </div>

                  {/* Strengths & Critical Risks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Top Standout Strengths</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-emerald-200/90">
                        {(analysis.top_strengths || []).map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Critical Risks &amp; Role Gaps</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-amber-200/90">
                        {(analysis.critical_risks_or_gaps || []).map((g, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 shrink-0">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tailored Focus Areas */}
                  {analysis.tailored_focus_areas?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-400" />
                        <span>Priority Interview Focus Areas</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.tailored_focus_areas.map((fa, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700"
                          >
                            {fa}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXPERIENCE MATCH */}
              {activeTab === 'experience' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Seniority Alignment Card */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Experience Assessment</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {expAnalysis?.experience_match_score ?? analysis.overall_match_score ?? 70}% Experience Alignment
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {expAnalysis?.experience_match_summary || analysis.experience_level_match}
                    </p>
                  </div>

                  {/* Detected Work History */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Detected Work History ({expAnalysis?.work_history?.length || 0})
                    </span>
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {(expAnalysis?.work_history || []).map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              {exp.role_title} {exp.company_or_org ? `• ${exp.company_or_org}` : ''}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {exp.duration_or_dates || 'Recent'}
                            </span>
                          </div>
                          {exp.key_achievements?.length > 0 && (
                            <ul className="text-[11px] text-slate-400 space-y-1">
                              {exp.key_achievements.map((ach, aIdx) => (
                                <li key={aIdx} className="flex items-start gap-1.5">
                                  <span className="text-blue-400">•</span>
                                  <span>{ach}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience Strengths vs Gaps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-400">Background Strengths:</span>
                      <ul className="text-[11px] text-slate-300 space-y-1">
                        {(expAnalysis?.experience_strengths || []).map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-emerald-400">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-400">Background Gaps:</span>
                      <ul className="text-[11px] text-slate-300 space-y-1">
                        {(expAnalysis?.experience_gaps || []).map((g, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-amber-400">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PROJECTS PORTFOLIO */}
              {activeTab === 'projects' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Extracted Resume Projects ({projAnalysis?.detected_projects?.length || 0})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Evaluated for {targetRole}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {(projAnalysis?.detected_projects || []).map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {proj.name}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            proj.relevance_to_role?.toLowerCase() === 'high'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {proj.relevance_to_role || 'High'} Relevance
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {proj.description}
                        </p>

                        {/* Tech Stack */}
                        {proj.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {proj.technologies.map((t, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {proj.measurable_impact && (
                          <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-[11px] text-emerald-300">
                            <strong>Impact:</strong> {proj.measurable_impact}
                          </div>
                        )}

                        {proj.probing_areas?.length > 0 && (
                          <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 text-[11px] text-slate-400">
                            <strong className="text-blue-400">Interviewer Probe:</strong>{' '}
                            {proj.probing_areas.join(' • ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Recommended PoCs */}
                  {projAnalysis?.recommended_projects_to_build?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-1.5">
                      <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Recommended PoCs to Build for this Role:</span>
                      </span>
                      <ul className="text-[11px] text-blue-200/90 space-y-1">
                        {projAnalysis.recommended_projects_to_build.map((rec, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-1">
                            <span className="text-blue-400 shrink-0">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SKILLS & GAPS */}
              {activeTab === 'skills' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Verified Strengths vs Missing Gaps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Resume Strengths ({analysis.matched_skills?.length || 0})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(analysis.matched_skills || []).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/30 space-y-2">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Missing JD Skill Gaps ({analysis.missing_skills?.length || 0})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(analysis.missing_skills || []).map((g, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Skill Gap Cards */}
                  {analysis.skill_gap_details?.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        In-Depth Gap Breakdown &amp; Action Plan
                      </span>
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {analysis.skill_gap_details.map((gap, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">
                                {gap.skill_or_domain}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                gap.severity?.toLowerCase() === 'critical'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}>
                                {gap.severity || 'High'} Priority
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300">
                              <strong className="text-slate-400">Why it matters:</strong> {gap.why_it_matters}
                            </p>

                            <p className="text-[11px] text-slate-300">
                              <strong className="text-blue-400">How to bridge:</strong> {gap.how_to_improve}
                            </p>

                            {gap.talking_points && (
                              <div className="p-2 rounded-lg bg-blue-950/20 border border-blue-900/30 text-[11px] text-blue-300">
                                <strong>Interview Talking Point:</strong> {gap.talking_points}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: INTERVIEW QUESTIONS & ROADMAP */}
              {activeTab === 'questions' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Tailored Technical Questions */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>Role-Grounded Technical Questions</span>
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(analysis.recommended_technical_questions || []).map((q, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-200"
                        >
                          <span className="text-blue-400 font-bold mr-1.5">Q{idx + 1}:</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gap Probing Scenario Questions */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      <span>Scenario &amp; Gap Probing Questions</span>
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(analysis.recommended_gap_probing_questions || []).map((q, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-200"
                        >
                          <span className="text-amber-400 font-bold mr-1.5">Scenario {idx + 1}:</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3-Phase Improvement Roadmap */}
                  {analysis.improvement_roadmap?.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                        <span>3-Phase Strategic Roadmap to Close Gaps</span>
                      </span>
                      <div className="space-y-2">
                        {analysis.improvement_roadmap.map((phase, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1"
                          >
                            <span className="font-bold text-emerald-400">{phase.phase}</span>
                            <p className="text-slate-300 text-[11px]">{phase.focus}</p>
                            {phase.actions?.length > 0 && (
                              <ul className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                                {phase.actions.map((act, aIdx) => (
                                  <li key={aIdx} className="flex items-start gap-1">
                                    <span className="text-blue-400">•</span>
                                    <span>{act}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="my-auto text-center space-y-4 py-16">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <Target className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">
                  Ready to Analyze Your Resume &amp; Role Fit
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Attach your resume file or paste text on the left, then paste the target Job Description (JD). When you click <strong>"Analyze Resume &amp; Match Role with AI"</strong>, the LLM will parse your real experience, projects, and skills to provide customized insights and interview preparation.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleLoadSample}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 text-xs font-semibold border border-blue-500/30 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try with Sample Resume &amp; JD</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
