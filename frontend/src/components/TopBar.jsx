import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';

export default function TopBar({ candidate, setView, currentView = 'home' }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const displayName = candidate?.name || 'Candidate';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CP';

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      title: 'Real-time AI Evaluation',
      desc: 'LangGraph multi-agent diagnostic is active and ready for practice.',
      time: 'Just now',
      unread: true,
      view: 'practice',
    },
    {
      id: 2,
      title: '7-Day Plan Diagnostic',
      desc: 'Personalized improvement plan updates after each completed interview.',
      time: '1h ago',
      unread: false,
      view: 'plans',
    },
  ];

  const viewTitles = {
    home: 'Dashboard Overview',
    practice: 'Interview Practice Lab',
    resume: 'Resume & Job Description Analysis',
    progress: 'Performance Dossier & Analytics',
    plans: '7-Day Improvement Plan',
    resources: 'Interview Frameworks & Guides',
    settings: 'Candidate Profile & Settings',
  };

  return (
    <header className="h-16 px-6 sm:px-8 border-b border-slate-800 bg-[#0B1120]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors duration-200">
      {/* Left: View title & badge */}
      <div className="flex items-center space-x-3">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
          {viewTitles[currentView] || 'Prepzo AI Coach'}
        </h2>
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
          Live System
        </span>
      </div>

      {/* Right Controls: Notifications, Profile Avatar */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#121927] border border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Notifications</span>
                <span className="text-[10px] text-blue-400 font-semibold cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setView?.(n.view);
                      setShowNotifications(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                      n.unread
                        ? 'bg-blue-950/40 border border-blue-900/40'
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-white mb-0.5">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar (Click navigates to Settings) */}
        <div
          onClick={() => setView?.('settings')}
          title="Account & Settings"
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs border border-slate-800 cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
