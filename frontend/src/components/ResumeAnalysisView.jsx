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
  Target
} from 'lucide-react';
import { uploadCandidateResume, startResumeJDInterview } from '../services/api';

export default function ResumeAnalysisView({ onStartInterview, candidate }) {
  const [jdText, setJdText] = useState(
    'We are looking for a Software Engineer with strong experience in Python, FastAPI, and PostgreSQL. Experience with Docker, Kubernetes, and AWS is preferred. The ideal candidate takes ownership of microservices and coordinates across teams.'
  );
  const [resumeText, setResumeText] = useState(
    '• 3 years developing REST microservices in Python & FastAPI.\n• Engineered PostgreSQL partitioned schema handling 15M transactions/month with sub-25ms P99 query latency.\n• Containerized 12 microservices with Docker and orchestrated deployment via AWS ECS.\n• Spearheaded cross-functional incident post-mortems reducing recurring severity-1 incidents by 40%.'
  );
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setError(null);
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
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

  // Generate Overview
  const handleGenerateOverview = async () => {
    if (!resumeFile && !resumeText.trim()) {
      setError('Please upload a resume file (.pdf, .txt) or paste your experience.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await uploadCandidateResume(
        candidate?.candidate_id || 'candidate_001',
        resumeFile,
        resumeFile ? null : resumeText
      );
      setOverviewData(data);
    } catch (err) {
      console.warn('Resume analysis error:', err);
      setError(err.message || 'Failed to parse resume overview.');
    } finally {
      setLoading(false);
    }
  };

  // Start interview after reviewing overview
  const handleStartInterviewFromOverview = async (targetRole = 'SDE') => {
    if (!jdText.trim()) {
      setError('Please provide a target Job Description to focus the interview questions.');
      return;
    }
    setStartingInterview(true);
    setError(null);
    try {
      const session = await startResumeJDInterview(
        candidate?.candidate_id || 'candidate_001',
        targetRole,
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Resume &amp; Role Overview
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Split-screen diagnostic: Preview credentials on the left, inspect real-time capability match and skill gaps on the right.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900 text-red-300 text-xs sm:text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Split-Screen Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols): Resume Input & Target JD */}
        <div className="lg:col-span-5 space-y-5">
          {/* Resume Upload Card */}
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Resume Document</span>
              </div>
              <label className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{resumeFile ? 'Change File' : 'Upload File (.pdf, .txt)'}</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {resumeFile ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5" />
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
                  placeholder="Or paste your resume bullet points and key projects here..."
                />
              </div>
            )}
          </div>

          {/* Target Job Description Card */}
          <div className="bg-[#121927] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span>Target Job Description</span>
              </div>
              <button
                onClick={() =>
                  setJdText(
                    'We are seeking a Senior Backend Engineer to build distributed microservices in Python. Experience with PostgreSQL, Docker, AWS, and system design is required.'
                  )
                }
                className="text-[11px] font-semibold text-blue-400 hover:underline cursor-pointer"
              >
                Sample JD
              </button>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={5}
              className="w-full p-3 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste target job description to match skills and identify gaps..."
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerateOverview}
            disabled={loading}
            className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Analyzing Capabilities...' : 'Analyze Resume & Match Role'}</span>
          </button>
        </div>

        {/* RIGHT COLUMN (7 cols): Real-Time Capability Overview & Gaps */}
        <div className="lg:col-span-7 bg-[#121927] border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[520px] flex flex-col justify-between">
          {overviewData ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Seniority & Experience Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 border border-blue-500/40 text-blue-300">
                    {overviewData.seniority_level || 'Mid-Senior Level Engineer'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {overviewData.experience_years || 2} YOE Recognized
                  </span>
                </div>
                <button
                  onClick={() => handleStartInterviewFromOverview(overviewData.target_role || 'SDE')}
                  disabled={startingInterview}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span>{startingInterview ? 'Synthesizing...' : 'Practice for this Role'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Profile Summary */}
              {overviewData.profile_summary && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  <p className="font-semibold text-white mb-1">Executive Summary:</p>
                  <p>{overviewData.profile_summary}</p>
                </div>
              )}

              {/* Recognized Skills */}
              {overviewData.skills?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Recognized Core Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {overviewData.skills.slice(0, 14).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700"
                      >
                        {typeof s === 'string' ? s : s.skill_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Role Capability Match Grid */}
              {overviewData.capabilities?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Role Match &amp; Skill Gap Diagnosis
                  </span>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {overviewData.capabilities.slice(0, 5).map((cap, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {cap.role}
                          </span>
                          <span className={`text-xs font-bold ${cap.match_percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {cap.match_percentage}% Match
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                          <span className="text-slate-400 truncate">
                            <strong className="text-emerald-400 font-semibold">Matched:</strong>{' '}
                            {cap.matched_skills?.slice(0, 3).join(', ') || 'Domain fundamentals'}
                          </span>
                          {cap.missing_skills?.length > 0 && (
                            <span className="text-slate-400 truncate">
                              <strong className="text-amber-400 font-semibold">Gap:</strong>{' '}
                              {cap.missing_skills?.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto text-center space-y-4 py-12">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <Target className="w-7 h-7" />
              </div>
              <div className="max-w-sm mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-white">
                  Capability Match &amp; Skill Gap Overview
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload your resume or paste credentials on the left, then click <strong>"Analyze Resume &amp; Match Role"</strong> to inspect your seniority, recognized skills, and role readiness.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
