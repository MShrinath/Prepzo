import React from 'react';
import { Bot, User, BarChart3, Play, Sparkles } from 'lucide-react';

export default function Navbar({ currentView, setView, candidate }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('modes')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">InterviewCoach AI</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> LangGraph
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Agent Communication & Interview Platform</p>
          </div>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setView('modes')}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
              currentView === 'modes' || currentView === 'interview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Practice</span>
          </button>

          <button
            onClick={() => setView('dashboard')}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
              currentView === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Progress & Plan</span>
          </button>

          <button
            onClick={() => setView('profile')}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
              currentView === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{candidate ? candidate.name : 'Profile'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
