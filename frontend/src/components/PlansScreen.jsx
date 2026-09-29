import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  MessageSquare,
  Cpu,
  Compass,
  Quote,
  Check,
  BookOpen,
  ExternalLink,
  Target
} from 'lucide-react';

export default function PlansScreen({ onRegeneratePlan, candidate, onStartPractice }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'resources' | 'questions'
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState(false);

  const [checkedTasks, setCheckedTasks] = useState({
    'd1_0': true,
    'd1_1': true,
  });

  const toggleTask = (id) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      setRegenSuccess(true);
      setTimeout(() => setRegenSuccess(false), 3500);
      onRegeneratePlan?.();
    }, 1000);
  };

  const daysData = [
    {
      day: 'Day 1',
      date: 'Oct 29',
      badge: 'Today',
      badgeType: 'today',
      title: 'Improve Behavioral Responses',
      tasks: [
        'Practice 3 behavioral questions using STAR',
        'Record and review your answers',
        'Read: Effective Communication Tips',
      ],
      color: 'blue',
    },
    {
      day: 'Day 2',
      date: 'Oct 30',
      badge: 'Upcoming',
      badgeType: 'upcoming',
      title: 'Strengthen System Design Basics',
      tasks: [
        'Revise key system design concepts',
        'Practice explaining a simple design',
        'Watch recommended video (15 min)',
      ],
      color: 'green',
    },
    {
      day: 'Day 3',
      date: 'Oct 31',
      badge: 'Upcoming',
      badgeType: 'upcoming',
      title: 'Focus on Communication',
      tasks: [
        'Practice speaking with minimal filler words',
        'Work on conciseness and clarity',
        'Take a 5-minute impromptu speaking challenge',
      ],
      color: 'slate',
    },
    {
      day: 'Day 4',
      date: 'Nov 1',
      badge: 'Upcoming',
      badgeType: 'upcoming',
      title: 'Deep Dive into Technical Concepts',
      tasks: [
        'Practice problem-solving questions',
        'Explain trade-offs and edge cases',
      ],
      color: 'slate',
    },
  ];

  const focusAreas = [
    {
      id: 'communication',
      title: 'Communication',
      priority: 'High Priority',
      priorityColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
      percentage: 70,
      barGradient: 'from-blue-500 to-indigo-500',
      icon: MessageSquare,
      iconColor: 'text-blue-500',
    },
    {
      id: 'star',
      title: 'STAR Structure',
      priority: 'High Priority',
      priorityColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
      percentage: 65,
      barGradient: 'from-purple-500 to-indigo-600',
      icon: Shield,
      iconColor: 'text-purple-500',
    },
    {
      id: 'system_design',
      title: 'System Design',
      priority: 'Medium Priority',
      priorityColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
      percentage: 80,
      barGradient: 'from-blue-500 to-cyan-500',
      icon: Layers,
      iconColor: 'text-blue-500',
    },
    {
      id: 'behavioral',
      title: 'Behavioral',
      priority: 'Medium Priority',
      priorityColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
      percentage: 75,
      barGradient: 'from-blue-500 to-indigo-500',
      icon: Compass,
      iconColor: 'text-blue-500',
    },
    {
      id: 'technical',
      title: 'Technical Concepts',
      priority: 'Low Priority',
      priorityColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
      percentage: 85,
      barGradient: 'from-emerald-500 to-teal-500',
      icon: Cpu,
      iconColor: 'text-teal-500',
    },
  ];

  const planResources = [
    {
      title: 'The Senior Engineer STAR Blueprint',
      type: 'Guide',
      duration: '8 min read',
      tag: 'Behavioral',
      url: 'https://prepzo.ai/star-guide',
    },
    {
      title: 'System Design Primer: SQL vs NoSQL at Scale',
      type: 'Technical Primer',
      duration: '15 min read',
      tag: 'System Design',
      url: 'https://github.com/donnemartin/system-design-primer',
    },
    {
      title: 'Eliminating Fillers: Cadence & Pacing Studio',
      type: 'Interactive Video',
      duration: '12 mins',
      tag: 'Communication',
      url: 'https://prepzo.ai/cadence-studio',
    },
  ];

  const practiceQuestions = [
    {
      topic: 'Behavioral (STAR Method)',
      question: 'Describe a situation where a project fell behind schedule. How did you realign priorities and deliver?',
      difficulty: 'Medium',
    },
    {
      topic: 'System Design',
      question: 'Design a distributed rate limiter that supports 100,000 requests per second across multiple data centers.',
      difficulty: 'Hard',
    },
    {
      topic: 'Technical Fundamentals',
      question: 'How do database indexes (B-Trees vs Hash Indexes) impact read latency and write amplification?',
      difficulty: 'Medium',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header with Regenerate Plan Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Your 7-Day Improvement Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized based on your recent interviews.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs sm:text-sm font-semibold text-white transition-all shadow-sm cursor-pointer self-end sm:self-auto"
        >
          <RotateCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Plan'}</span>
        </button>
      </div>

      {/* Regeneration Success Banner */}
      {regenSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>7-Day Improvement Plan recalibrated using your latest performance metrics!</span>
        </div>
      )}

      {/* 2. Secondary Nav Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center space-x-6 overflow-x-auto text-xs sm:text-sm font-medium scrollbar-none">
        {[
          { id: 'overview', label: 'Plan Overview' },
          { id: 'resources', label: 'Recommended Resources' },
          { id: 'questions', label: 'Practice Questions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 whitespace-nowrap cursor-pointer transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 3. Main Content: Plan Overview Tab (Screenshot Match) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Timeline of Days */}
          <div className="lg:col-span-7 space-y-6">
            {daysData.map((d, dayIndex) => {
              const isToday = d.badgeType === 'today';

              return (
                <div key={d.day} className="flex items-start space-x-4">
                  {/* Left Timeline Indicator Node */}
                  <div className="flex flex-col items-center flex-shrink-0 w-16 pt-1 text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm mb-1 ${
                        isToday
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/60'
                          : d.color === 'green'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isToday ? <Sparkles className="w-4 h-4 fill-current" /> : dayIndex + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {d.day}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {d.date}
                    </span>
                  </div>

                  {/* Right Card */}
                  <div className="flex-1 bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {d.title}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                          isToday
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {d.badge}
                      </span>
                    </div>

                    {/* Checklist of actions */}
                    <div className="space-y-2.5">
                      {d.tasks.map((task, tIdx) => {
                        const taskId = `d${dayIndex}_${tIdx}`;
                        const isChecked = !!checkedTasks[taskId];

                        return (
                          <div
                            key={tIdx}
                            onClick={() => toggleTask(taskId)}
                            className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none py-1"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className={isChecked ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                                {task}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartPractice?.();
                              }}
                              title="Start targeted practice for this task"
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column (5 cols): Focus Areas & Quote Card */}
          <div className="lg:col-span-5 space-y-6">
            {/* Focus Areas Card */}
            <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Focus Areas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Based on your recent performance
                </p>
              </div>

              <div className="space-y-4">
                {focusAreas.map((area) => {
                  const Icon = area.icon;

                  return (
                    <div
                      key={area.title}
                      onClick={() => onStartPractice?.()}
                      className="space-y-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      title={`Click to launch ${area.title} practice`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Icon className={`w-3.5 h-3.5 ${area.iconColor}`} />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-200">
                            {area.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${area.priorityColor}`}>
                            {area.priority}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white w-7 text-right">
                            {area.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          style={{ width: `${area.percentage}%` }}
                          className={`h-2 rounded-full bg-gradient-to-r ${area.barGradient} transition-all duration-700`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inspirational Quote Card */}
            <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs flex items-start space-x-4">
              <Quote className="w-7 h-7 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1 fill-blue-600/10" />
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
                "Consistency turns preparation into confidence."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recommended Resources */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {planResources.map((res, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    {res.tag}
                  </span>
                  <span className="text-[11px] text-slate-400">{res.duration}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {res.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Curated study material aligned with your identified STAR structure gaps.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Practice Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {practiceQuestions.map((pq, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                    {pq.topic}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{pq.difficulty}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {pq.question}
                </h4>
              </div>

              <button
                onClick={() => onStartPractice?.()}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span>Practice Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
