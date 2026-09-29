import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Sun, Moon, Sparkles, Check, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function TopBar({ theme, toggleTheme, candidate, setView }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchInputRef = useRef(null);
  const notifRef = useRef(null);

  const displayName = candidate?.name || 'Sai Revanth';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SR';

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const searchItems = [
    { title: 'Technical Interview', category: 'Practice Mode', view: 'practice' },
    { title: 'Explain SQL vs NoSQL', category: 'Questions', view: 'practice' },
    { title: 'Resume + Job Mode', category: 'Analysis', view: 'resume' },
    { title: 'Interview Results & Feedback', category: 'Analytics', view: 'progress' },
    { title: '7-Day Improvement Plan', category: 'Action Plan', view: 'plans' },
    { title: 'STAR Structure Framework', category: 'Resources', view: 'resources' },
    { title: 'System Design Basics', category: 'Guides', view: 'resources' },
    { title: 'Candidate Profile & Settings', category: 'Account', view: 'settings' },
  ];

  const filteredSearch = searchQuery.trim()
    ? searchItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchItems.slice(0, 4);

  const notifications = [
    {
      id: 1,
      title: 'Interview Analysis Ready',
      desc: 'Technical Interview scored 78% (Good Performance).',
      time: '10m ago',
      unread: true,
      view: 'progress',
    },
    {
      id: 2,
      title: '7-Day Plan Updated',
      desc: 'Day 1 task: Improve Behavioral Responses.',
      time: '1h ago',
      unread: true,
      view: 'plans',
    },
    {
      id: 3,
      title: 'New Resource Recommended',
      desc: 'SQL vs NoSQL Scalability Trade-offs primer added.',
      time: '3h ago',
      unread: false,
      view: 'resources',
    },
  ];

  return (
    <header className="h-16 px-6 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors duration-200">
      {/* Search Input with Ctrl K */}
      <div className="relative max-w-md w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchDropdown(true);
          }}
          onFocus={() => setShowSearchDropdown(true)}
          placeholder="Search for roles, topics, or questions..."
          className="w-full pl-10 pr-16 py-2 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-2xs">
              Ctrl K
            </kbd>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 p-2">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {searchQuery ? 'Search Results' : 'Quick Actions'}
            </div>
            <div className="space-y-1">
              {filteredSearch.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setView?.(item.view);
                    setShowSearchDropdown(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.category}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
              {filteredSearch.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  No matching topics or questions found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Theme Toggle, Notifications, Profile Avatar */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 transition-transform -rotate-12 hover:rotate-0" />
          )}
        </button>

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Notifications
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold cursor-pointer">
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
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white mb-0.5">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {n.desc}
                    </p>
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
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs border border-white dark:border-slate-800 cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
