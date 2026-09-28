import React, { useState } from 'react';
import { CheckCircle2, Save, Sparkles, User, Briefcase, Mail, GraduationCap } from 'lucide-react';
import { updateCandidateProfile } from '../services/api';

export default function ProfileView({ candidate, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    name: candidate?.name || 'Alex Taylor',
    email: candidate?.email || 'alex@example.com',
    target_role: candidate?.target_role || 'SDE',
    experience_years: candidate?.experience_years || 2,
    education: candidate?.education || 'B.S. in Computer Science',
    bio: candidate?.bio || 'Passionate software engineer experienced with Python, FastAPI, and distributed systems.',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const updated = await updateCandidateProfile(candidate.candidate_id, formData);
      onProfileUpdated(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Candidate Profile</h1>
        <p className="text-xs sm:text-sm text-[#98989D] mt-1 leading-relaxed">
          Your profile details ground the AI question generators and difficulty calibration in your actual background.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-apple-card backdrop-blur-2xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[#98989D] mb-2">
                Candidate Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#0A84FF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#98989D] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#0A84FF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#98989D] mb-2">
                Target Role
              </label>
              <input
                type="text"
                value={formData.target_role}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#0A84FF] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#98989D] mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#0A84FF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#98989D] mb-2">
              Education & Degrees
            </label>
            <input
              type="text"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#0A84FF] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#98989D] mb-2">
              Professional Summary
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-[#0A84FF] transition leading-relaxed"
            />
          </div>

          {/* Current Skills Preview */}
          <div className="pt-4 border-t border-white/[0.08]">
            <label className="block text-xs font-medium text-[#98989D] mb-3">
              Recognized Domain & Technical Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {(candidate?.skills && candidate.skills.length > 0 ? candidate.skills : [
                { skill_name: "Python", proficiency: "Advanced" },
                { skill_name: "FastAPI", proficiency: "Advanced" },
                { skill_name: "PostgreSQL", proficiency: "Intermediate" },
                { skill_name: "Docker", proficiency: "Intermediate" },
                { skill_name: "Distributed Systems", proficiency: "Intermediate" },
                { skill_name: "React", proficiency: "Beginner" },
              ]).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-white flex items-center space-x-1.5"
                >
                  <span className="font-medium">{skill.skill_name}</span>
                  <span className="text-[#98989D] text-[10px]">({skill.proficiency})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            {success ? (
              <span className="text-xs text-[#30D158] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Profile saved successfully
              </span>
            ) : (
              <span className="text-xs text-[#636366]">Candidate ID: {candidate?.candidate_id || 'candidate_001'}</span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white font-medium text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-apple-pill flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Profile"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
