import React from 'react';
import {
  Home,
  Target,
  FileText,
  TrendingUp,
  Bookmark,
  Layers,
  Settings,
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentView, setView, candidate }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'practice', label: 'Practice', icon: Target },
    { id: 'resume', label: 'Resume Analysis', icon: FileText },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'plans', label: 'Plans', icon: Bookmark },
    { id: 'resources', label: 'Resources', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const displayName = candidate?.name || 'Sai Revanth';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SR';

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-5 transition-colors duration-200 select-none z-40">
      {/* Top: Logo & Navigation */}
      <div>
        {/* Brand Logo */}
        <div
          onClick={() => setView('home')}
          className="flex items-center space-x-2.5 mb-8 cursor-pointer group px-2 py-1"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5 text-white fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L3 7v9l9 5 9-5V7l-9-5zm0 2.2l6.5 3.6-2.5 1.4-6.5-3.6 2.5-1.4zM5.5 8.7l5.5 3.1v6.9L5.5 15.6V8.7zm7.5 10v-6.9l5.5-3.1v6.9l-5.5 3.1z" />
            </svg>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              Prepzo
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (item.id === 'practice' &&
                (currentView === 'interview' || currentView === 'conversational'));

            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Badge */}
      <div
        onClick={() => setView('settings')}
        className="pt-4 border-t border-slate-100 dark:border-slate-800/80 cursor-pointer group"
      >
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Free Plan
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
        </div>
      </div>
    </aside>
  );
}
