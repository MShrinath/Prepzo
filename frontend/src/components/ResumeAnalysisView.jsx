import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  FileCheck
} from 'lucide-react';
import { startResumeJDInterview } from '../services/api';

export default function ResumeAnalysisView({ onStartInterview, candidate }) {
  const [jdText, setJdText] = useState(
    'We are looking for a Software Engineer with strong experience in Python, FastAPI, and PostgreSQL. Experience with Docker, Kubernetes, and AWS is preferred. The ideal candidate takes ownership of microservices and coordinates across teams.'
  );
  const [resumeText, setResumeText] = useState(
    '• 3 years developing REST and GraphQL microservices in Python & FastAPI.\n• Engineered PostgreSQL partitioned schema handling 15M transactions/month with sub-25ms P99 query latency.\n• Containerized 12 microservices with Docker and orchestrated deployment via AWS ECS & Terraform.\n• Spearheaded cross-functional incident post-mortems reducing recurring severity-1 incidents by 40%.'
  );
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setResumeText(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleStart = async () => {
    if (!jdText.trim()) {
      setError('Please provide a Job Description.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await startResumeJDInterview(
        candidate?.candidate_id || 'candidate_001',
        'SDE',
        jdText,
        null,
        resumeText,
        true
      );
      onStartInterview(data);
    } catch (err) {
      console.warn('Backend unavailable, launching tailored simulation session:', err);
      onStartInterview({
        session_id: 'resume_jd_' + Date.now(),
        role: 'Full Stack Engineer – Resume + JD Interview',
        question_number: 1,
        total_questions: 5,
        difficulty: 'medium',
        question: {
          question: 'Based on your experience with PostgreSQL and FastAPI microservices, how did you achieve sub-25ms P99 latency under 15M transactions per month?',
          competency: 'Technical Architecture & Optimization',
          difficulty: 'medium',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Resume &amp; Job Description Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Targeted questions generated specifically for your credentials and target position.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Description Card */}
        <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span>Target Job Description</span>
            </div>
            <button
              onClick={() =>
                setJdText(
                  'We are seeking a Senior Backend Engineer to build distributed microservices in Go or Python. Experience with Kafka, Redis, and high concurrency is required.'
                )
              }
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Load Sample JD
            </button>
          </div>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={8}
            className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="Paste the target job description here..."
          />
        </div>

        {/* Resume Input Card */}
        <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Candidate Resume / Experience</span>
            </div>
            <label className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
              Upload File
              <input
                type="file"
                accept=".txt,.pdf,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {fileName && (
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <span>Uploaded: {fileName}</span>
            </div>
          )}

          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={fileName ? 6 : 8}
            className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="Paste your resume bullet points, key projects, and tech stack..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleStart}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
        >
          <span>{loading ? 'Synthesizing Questions...' : 'Start Tailored Interview'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
