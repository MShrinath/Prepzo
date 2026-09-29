import React, { useState, useEffect } from 'react';
import {
  Briefcase, FileText, Users, ArrowRight, ShieldCheck,
  Upload, Sparkles, CheckCircle2, ChevronRight, Play, Loader2, MessageCircle
} from 'lucide-react';
import { fetchRoles, startRolePractice, startResumeJDInterview, startHRInterview, startConversationalInterview } from '../services/api';

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
  const [conversationalMode, setConversationalMode] = useState(true);
  const [questionCount, setQuestionCount] = useState(5);

  useEffect(() => {
    fetchRoles()
      .then(data => {
        if (data.roles) setRoles(data.roles);
      })
      .catch(() => console.log("Using default role list"));
  }, []);

  const handleStartRolePractice = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (conversationalMode) {
        data = await startConversationalInterview(candidate.candidate_id, 'role_practice', selectedRole, selectedDifficulty, selectedCompetency, questionCount);
      } else {
        data = await startRolePractice(candidate.candidate_id, selectedRole, selectedDifficulty, selectedCompetency);
      }
      onStartInterview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartResumeJD = async () => {
    if (!jdText.trim()) {
      setError("Please enter a target Job Description.");
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
        resumeTextInput,
        conversationalMode,
        questionCount
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <p className="text-xs font-semibold text-[#0A84FF] tracking-wide uppercase mb-2">
          Interview Preparation
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Choose a Practice Mode
        </h1>
        <p className="mt-2 text-sm text-[#98989D] leading-relaxed">
          Select an interview format to begin. Responses are evaluated in real time for delivery cadence, technical depth, and structured problem solving.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-2xl bg-[#FF453A]/10 border border-[#FF453A]/25 text-[#FF453A] text-sm max-w-xl mx-auto flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A]"></span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-medium text-[#FF453A]/80 hover:text-white ml-3 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Card 1: Role Practice */}
        <div
          onClick={() => setActiveTab("role")}
          className={`cursor-pointer rounded-3xl p-6 transition-all duration-200 border relative backdrop-blur-xl flex flex-col justify-between ${
            activeTab === "role"
              ? "bg-white/[0.08] border-[#0A84FF]/60 shadow-apple-card ring-1 ring-[#0A84FF]/40"
              : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.14]"
          }`}
        >
          <div>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition ${
              activeTab === "role"
                ? "bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30"
                : "bg-white/[0.06] text-[#98989D] border border-white/[0.06]"
            }`}>
              <Briefcase className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-1.5">Role Practice</h3>
            <p className="text-xs text-[#98989D] leading-relaxed">
              Curated technical and domain questions across 9 engineering and product disciplines.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-[#98989D]">Standard Track</span>
            <div className={`flex items-center font-medium ${activeTab === "role" ? "text-[#0A84FF]" : "text-[#98989D]"}`}>
              <span>{activeTab === "role" ? "Configuring" : "Select"}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Card 2: Resume + JD */}
        <div
          onClick={() => setActiveTab("resume")}
          className={`cursor-pointer rounded-3xl p-6 transition-all duration-200 border relative backdrop-blur-xl flex flex-col justify-between ${
            activeTab === "resume"
              ? "bg-white/[0.08] border-[#30D158]/60 shadow-apple-card ring-1 ring-[#30D158]/40"
              : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.14]"
          }`}
        >
          <div>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition ${
              activeTab === "resume"
                ? "bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30"
                : "bg-white/[0.06] text-[#98989D] border border-white/[0.06]"
            }`}>
              <FileText className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-1.5">Resume & Job Match</h3>
            <p className="text-xs text-[#98989D] leading-relaxed">
              Upload your resume and paste a job description. Probes unaddressed gaps and requirements.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-[#98989D]">Gap Analysis</span>
            <div className={`flex items-center font-medium ${activeTab === "resume" ? "text-[#30D158]" : "text-[#98989D]"}`}>
              <span>{activeTab === "resume" ? "Configuring" : "Select"}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Card 3: HR Round */}
        <div
          onClick={() => setActiveTab("hr")}
          className={`cursor-pointer rounded-3xl p-6 transition-all duration-200 border relative backdrop-blur-xl flex flex-col justify-between ${
            activeTab === "hr"
              ? "bg-white/[0.08] border-[#FF9F0A]/60 shadow-apple-card ring-1 ring-[#FF9F0A]/40"
              : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.14]"
          }`}
        >
          <div>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition ${
              activeTab === "hr"
                ? "bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30"
                : "bg-white/[0.06] text-[#98989D] border border-white/[0.06]"
            }`}>
              <Users className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-1.5">HR & Behavioral</h3>
            <p className="text-xs text-[#98989D] leading-relaxed">
              Role-agnostic behavioral scenarios evaluating conflict resolution, motivation, and leadership.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-[#98989D]">STAR Method</span>
            <div className={`flex items-center font-medium ${activeTab === "hr" ? "text-[#FF9F0A]" : "text-[#98989D]"}`}>
              <span>{activeTab === "hr" ? "Configuring" : "Select"}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Grouped Panel */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-apple-card">
        {/* Track 1: Role Configuration */}
        {activeTab === "role" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/[0.08] gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">Configure Role Practice</h2>
                <p className="text-xs text-[#98989D]">Select target role, seniority depth, and evaluation competency</p>
              </div>
              <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-white/[0.06] text-[#98989D] border border-white/[0.08]">
                Curated Question Bank
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-[#98989D] mb-2">
                  Target Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#0A84FF] transition"
                >
                  {roles.map(r => (
                    <option key={r} value={r} className="bg-[#1C1C1E] text-white">{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#98989D] mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#0A84FF] transition"
                >
                  <option value="easy" className="bg-[#1C1C1E] text-white">Easy • Fundamentals</option>
                  <option value="medium" className="bg-[#1C1C1E] text-white">Medium • Standard</option>
                  <option value="hard" className="bg-[#1C1C1E] text-white">Hard • Senior / Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#98989D] mb-2">
                  Core Competency
                </label>
                <select
                  value={selectedCompetency}
                  onChange={(e) => setSelectedCompetency(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#0A84FF] transition"
                >
                  <option value="Problem Solving" className="bg-[#1C1C1E] text-white">Problem Solving</option>
                  <option value="Technical Depth & Domain Mastery" className="bg-[#1C1C1E] text-white">Technical Depth</option>
                  <option value="Communication & Clarity" className="bg-[#1C1C1E] text-white">Communication & Clarity</option>
                  <option value="Ownership & Accountability" className="bg-[#1C1C1E] text-white">Ownership & Accountability</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] space-y-4">
              {/* Conversational Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#BF5AF2]/15 border border-[#BF5AF2]/30 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-[#BF5AF2]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Conversational Mode</p>
                    <p className="text-[10px] text-[#98989D]">AI speaks questions aloud, {questionCount}-question multi-turn flow</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {conversationalMode && (
                    <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
                      className="bg-[#1C1C1E] border border-white/[0.12] rounded-lg px-2 py-1 text-xs text-white focus:outline-none">
                      {[3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Qs</option>)}
                    </select>
                  )}
                  <button onClick={() => setConversationalMode(!conversationalMode)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      conversationalMode ? 'bg-[#BF5AF2]' : 'bg-white/[0.12]'
                    }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                      conversationalMode ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  disabled={loading}
                  onClick={handleStartRolePractice}
                  className="w-full sm:w-auto bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-medium px-6 py-2.5 rounded-full shadow-apple-pill flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : conversationalMode ? <MessageCircle className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{conversationalMode ? 'Start Conversation' : 'Start Practice Session'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Track 2: Resume + JD Configuration */}
        {activeTab === "resume" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/[0.08] gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">Configure Resume & Job Analysis</h2>
                <p className="text-xs text-[#98989D]">Compare resume achievements against target job requirements</p>
              </div>
              <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-white/[0.06] text-[#30D158] border border-white/[0.08]">
                Grounded Gap Probing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
              <div>
                <label className="block text-xs font-medium text-[#98989D] mb-1.5">
                  Target Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#30D158] transition"
                >
                  {roles.map(r => (
                    <option key={r} value={r} className="bg-[#1C1C1E] text-white">{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#98989D] mb-1.5">
                  Target Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#30D158] transition"
                >
                  <option value="easy" className="bg-[#1C1C1E] text-white">Easy • Fundamentals</option>
                  <option value="medium" className="bg-[#1C1C1E] text-white">Medium • Standard</option>
                  <option value="hard" className="bg-[#1C1C1E] text-white">Hard • Senior / Staff</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-[#98989D] mb-2">
                  Resume Input (PDF or Plain Text)
                </label>
                <div className="space-y-3">
                  <div className="border border-dashed border-white/[0.16] hover:border-[#30D158]/50 rounded-2xl p-4 text-center cursor-pointer transition bg-white/[0.02]">
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-5 h-5 text-[#30D158] mb-1.5" />
                      <span className="text-xs text-white font-medium">
                        {resumeFile ? resumeFile.name : "Choose Resume (.pdf or .txt)"}
                      </span>
                      <span className="text-[11px] text-[#98989D] mt-0.5">
                        Direct document parsing
                      </span>
                    </label>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Or paste resume experience summary here..."
                    value={resumeTextInput}
                    onChange={(e) => setResumeTextInput(e.target.value)}
                    className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#30D158] transition"
                  />
                  <p className="text-[11px] text-[#636366]">
                    * Defaults to active profile ({candidate.name}) if omitted.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#98989D] mb-2">
                  Target Job Description
                </label>
                <textarea
                  rows={8}
                  placeholder="Paste the job requirements and responsibilities..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#30D158] transition leading-relaxed"
                />
              </div>
            </div>

            {/* Conversational Mode Toggle for Track 2 */}
            <div className="pt-4 border-t border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#30D158]/15 border border-[#30D158]/30 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-[#30D158]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Conversational Mode</p>
                    <p className="text-[10px] text-[#98989D]">AI conducts multi-turn spoken interview with tailored gap probing</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {conversationalMode && (
                    <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
                      className="bg-[#1C1C1E] border border-white/[0.12] rounded-lg px-2 py-1 text-xs text-white focus:outline-none">
                      {[3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Qs</option>)}
                    </select>
                  )}
                  <button onClick={() => setConversationalMode(!conversationalMode)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      conversationalMode ? 'bg-[#30D158]' : 'bg-white/[0.12]'
                    }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                      conversationalMode ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  disabled={loading}
                  onClick={handleStartResumeJD}
                  className="w-full sm:w-auto bg-[#30D158] hover:bg-[#28B046] active:scale-[0.98] text-black font-semibold px-6 py-2.5 rounded-full shadow-apple-pill flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : conversationalMode ? <MessageCircle className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 fill-current text-black" />}
                  <span>{conversationalMode ? 'Start AI Conversation' : 'Analyze and Start'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Track 3: HR Round Configuration */}
        {activeTab === "hr" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/[0.08] gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">Configure HR Behavioral Round</h2>
                <p className="text-xs text-[#98989D]">Practice situational questions scored against the STAR framework</p>
              </div>
              <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-white/[0.06] text-[#FF9F0A] border border-white/[0.08]">
                STAR Focus
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#98989D] mb-3">
                Behavioral Competency Topics ({hrTopics.length} selected)
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
                      className={`cursor-pointer border rounded-2xl p-3 text-xs font-medium transition flex items-center justify-between ${
                        isChecked
                          ? "bg-[#FF9F0A]/15 border-[#FF9F0A]/40 text-[#FF9F0A]"
                          : "bg-[#1C1C1E] border-white/[0.08] text-[#98989D] hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF9F0A] shrink-0 ml-1.5" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end border-t border-white/[0.08]">
              <button
                disabled={loading}
                onClick={handleStartHR}
                className="w-full sm:w-auto bg-[#FF9F0A] hover:bg-[#E08A00] active:scale-[0.98] text-black font-semibold px-6 py-2.5 rounded-full shadow-apple-pill flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Play className="w-4 h-4 fill-current text-black" />}
                <span>Start HR Round</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
