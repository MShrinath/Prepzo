import React, { useState, useEffect, useRef } from 'react';
import { Gauge, AlertTriangle, Activity, Mic, Zap } from 'lucide-react';

const COMMON_FILLERS = [
  'um', 'uh', 'like', 'you know', 'actually', 'basically', 
  'so', 'right', 'i mean', 'sort of', 'kind of', 'honestly'
];

export default function VocalHUD({ isRecording, transcript }) {
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [fillerCounts, setFillerCounts] = useState({});
  const [lastDetectedFiller, setLastDetectedFiller] = useState(null);
  const [totalFillers, setTotalFillers] = useState(0);

  const timerRef = useRef(null);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      setStartTime(Date.now());
      setElapsedSeconds(0);
      setFillerCounts({});
      setTotalFillers(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Analyze Transcript for Live WPM and Fillers
  useEffect(() => {
    if (!isRecording || !transcript) return;

    const lower = transcript.toLowerCase();

    // Count fillers
    let currentTotal = 0;
    const counts = {};

    COMMON_FILLERS.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) {
        counts[filler] = matches.length;
        currentTotal += matches.length;
      }
    });

    if (currentTotal > totalFillers) {
      const newFiller = Object.keys(counts).find(
        (f) => (counts[f] || 0) > (fillerCounts[f] || 0)
      );
      if (newFiller) {
        setLastDetectedFiller(newFiller);
        setTimeout(() => setLastDetectedFiller(null), 2500);
      }
    }

    setFillerCounts(counts);
    setTotalFillers(currentTotal);
  }, [transcript, isRecording]);

  if (!isRecording) return null;

  const words = transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(elapsedSeconds / 60, 0.05);
  const rawWPM = elapsedSeconds > 2 ? Math.round(words / minutes) : 0;

  // Pace Classification
  let paceStatus = { label: 'Calibrating...', color: 'text-[#98989D]', bg: 'bg-white/5', border: 'border-white/10' };
  if (elapsedSeconds > 3) {
    if (rawWPM >= 120 && rawWPM <= 160) {
      paceStatus = { label: 'Optimal Pace (Executive)', color: 'text-[#30D158]', bg: 'bg-[#30D158]/15', border: 'border-[#30D158]/30' };
    } else if (rawWPM > 160 && rawWPM <= 190) {
      paceStatus = { label: 'Fast Delivery — Slow Down', color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/15', border: 'border-[#FF9F0A]/30' };
    } else if (rawWPM > 190) {
      paceStatus = { label: 'Rushed Pace — Take Pauses', color: 'text-[#FF453A]', bg: 'bg-[#FF453A]/15', border: 'border-[#FF453A]/30' };
    } else {
      paceStatus = { label: 'Deliberate / Slow Pace', color: 'text-[#0A84FF]', bg: 'bg-[#0A84FF]/15', border: 'border-[#0A84FF]/30' };
    }
  }

  return (
    <div className="bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/[0.12] rounded-2xl p-4 shadow-2xl space-y-3 transition-all duration-300">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#FF453A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF453A]"></span>
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#0A84FF]" />
            Live Vocal Copilot
          </span>
        </div>

        <div className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold transition ${paceStatus.color} ${paceStatus.bg} ${paceStatus.border}`}>
          {paceStatus.label}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2">
        {/* WPM Meter */}
        <div className="bg-black/30 border border-white/[0.06] p-2.5 rounded-xl text-center">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-[#98989D] uppercase tracking-wider font-semibold">
            <Gauge className="w-3 h-3 text-[#0A84FF]" />
            <span>Pace (WPM)</span>
          </div>
          <div className="text-xl font-bold text-white mt-0.5 font-mono">
            {rawWPM}
          </div>
        </div>

        {/* Word Count */}
        <div className="bg-black/30 border border-white/[0.06] p-2.5 rounded-xl text-center">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-[#98989D] uppercase tracking-wider font-semibold">
            <Mic className="w-3 h-3 text-[#30D158]" />
            <span>Words</span>
          </div>
          <div className="text-xl font-bold text-white mt-0.5 font-mono">
            {words}
          </div>
        </div>

        {/* Filler Word Count */}
        <div className={`bg-black/30 border p-2.5 rounded-xl text-center transition-all ${
          totalFillers > 0 ? 'border-[#FF9F0A]/40' : 'border-white/[0.06]'
        }`}>
          <div className="flex items-center justify-center space-x-1 text-[10px] text-[#98989D] uppercase tracking-wider font-semibold">
            <AlertTriangle className={`w-3 h-3 ${totalFillers > 0 ? 'text-[#FF9F0A]' : 'text-[#636366]'}`} />
            <span>Fillers</span>
          </div>
          <div className={`text-xl font-bold mt-0.5 font-mono ${totalFillers > 0 ? 'text-[#FF9F0A]' : 'text-white'}`}>
            {totalFillers}
          </div>
        </div>
      </div>

      {/* Live Detected Filler Alert */}
      {lastDetectedFiller && (
        <div className="animate-bounce bg-[#FF9F0A]/20 border border-[#FF9F0A]/40 text-[#FF9F0A] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-[#FF9F0A]" />
            Filler Detected:
          </span>
          <span className="uppercase tracking-widest font-bold">"{lastDetectedFiller}"</span>
        </div>
      )}

      {/* Active Fillers Badges */}
      {totalFillers > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(fillerCounts).map(([filler, count]) => (
            <span
              key={filler}
              className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-[10px] text-[#D1D1D6] font-medium flex items-center gap-1"
            >
              <span>"{filler}"</span>
              <span className="bg-[#FF9F0A]/30 text-[#FF9F0A] font-bold px-1 rounded text-[9px]">
                {count}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
