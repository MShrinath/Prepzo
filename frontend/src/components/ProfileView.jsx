import React, { useState } from 'react';
import { User, Mail, Briefcase, Award, CheckCircle2, Save, Plus, Trash2 } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Candidate Profile</h1>
          <p className="text-sm text-slate-400 mt-1">
            Personalize your background and target competencies to ground AI question generation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Candidate Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Target Role
              </label>
              <input
                type="text"
                value={formData.target_role}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Education
            </label>
            <input
              type="text"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Professional Summary / Bio
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Current Skills Preview */}
          <div className="pt-4 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Recognized Technical & Domain Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {(candidate?.skills || [
                { skill_name: "Python", proficiency: "Advanced" },
                { skill_name: "FastAPI", proficiency: "Advanced" },
                { skill_name: "PostgreSQL", proficiency: "Intermediate" },
                { skill_name: "Docker", proficiency: "Intermediate" },
                { skill_name: "React", proficiency: "Beginner" },
              ]).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-indigo-300 font-medium"
                >
                  {skill.skill_name} <span className="text-slate-500">({skill.proficiency})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-4">
            {success && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition disabled:opacity-50"
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
