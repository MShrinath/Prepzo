import React, { useState, useEffect } from 'react';
import {
  User, Mail, Briefcase, GraduationCap, Sparkles, Upload,
  CheckCircle2, AlertCircle, Save, Layers, Code2, Cpu,
  Cloud, Database, ShieldCheck, TrendingUp, Check, RefreshCw,
  LogIn, FileText, ChevronRight, BarChart3, Star
} from 'lucide-react';
import {
  updateCandidateProfile,
  uploadCandidateResume,
  fetchCandidateCapabilities,
  loginCandidate
} from '../services/api';

export default function ProfileView({ candidate, onProfileUpdated }) {
  // Form State
  const [formData, setFormData] = useState({
    name: candidate?.name || 'Alex Taylor',
    email: candidate?.email || 'alex@example.com',
    target_role: candidate?.target_role || 'SDE',
    experience_years: candidate?.experience_years || 2,
    education: candidate?.education || 'B.S. in Computer Science',
    bio: candidate?.bio || 'Passionate software engineer experienced with Python, FastAPI, and distributed systems.',
  });

  // Login Modal / State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginRole, setLoginRole] = useState('SDE');
  const [loggingIn, setLoggingIn] = useState(false);

  // Resume Upload State
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeTextInput, setResumeTextInput] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState(false);

  // Capabilities & Summary State
  const [capabilityData, setCapabilityData] = useState(null);
  const [loadingCapabilities, setLoadingCapabilities] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Sync formData when candidate prop changes
  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || '',
        email: candidate.email || '',
        target_role: candidate.target_role || 'SDE',
        experience_years: candidate.experience_years || 0,
        education: candidate.education || '',
        bio: candidate.bio || '',
      });
      loadCapabilities(candidate.candidate_id);
    }
  }, [candidate]);

  const loadCapabilities = async (candId) => {
    if (!candId) return;
    setLoadingCapabilities(true);
    try {
      const data = await fetchCandidateCapabilities(candId);
      setCapabilityData(data);
    } catch (err) {
      console.warn('Could not load capabilities:', err);
    } finally {
      setLoadingCapabilities(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) return;
    setLoggingIn(true);
    setError(null);
    try {
      const isEmail = loginIdentifier.includes('@');
      const profile = await loginCandidate({
        candidate_id: isEmail ? undefined : loginIdentifier.trim().toLowerCase(),
        email: isEmail ? loginIdentifier.trim().toLowerCase() : undefined,
        name: isEmail ? loginIdentifier.split('@')[0].replace(/[._]/g, ' ').title() : loginIdentifier.trim(),
        target_role: loginRole,
      });
      onProfileUpdated(profile);
      setLoginModalOpen(false);
      setLoginIdentifier('');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile && !resumeTextInput.trim()) {
      setError('Please choose a resume file (.pdf, .txt) or paste your resume text.');
      return;
    }
    setUploadingResume(true);
    setError(null);
    try {
      const res = await uploadCandidateResume(candidate.candidate_id, resumeFile, resumeTextInput);
      onProfileUpdated(res);
      setResumeUploadSuccess(true);
      setResumeFile(null);
      setResumeTextInput('');
      if (res.capabilities) {
        setCapabilityData({
          candidate_id: res.candidate_id,
          name: res.name,
          target_role: res.target_role,
          experience_years: res.experience_years,
          seniority_level: res.seniority_level,
          profile_summary: res.profile_summary,
          project_stats: res.project_stats,
          capabilities: res.capabilities,
        });
      }
      setTimeout(() => setResumeUploadSuccess(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to upload and analyze resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const updated = await updateCandidateProfile(candidate.candidate_id, formData);
      onProfileUpdated(updated);
      setSaveSuccess(true);
      loadCapabilities(candidate.candidate_id);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const capabilities = capabilityData?.capabilities || [];
  const projectStats = capabilityData?.project_stats || {
    total_projects: candidate?.projects?.length || 0,
    distinct_technologies: 6,
    technologies_used: ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
    quantifiable_impact_highlights: [
      "Reduced average endpoint latency by 45% and scaled to 3,500 RPS"
    ]
  };
  const profileSummary = capabilityData?.profile_summary || candidate?.bio;
  const seniority = capabilityData?.seniority_level || `${candidate?.experience_years || 2} Years Experience`;

  const getRoleIcon = (iconName) => {
    switch (iconName) {
      case 'Layers': return <Layers className="w-4 h-4 text-[#0A84FF]" />;
      case 'Cloud': return <Cloud className="w-4 h-4 text-[#30D158]" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-[#BF5AF2]" />;
      case 'Database': return <Database className="w-4 h-4 text-[#FF9F0A]" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-[#FF453A]" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4 text-[#64D2FF]" />;
      default: return <Code2 className="w-4 h-4 text-[#0A84FF]" />;
    }
  };

  const getReadinessBadge = (status) => {
    switch (status) {
      case 'Interview Ready':
        return 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30';
      case 'Strong Candidate':
        return 'bg-[#0A84FF]/15 text-[#0A84FF] border-[#0A84FF]/30';
      case 'Minor Ramp-Up Needed':
        return 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30';
      default:
        return 'bg-white/[0.08] text-[#98989D] border-white/[0.1]';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner & Profile Login Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 shadow-apple-card backdrop-blur-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0A84FF]/30 to-[#30D158]/30 border border-white/[0.14] flex items-center justify-center text-white shadow-apple-pill">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                {candidate?.name || 'Alex Taylor'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30">
                {candidate?.target_role || 'SDE'}
              </span>
            </div>
            <p className="text-xs text-[#98989D] mt-0.5">
              Candidate ID: <code className="text-white font-mono">{candidate?.candidate_id || 'candidate_001'}</code> &bull; {seniority}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={() => setLoginModalOpen(true)}
            className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white flex items-center space-x-1.5 transition border border-white/[0.1]"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Switch / Login Candidate</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FF453A]/10 border border-[#FF453A]/25 text-[#FF453A] text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-white/80 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Profile Summary Card */}
      <div className="bg-white/[0.03] border border-[#0A84FF]/30 rounded-3xl p-6 shadow-apple-card backdrop-blur-2xl">
        <div className="flex items-center space-x-2 text-[#0A84FF] font-semibold text-xs uppercase tracking-wide mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Profile Summary &amp; Background Synthesis</span>
        </div>
        <p className="text-sm text-[#E5E5EA] leading-relaxed">
          {profileSummary || "Upload your resume below to automatically extract your project milestones, verified skills, and executive summary."}
        </p>
      </div>

      {/* Direct Resume Upload & Sync Panel */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-apple-card backdrop-blur-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.08] mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-[#30D158]" />
              <h2 className="text-base font-semibold text-white">Upload &amp; Sync Resume</h2>
            </div>
            <p className="text-xs text-[#98989D] mt-0.5">
              Upload your resume (PDF / TXT) or paste raw experience. Automatically syncs projects, skills, and evaluates role capabilities.
            </p>
          </div>
          {resumeUploadSuccess && (
            <span className="text-xs text-[#30D158] font-medium flex items-center gap-1.5 self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4" /> Resume analyzed &amp; synced!
            </span>
          )}
        </div>

        <form onSubmit={handleResumeUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Drag / Drop */}
            <div className="border border-dashed border-white/[0.18] hover:border-[#30D158]/50 rounded-2xl p-5 text-center cursor-pointer transition bg-white/[0.02] flex flex-col items-center justify-center">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setResumeFile(e.target.files[0])}
                className="hidden"
                id="profile-resume-upload"
              />
              <label htmlFor="profile-resume-upload" className="cursor-pointer flex flex-col items-center w-full">
                <FileText className="w-7 h-7 text-[#30D158] mb-2" />
                <span className="text-xs font-semibold text-white">
                  {resumeFile ? resumeFile.name : "Select Resume (.pdf or .txt)"}
                </span>
                <span className="text-[11px] text-[#98989D] mt-0.5">
                  Direct AI parser extracts projects &amp; skills
                </span>
              </label>
            </div>

            {/* Paste Experience Text Area */}
            <div>
              <textarea
                rows={4}
                value={resumeTextInput}
                onChange={(e) => setResumeTextInput(e.target.value)}
                placeholder="Or paste your resume experience summary, projects, and tech stack here..."
                className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-2xl p-3 text-white text-xs focus:outline-none focus:border-[#30D158] transition leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploadingResume}
              className="bg-[#30D158] hover:bg-[#28B046] active:scale-[0.98] text-black font-semibold text-xs px-6 py-2.5 rounded-full shadow-apple-pill flex items-center space-x-2 transition disabled:opacity-50"
            >
              {uploadingResume ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{uploadingResume ? "Parsing & Syncing..." : "Analyze & Sync to Profile"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Project Stats & Showcase */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-apple-card backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-[#0A84FF]" />
              <h2 className="text-base font-semibold text-white">Projects Stats &amp; Production Portfolio</h2>
            </div>
            <p className="text-xs text-[#98989D] mt-0.5">
              Quantifiable accomplishments and technologies extracted from candidate background.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/30">
            {projectStats.total_projects} Projects
          </span>
        </div>

        {/* Stats Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
            <span className="text-[10px] text-[#98989D] uppercase tracking-wider block mb-0.5 font-medium">Projects Built</span>
            <div className="text-2xl font-bold text-white tracking-tight">{projectStats.total_projects}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
            <span className="text-[10px] text-[#98989D] uppercase tracking-wider block mb-0.5 font-medium">Stack Technologies</span>
            <div className="text-2xl font-bold text-[#0A84FF] tracking-tight">{projectStats.distinct_technologies || 6}</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[#98989D] uppercase tracking-wider block mb-0.5 font-medium">Experience Level</span>
            <div className="text-2xl font-bold text-[#30D158] tracking-tight">{candidate?.experience_years || 2} YOE</div>
          </div>
        </div>

        {/* Project Accomplishment Highlights */}
        {candidate?.projects && candidate.projects.length > 0 ? (
          <div className="space-y-3">
            {candidate.projects.map((proj, pIdx) => {
              let techList = proj.technologies;
              if (typeof techList === 'string') {
                try { techList = JSON.parse(techList); } catch { techList = [techList]; }
              }
              return (
                <div key={pIdx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <h3 className="text-sm font-semibold text-white">{proj.name}</h3>
                    <span className="text-[11px] text-[#0A84FF] font-medium">{proj.role || "Lead Contributor"}</span>
                  </div>
                  <p className="text-xs text-[#D1D1D6] leading-relaxed mb-2.5">
                    {proj.description}
                  </p>
                  {proj.measurable_impact && (
                    <div className="p-2 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 text-[11px] text-[#30D158] font-medium mb-2.5 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 shrink-0" />
                      <span>Impact: {proj.measurable_impact}</span>
                    </div>
                  )}
                  {Array.isArray(techList) && techList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {techList.map((t, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 rounded-lg bg-white/[0.06] text-[10px] text-[#A1A1A6]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/[0.02] text-xs text-[#98989D] text-center">
            No projects explicitly registered. Upload your resume to extract your portfolio automatically.
          </div>
        )}
      </div>

      {/* Role Capabilities & Readiness Match Matrix ("What Role He Is Capable Of") */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-apple-card backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#30D158]" />
              <h2 className="text-base font-semibold text-white">Role Capability &amp; Readiness Match</h2>
            </div>
            <p className="text-xs text-[#98989D] mt-0.5">
              Assesses what roles candidate is capable of based on demonstrated technical depth, frameworks, and projects.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {capabilities.map((roleCap, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                    {getRoleIcon(roleCap.icon)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{roleCap.role_name}</h3>
                    <p className="text-[11px] text-[#98989D]">{roleCap.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-lg font-bold text-white tracking-tight">{roleCap.score}%</span>
                    <span className="text-[10px] text-[#98989D] block">Match</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${getReadinessBadge(roleCap.status)}`}>
                    {roleCap.status}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    roleCap.score >= 80 ? 'bg-[#30D158]' : roleCap.score >= 65 ? 'bg-[#0A84FF]' : 'bg-[#FF9F0A]'
                  }`}
                  style={{ width: `${roleCap.score}%` }}
                />
              </div>

              {/* Matched vs Missing Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#30D158] font-semibold uppercase tracking-wider block mb-1">
                    Matched Capabilities ({roleCap.matched_skills?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {roleCap.matched_skills?.map((s, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded-md bg-[#30D158]/15 text-[#30D158] text-[10px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#FF9F0A] font-semibold uppercase tracking-wider block mb-1">
                    Recommended to Learn for 100% Fit
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {roleCap.missing_skills?.map((s, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded-md bg-[#FF9F0A]/15 text-[#FF9F0A] text-[10px] font-medium">
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable Candidate Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-apple-card backdrop-blur-2xl space-y-5">
        <div className="pb-3 border-b border-white/[0.08]">
          <h2 className="text-base font-semibold text-white">Edit Candidate Details</h2>
          <p className="text-xs text-[#98989D] mt-0.5">
            Modify profile information manually if you wish to adjust seniority or target role calibration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#98989D] mb-1.5">Candidate Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#0A84FF] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#98989D] mb-1.5">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#0A84FF] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#98989D] mb-1.5">Target Role</label>
            <input
              type="text"
              value={formData.target_role}
              onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#0A84FF] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#98989D] mb-1.5">Years of Experience</label>
            <input
              type="number"
              min="0"
              max="30"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
              className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#0A84FF] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#98989D] mb-1.5">Education</label>
          <input
            type="text"
            value={formData.education}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#0A84FF] transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#98989D] mb-1.5">Professional Bio / Summary</label>
          <textarea
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#0A84FF] transition leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
          {saveSuccess ? (
            <span className="text-xs text-[#30D158] font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Profile saved successfully
            </span>
          ) : (
            <span className="text-xs text-[#636366]">Candidate ID: {candidate?.candidate_id}</span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-medium text-xs px-6 py-2 rounded-full shadow-apple-pill flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>

      {/* Switch / Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#1C1C1E] border border-white/[0.12] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-apple-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <LogIn className="w-4 h-4 text-[#0A84FF]" />
                <h3 className="text-base font-semibold text-white">Switch or Log In Candidate</h3>
              </div>
              <button
                onClick={() => setLoginModalOpen(false)}
                className="text-xs text-[#98989D] hover:text-white"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-[#AEAEB2] leading-relaxed">
              Enter a Candidate ID (e.g. <code className="text-white">candidate_001</code>), your email, or name to load your profile sessions.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#98989D] mb-1.5">
                  Candidate ID, Email, or Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. candidate_001 or alex.taylor@example.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#0A84FF] transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#98989D] mb-1.5">
                  Target Role
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                  className="w-full bg-[#2C2C2E] border border-white/[0.12] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#0A84FF]"
                >
                  <option value="SDE">Software Development Engineer (SDE)</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Cloud Engineer">Cloud Engineer</option>
                  <option value="AI/ML Engineer">AI/ML Engineer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Product Manager">Product Manager</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#98989D] hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingIn || !loginIdentifier.trim()}
                  className="bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-xs px-5 py-2 rounded-full shadow-apple-pill transition disabled:opacity-50"
                >
                  {loggingIn ? "Loading..." : "Log In / Load Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
