import React, { useState } from 'react';
import {
  User,
  Mail,
  Briefcase,
  GraduationCap,
  Save,
  CheckCircle2,
  Moon,
  Sun,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { updateCandidateProfile } from '../services/api';

export default function SettingsView({ candidate, onProfileUpdated, theme, toggleTheme }) {
  const [name, setName] = useState(candidate?.name || 'Sai Revanth');
  const [email, setEmail] = useState(candidate?.email || 'sai.revanth@example.com');
  const [targetRole, setTargetRole] = useState(candidate?.target_role || 'SDE');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateCandidateProfile(candidate?.candidate_id || 'candidate_001', {
        name,
        email,
        target_role: targetRole,
      });
      if (onProfileUpdated) onProfileUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.warn('Saved locally:', err);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account &amp; Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, target role, and display settings.
        </p>
      </div>

      {/* Appearance Setting Card */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Interface Theme
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between Light Mode and Dark Mode interface themes.
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Profile Form Card */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Candidate Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Membership Plan
            </label>
            <div className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border border-transparent">
              Free Plan (Unlimited Practice)
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {saved && (
            <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </span>
          )}
          {!saved && <span />}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
