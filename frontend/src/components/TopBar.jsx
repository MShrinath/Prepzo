import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Cpu,
  X,
  CheckCircle2,
} from 'lucide-react';
import { fetchLLMStatus, verifyLLMConnection, resetLLMCircuit } from '../services/api';

export default function TopBar({ candidate, setView, currentView = 'home' }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [llmStatus, setLlmStatus] = useState({
    status: 'live',
    fallback_mode: false,
    provider: 'openai',
    model: 'gpt-4o-mini',
    circuit_open: false,
    last_error: null,
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null);

  const notifRef = useRef(null);
  const diagRef = useRef(null);

  const displayName = candidate?.name || 'Candidate';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CP';

  // Load LLM status on mount and poll periodically
  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      try {
        const data = await fetchLLMStatus();
        if (isMounted && data) {
          setLlmStatus(data);
        }
      } catch (e) {
        console.warn('Could not fetch LLM status:', e);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (diagRef.current && !diagRef.current.contains(e.target)) {
        setShowDiagnostics(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTestConnection = async () => {
    setIsVerifying(true);
    setVerifyMessage(null);
    try {
      const res = await verifyLLMConnection();
      setLlmStatus(res);
      if (res.status === 'live' && !res.fallback_mode) {
        setVerifyMessage({ type: 'success', text: 'Live AI connected successfully!' });
      } else {
        setVerifyMessage({
          type: 'warning',
          text: res.last_error || 'AI Key offline. Heuristic fallback engaged.',
        });
      }
    } catch (e) {
      setVerifyMessage({ type: 'error', text: 'Connection test failed. Backend offline.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetCircuit = async () => {
    try {
      const res = await resetLLMCircuit();
      setLlmStatus(res);
      setVerifyMessage({ type: 'info', text: 'Circuit breaker reset. Ready for live retry.' });
    } catch (e) {
      console.warn('Reset circuit failed:', e);
    }
  };

  const notifications = [
    {
      id: 1,
      title: 'Real-time AI Diagnostic Engine',
      desc: llmStatus.fallback_mode
        ? 'Operating in Rule-Based Heuristic Fallback mode.'
        : 'Multi-agent LLM evaluation is live and ready.',
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

  const isLive = llmStatus.status === 'live' && !llmStatus.fallback_mode;

  return (
    <header className="h-16 px-6 sm:px-8 border-b border-slate-800 bg-[#0B1120]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors duration-200">
      {/* Left: View title & AI Engine Badge */}
      <div className="flex items-center space-x-3">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
          {viewTitles[currentView] || 'Prepzo AI Coach'}
        </h2>

        {/* AI Health Status Pill (Interactive) */}
        <div className="relative" ref={diagRef}>
          <button
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
              isLive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Click to view AI Connection & Fallback Diagnostics"
          >
            {isLive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">AI Live</span>
                <span className="text-[10px] text-emerald-500/80 hidden md:inline">
                  ({llmStatus.model || 'gpt-4o-mini'})
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">Heuristic Mode</span>
                <span className="text-[10px] bg-amber-500/20 px-1 py-0.2 rounded text-amber-200 hidden md:inline">
                  Fallback
                </span>
              </>
            )}
          </button>

          {/* AI Connection & Diagnostics Dropdown Popover */}
          {showDiagnostics && (
            <div className="absolute left-0 top-full mt-2 w-88 sm:w-96 bg-[#121927] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 p-4 text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">AI Engine Diagnostics</span>
                </div>
                <button
                  onClick={() => setShowDiagnostics(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl mb-3 border ${
                  isLive
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                  {isLive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Live Multi-Agent LLM Active</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Rule-Based Heuristic Fallback Active</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {isLive
                    ? `Interview answers and resume analyses are processed via live AI models (${llmStatus.model}).`
                    : llmStatus.last_error ||
                      'The external AI API key is unreachable or exhausted. Prepzo has seamlessly engaged its built-in rule-based evaluation engine so you experience zero downtime.'}
                </p>
              </div>

              {/* Fallback Guarantee Alert */}
              {!isLive && (
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-2.5 mb-3 text-[11px] text-blue-200 leading-snug">
                  <span className="font-semibold text-blue-300">Zero-Downtime Guarantee: </span>
                  Speech metrics (WPM, filler pauses), STAR scoring, question generation, and 7-day
                  improvement plans remain 100% functional.
                </div>
              )}

              {/* Diagnostics Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Provider:</span>
                  <span className="font-semibold text-white capitalize">
                    {llmStatus.provider || 'openai'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Model:</span>
                  <span className="font-semibold text-white">{llmStatus.model || 'gpt-4o-mini'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Circuit Breaker:</span>
                  <span
                    className={`font-semibold ${
                      llmStatus.circuit_open ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {llmStatus.circuit_open ? 'Engaged (No Lag)' : 'Closed (Normal)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Fallbacks Handled:</span>
                  <span className="font-semibold text-white">
                    {llmStatus.fallback_count || 0} times
                  </span>
                </div>
              </div>

              {/* Feedback Message */}
              {verifyMessage && (
                <div
                  className={`p-2 rounded-lg mb-3 text-[11px] ${
                    verifyMessage.type === 'success'
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800'
                      : verifyMessage.type === 'warning'
                      ? 'bg-amber-950/40 text-amber-300 border border-amber-800'
                      : 'bg-red-950/40 text-red-300 border border-red-800'
                  }`}
                >
                  {verifyMessage.text}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={handleTestConnection}
                  disabled={isVerifying}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Testing...' : 'Test AI Connection'}</span>
                </button>
                {llmStatus.circuit_open && (
                  <button
                    onClick={handleResetCircuit}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                    title="Clear circuit breaker state"
                  >
                    Reset Circuit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
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
