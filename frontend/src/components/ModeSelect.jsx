import React, { useState, useEffect } from 'react';
import { Briefcase, FileText, Users, ArrowRight, ShieldCheck, Upload, Zap, Sparkles } from 'lucide-react';
import { fetchRoles, startRolePractice, startResumeJDInterview, startHRInterview } from '../services/api';

export default function ModeSelect({ onStartInterview, candidate }) {
  const [roles, setRoles] = useState([
    "SDE", "Full Stack Developer", "AI/ML Engineer", "Cloud Engineer",
    "DevOps Engineer", "Data Analyst", "Product Manager", "Sales", "Customer Success"
  ]);
  const [selectedRole, setSelectedRole] = useState("SDE");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [selectedCompetency, setSelectedCompetency] = useState("Problem Solving");

  // Mode 2 State
  const [jdText, setJdText] = useState(
    "We are looking for a Software Engineer with strong experience in Python, FastAPI, and PostgreSQL. Experience with Docker, Kubernetes, and AWS is preferred. The ideal candidate takes ownership of microservices and coordinates across teams."
  );
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeTextInput, setResumeTextInput] = useState("");

  // Mode 3 State
  const [hrTopics, setHrTopics] = useState(["conflict_resolution", "receiving_feedback", "stress_management"]);

  const [activeTab, setActiveTab] = useState("role"); // 'role' | 'resume' | 'hr'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoles()
      .then(data => {
        if (data.roles) setRoles(data.roles);
      })
      .catch(err => console.log("Using default role list"));
  }, []);

  const handleStartRolePractice = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await startRolePractice(candidate.candidate_id, selectedRole, selectedDifficulty, selectedCompetency);
      onStartInterview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartResumeJD = async () => {
    if (!jdText.trim()) {
      setError("Please provide a Job Description.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await startResumeJDInterview(
        candidate.candidate_id,
        selectedRole,
        selectedDifficulty,
        jdText,
        resumeFile,
        resumeTextInput
      );
      onStartInterview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartHR = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await startHRInterview(candidate.candidate_id, selectedDifficulty, hrTopics);
      onStartInterview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleHrTopic = (topic) => {
    if (hrTopics.includes(topic)) {
      if (hrTopics.length > 1) {
        setHrTopics(hrTopics.filter(t => t !== topic));
      }
    } else {
      setHrTopics([...hrTopics, topic]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Choose Your Interview Mode
        </h1>
        <p className="mt-2 text-slate-400 max-w-2xl mx-auto text-base">
          Select an interview track to practice with specialized AI agents powered by LangGraph. Each response is evaluated for clarity, technical depth, and STAR structure.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-2xl mx-auto text-center">
          {error}
        </div>
      )}

      {/* 3-Mode Selection Cards matching Section 356-373 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Card 1: Role Practice */}
        <div
          onClick={() => setActiveTab("role")}
          className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 border ${
            activeTab === "role"
              ? "bg-slate-800/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/30"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Role Practice</h3>
          <p className="text-sm text-slate-400 mb-4">
            Pick from 9 preset roles and practice curated technical & behavioral questions drawn from our tagged question bank.
          </p>
          <div className="flex items-center text-xs font-semibold text-indigo-400">
            <span>Configure & Start</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Card 2: Resume + JD */}
        <div
          onClick={() => setActiveTab("resume")}
          className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 border ${
            activeTab === "resume"
              ? "bg-slate-800/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/30"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Resume + Job Description</h3>
          <p className="text-sm text-slate-400 mb-4">
            Upload your resume and paste a target job description. The system analyzes skill gaps and generates tailored, grounded questions.
          </p>
          <div className="flex items-center text-xs font-semibold text-emerald-400">
            <span>Tailor Interview</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Card 3: HR Round */}
        <div
          onClick={() => setActiveTab("hr")}
          className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 border ${
            activeTab === "hr"
              ? "bg-slate-800/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/30"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">HR Round</h3>
          <p className="text-sm text-slate-400 mb-4">
            Role-agnostic behavioral practice focusing on conflict resolution, motivation, stress management, feedback, and workplace culture.
          </p>
          <div className="flex items-center text-xs font-semibold text-amber-400">
            <span>Behavioral Practice</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>

      {/* Mode-Specific Configuration Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-xl">
        {activeTab === "role" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Mode 1 Configuration: Role Practice</h2>
                <p className="text-xs text-slate-400">Select target role, difficulty level, and focus competency</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                Curated Question Bank
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Role (9 Presets)
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Difficulty Level
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="easy">Easy (Fundamentals)</option>
                  <option value="medium">Medium (Standard Mid-Level)</option>
                  <option value="hard">Hard (Senior & System Design)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Primary Competency
                </label>
                <select
                  value={selectedCompetency}
                  onChange={(e) => setSelectedCompetency(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Problem Solving">Problem Solving</option>
                  <option value="Technical Depth & Domain Mastery">Technical Depth & Domain Mastery</option>
                  <option value="Communication & Clarity">Communication & Clarity</option>
                  <option value="Ownership & Accountability">Ownership & Accountability</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                disabled={loading}
                onClick={handleStartRolePractice}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition disabled:opacity-50"
              >
                {loading ? <Zap className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                <span>Launch Role Practice Session</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "resume" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Mode 2 Configuration: Resume + Job Description</h2>
                <p className="text-xs text-slate-400">Tailors questions grounded in resume experience and probes JD requirements</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Grounded Gap Analysis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Resume Input (Upload PDF or Paste Text)
                </label>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-4 text-center cursor-pointer transition">
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-300 font-medium">
                        {resumeFile ? resumeFile.name : "Click to upload Resume (PDF or TXT)"}
                      </span>
                    </label>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Or paste resume summary / key projects here..."
                    value={resumeTextInput}
                    onChange={(e) => setResumeTextInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    * Defaults to active profile ({candidate.name}) if left empty.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Job Description (Required)
                </label>
                <textarea
                  rows={7}
                  placeholder="Paste the target job description requirements here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                disabled={loading}
                onClick={handleStartResumeJD}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition disabled:opacity-50"
              >
                {loading ? <Zap className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                <span>Analyze Gaps & Start Tailored Mock</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "hr" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Mode 3 Configuration: HR Behavioral Round</h2>
                <p className="text-xs text-slate-400">Practice core workplace communication, culture, and interpersonal reasoning</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                STAR Communication Focus
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Select HR Behavioral Topics
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "conflict_resolution", label: "Conflict Resolution" },
                  { id: "receiving_feedback", label: "Receiving Feedback" },
                  { id: "stress_management", label: "Stress Management" },
                  { id: "motivation", label: "Motivation & Goals" },
                  { id: "failure", label: "Handling Failure" },
                  { id: "teamwork", label: "Teamwork & Culture" },
                  { id: "leadership", label: "Ownership & Initiative" },
                  { id: "adaptability", label: "Adaptability & Change" },
                ].map(item => {
                  const isChecked = hrTopics.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleHrTopic(item.id)}
                      className={`cursor-pointer border rounded-xl p-3 text-xs font-medium transition flex items-center justify-between ${
                        isChecked
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isChecked && <ShieldCheck className="w-4 h-4 text-amber-400" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                disabled={loading}
                onClick={handleStartHR}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-amber-600/20 flex items-center space-x-2 transition disabled:opacity-50"
              >
                {loading ? <Zap className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                <span>Launch HR Behavioral Round</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Play(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
