import React from 'react';
import { Play, BarChart2, User, Mic2, BookOpen } from 'lucide-react';

export default function Navbar({ currentView, setView, candidate }) {
  const isPracticeActive = currentView === 'modes' || currentView === 'interview' || currentView === 'conversational';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/70 border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer select-none group"
          onClick={() => setView('modes')}
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white shadow-apple-pill group-hover:bg-white/[0.12] transition-colors">
            <Mic2 className="w-4 h-4 text-[#0A84FF]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base text-white tracking-tight">Prepzo</span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-[#98989D] border border-white/[0.06]">
                AI
              </span>
            </div>
          </div>
        </div>

        {/* Center: Apple-style Segmented Control */}
        <nav className="flex items-center p-1 rounded-full bg-white/[0.06] border border-white/[0.06]">
          <button
            onClick={() => setView('modes')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all duration-200 ${
              isPracticeActive
                ? 'bg-white/[0.14] text-white shadow-apple-pill font-semibold'
                : 'text-[#98989D] hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Practice</span>
          </button>

          <button
            onClick={() => setView('dashboard')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all duration-200 ${
              currentView === 'dashboard'
                ? 'bg-white/[0.14] text-white shadow-apple-pill font-semibold'
                : 'text-[#98989D] hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setView('storybank')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all duration-200 ${
              currentView === 'storybank'
                ? 'bg-white/[0.14] text-white shadow-apple-pill font-semibold'
                : 'text-[#98989D] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stories</span>
          </button>

          <button
            onClick={() => setView('profile')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all duration-200 ${
              currentView === 'profile'
                ? 'bg-white/[0.14] text-white shadow-apple-pill font-semibold'
                : 'text-[#98989D] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{candidate ? candidate.name : 'Profile'}</span>
            <span className="sm:hidden">Profile</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
