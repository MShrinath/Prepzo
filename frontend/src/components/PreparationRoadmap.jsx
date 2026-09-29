import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Code2, ExternalLink, CheckCircle2, Circle, Compass,
  Layers, Cpu, Server, ShieldCheck, Sparkles, Filter, Award,
  Check, ArrowRight, Bookmark, Clock, Flame
} from 'lucide-react';

const PREPARATION_RESOURCES = [
  // --- DSA (LeetCode & CodeChef) ---
  {
    id: 'dsa_1',
    category: 'dsa',
    title: 'Two Sum & Pair Sum Patterns',
    platform: 'LeetCode',
    link: 'https://leetcode.com/problems/two-sum/',
    difficulty: 'Easy',
    pattern: 'Hash Map / Two Pointers',
    timeGoal: '15 mins',
    summary: 'The foundational hash map lookup pattern. Learn O(n) complement storage vs O(n log n) sorting + two pointers.',
  },
  {
    id: 'dsa_2',
    category: 'dsa',
    title: '3Sum & Multi-Pointer Convergence',
    platform: 'LeetCode',
    link: 'https://leetcode.com/problems/3sum/',
    difficulty: 'Medium',
    pattern: 'Two Pointers',
    timeGoal: '25 mins',
    summary: 'Sort and two-pointer sweep with duplicate avoidance. Essential for array manipulation rounds.',
  },
  {
    id: 'dsa_3',
    category: 'dsa',
    title: 'Longest Substring Without Repeating Characters',
    platform: 'LeetCode',
    link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    difficulty: 'Medium',
    pattern: 'Sliding Window',
    timeGoal: '25 mins',
    summary: 'Dynamic sliding window with character index maps. Critical for string parsing interviews.',
  },
  {
    id: 'dsa_4',
    category: 'dsa',
    title: 'Chef and Reversing (Graphs & 0-1 BFS)',
    platform: 'CodeChef',
    link: 'https://www.codechef.com/problems/REVERSE',
    difficulty: 'Medium',
    pattern: '0-1 BFS / Dijkstra',
    timeGoal: '30 mins',
    summary: 'Directed graph shortest path where edges have 0 or 1 cost. Demonstrates optimal deque-based BFS.',
  },
  {
    id: 'dsa_5',
    category: 'dsa',
    title: 'Daily Temperatures (Next Greater Element)',
    platform: 'LeetCode',
    link: 'https://leetcode.com/problems/daily-temperatures/',
    difficulty: 'Medium',
    pattern: 'Monotonic Stack',
    timeGoal: '20 mins',
    summary: 'Monotonic decreasing stack to resolve forward dependencies in O(n) amortized time.',
  },
  {
    id: 'dsa_6',
    category: 'dsa',
    title: 'Course Schedule & Dependency Ordering',
    platform: 'LeetCode',
    link: 'https://leetcode.com/problems/course-schedule/',
    difficulty: 'Medium',
    pattern: 'Topological Sort / Kahn Algorithm',
    timeGoal: '30 mins',
    summary: 'Directed cycle detection in DAGs. Foundational for microservice dependency trees and build pipelines.',
  },
  {
    id: 'dsa_7',
    category: 'dsa',
    title: 'Coin Change & Unbounded Knapsack',
    platform: 'LeetCode',
    link: 'https://leetcode.com/problems/coin-change/',
    difficulty: 'Medium',
    pattern: 'Dynamic Programming',
    timeGoal: '25 mins',
    summary: 'Bottom-up DP table transition and state minimization. High-frequency Amazon & Google question.',
  },
  {
    id: 'dsa_8',
    category: 'dsa',
    title: 'Snake Procession & String Validation',
    platform: 'CodeChef',
    link: 'https://www.codechef.com/problems/SNAKPROC',
    difficulty: 'Easy',
    pattern: 'String Processing & State Machine',
    timeGoal: '15 mins',
    summary: 'State machine transition validation. Excellent for testing clean boundary checks and edge case handling.',
  },
  {
    id: 'dsa_9',
    category: 'dsa',
    title: 'Merge k Sorted Lists',
    platform: 'LeetCode',
    link: 'https://leetcode.com/problems/merge-k-sorted-lists/',
    difficulty: 'Hard',
    pattern: 'Min-Heap / Divide and Conquer',
    timeGoal: '35 mins',
    summary: 'Min-heap priority queue or divide-and-conquer k-way merge. Classic distributed log merge question.',
  },

  // --- System Design & Architecture ---
  {
    id: 'sd_1',
    category: 'system_design',
    title: 'Designing Data-Intensive Applications (DDIA)',
    platform: 'Book / Reference',
    link: 'https://dataintensive.net/',
    difficulty: 'Medium',
    pattern: 'Architecture Foundations',
    timeGoal: 'Study Guide',
    summary: 'Chapters 5–9: Replication, Partitioning, Transactions, and Distributed Consensus. The gold standard for senior engineering interviews.',
  },
  {
    id: 'sd_2',
    category: 'system_design',
    title: 'System Design Primer (Open Source Roadmap)',
    platform: 'GitHub Reference',
    link: 'https://github.com/donnemartin/system-design-primer',
    difficulty: 'Medium',
    pattern: 'Comprehensive Guide',
    timeGoal: 'Reference',
    summary: 'Step-by-step breakdown of DNS, CDNs, Load Balancers, Consistent Hashing, Caching (Redis), and SQL vs NoSQL trade-offs.',
  },
  {
    id: 'sd_3',
    category: 'system_design',
    title: 'Distributed Rate Limiter Design',
    platform: 'Architectural Blueprint',
    link: 'https://redis.io/glossary/rate-limiting/',
    difficulty: 'Medium',
    pattern: 'Redis / Sliding Window Counter',
    timeGoal: '45 mins',
    summary: 'Compare Token Bucket vs Sliding Window Counter using Redis atomic Lua scripts. Handles concurrency and fail-open resilience.',
  },
  {
    id: 'sd_4',
    category: 'system_design',
    title: 'Stripe: Idempotent APIs in Distributed Systems',
    platform: 'Engineering Blog',
    link: 'https://stripe.com/blog/idempotency',
    difficulty: 'Hard',
    pattern: 'Distributed Transactions',
    timeGoal: '30 mins',
    summary: 'How Stripe guarantees exactly-once processing using idempotency keys, ACID ledger state, and replay avoidance.',
  },
  {
    id: 'sd_5',
    category: 'system_design',
    title: 'Event-Driven Architectures with Apache Kafka',
    platform: 'Reference Material',
    link: 'https://kafka.apache.org/documentation/',
    difficulty: 'Medium',
    pattern: 'Message Streaming',
    timeGoal: 'Study Guide',
    summary: 'Log-based storage, consumer groups, partition rebalancing, offset commits, and at-least-once vs exactly-once semantics.',
  },

  // --- Backend Engineering & Core Tech ---
  {
    id: 'be_1',
    category: 'backend',
    title: 'Python Asyncio & Event Loop Internals',
    platform: 'Official Docs / Deep Dive',
    link: 'https://docs.python.org/3/library/asyncio.html',
    difficulty: 'Medium',
    pattern: 'Concurrency & I/O Multiplexing',
    timeGoal: '30 mins',
    summary: 'Understand coroutines, tasks, selectors, epoll, cooperative multitasking, and when the GIL affects thread pools.',
  },
  {
    id: 'be_2',
    category: 'backend',
    title: 'PostgreSQL Indexing & EXPLAIN ANALYZE',
    platform: 'Database Guide',
    link: 'https://use-the-index-luke.com/',
    difficulty: 'Medium',
    pattern: 'Query Performance & B-Trees',
    timeGoal: '40 mins',
    summary: 'B-Tree vs Hash vs GIN indexes, index-only scans, composite key column ordering, and avoiding N+1 ORM regressions.',
  },
  {
    id: 'be_3',
    category: 'backend',
    title: 'FastAPI Production Microservices Architecture',
    platform: 'Production Guide',
    link: 'https://fastapi.tiangolo.com/tutorial/bigger-applications/',
    difficulty: 'Easy',
    pattern: 'Clean Architecture & Pydantic',
    timeGoal: '25 mins',
    summary: 'Lifespan context managers, dependency injection, connection pooling, and structured error propagation.',
  },
  {
    id: 'be_4',
    category: 'backend',
    title: 'Docker & Kubernetes Core Primitives',
    platform: 'Cloud Native Guide',
    link: 'https://kubernetes.io/docs/concepts/',
    difficulty: 'Medium',
    pattern: 'Container Orchestration',
    timeGoal: '45 mins',
    summary: 'Multi-stage Dockerfiles, Pods, Deployments, Services, Ingress controllers, and liveness/readiness health probes.',
  },

  // --- Behavioral & Executive Communication ---
  {
    id: 'beh_1',
    category: 'behavioral',
    title: 'The STAR Method Masterclass (Executive Framing)',
    platform: 'Coaching Framework',
    link: 'https://www.thebalancecareers.com/what-is-the-star-interview-response-technique-2061629',
    difficulty: 'Easy',
    pattern: 'Situation • Task • Action • Result',
    timeGoal: '20 mins',
    summary: 'Transform passive answers into personal ownership stories. Spend 60% of response time on specific Action and quantified Result.',
  },
  {
    id: 'beh_2',
    category: 'behavioral',
    title: 'Amazon 16 Leadership Principles Question Guide',
    platform: 'Interview Guide',
    link: 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles',
    difficulty: 'Medium',
    pattern: 'Customer Obsession & Ownership',
    timeGoal: '35 mins',
    summary: 'Master behavioral questions testing Have Backbone; Disagree and Commit, Dive Deep, and Bias for Action with metrics.',
  },
  {
    id: 'beh_3',
    category: 'behavioral',
    title: 'Production Incident Post-Mortem Story Framing',
    platform: 'Culture & Reliability',
    link: 'https://sre.google/sre-book/postmortem-culture/',
    difficulty: 'Medium',
    pattern: 'Blameless Post-Mortems',
    timeGoal: '25 mins',
    summary: 'How to describe a catastrophic bug or production outage constructively: detection, containment, root cause, and preventative guardrails.',
  },
];

export default function PreparationRoadmap({ candidate }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [completedItems, setCompletedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('prepzo_completed_resources');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('prepzo_completed_resources', JSON.stringify(completedItems));
    } catch {}
  }, [completedItems]);

  const toggleCompleted = (id) => {
    setCompletedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredResources = useMemo(() => {
    return PREPARATION_RESOURCES.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'all' || item.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
      return matchCat && matchDiff;
    });
  }, [selectedCategory, selectedDifficulty]);

  const totalCount = PREPARATION_RESOURCES.length;
  const completedCount = Object.values(completedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const getDifficultyBadge = (diff) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30';
      case 'medium':
        return 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30';
      case 'hard':
        return 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30';
      default:
        return 'bg-[#0A84FF]/15 text-[#0A84FF] border-[#0A84FF]/30';
    }
  };

  const getPlatformIcon = (platform) => {
    if (platform.includes('LeetCode') || platform.includes('CodeChef')) return <Code2 className="w-3.5 h-3.5 text-[#FF9F0A]" />;
    if (platform.includes('Book') || platform.includes('Guide')) return <BookOpen className="w-3.5 h-3.5 text-[#0A84FF]" />;
    return <Compass className="w-3.5 h-3.5 text-[#30D158]" />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header & Feature Roadmap Overview */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#0A84FF] tracking-wide uppercase mb-1.5">
          <Compass className="w-3.5 h-3.5" />
          <span>Curated Learning Paths & Coding Practice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Interview Preparation &amp; Skill Improvement Roadmap
        </h1>
        <p className="text-xs sm:text-sm text-[#98989D] mt-1 max-w-2xl leading-relaxed">
          Targeted study references, algorithmic problem sets across LeetCode &amp; CodeChef, system design blueprints, and behavioral execution guides.
        </p>
      </div>

      {/* Progress & Milestone Tracker */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-apple-card backdrop-blur-2xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">Your Preparation Progress</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30">
                {progressPercent}% Complete
              </span>
            </div>
            <p className="text-xs text-[#98989D] mt-0.5">
              {completedCount} of {totalCount} curated topics and problem sets mastered
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs text-[#98989D]">
            <div className="flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-[#FF9F0A]" />
              <span>Target Role: <strong className="text-white">{candidate?.target_role || 'SDE'}</strong></span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/[0.08] rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#0A84FF] to-[#30D158] h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'dsa', label: 'LeetCode & CodeChef' },
            { id: 'system_design', label: 'System Design' },
            { id: 'backend', label: 'Backend Architecture' },
            { id: 'behavioral', label: 'Behavioral & STAR' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                selectedCategory === tab.id
                  ? 'bg-white/[0.14] text-white shadow-apple-pill font-semibold'
                  : 'text-[#98989D] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#98989D]" />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-[#1C1C1E] border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#0A84FF] transition"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy Fundamentals</option>
            <option value="medium">Medium Standard</option>
            <option value="hard">Hard Senior</option>
          </select>
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map(item => {
          const isDone = Boolean(completedItems[item.id]);
          return (
            <div
              key={item.id}
              className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between backdrop-blur-xl ${
                isDone
                  ? 'bg-[#30D158]/[0.03] border-[#30D158]/30'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.05]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-[#D1D1D6] font-medium">
                      {getPlatformIcon(item.platform)}
                      <span>{item.platform}</span>
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getDifficultyBadge(item.difficulty)}`}>
                      {item.difficulty}
                    </span>
                    {item.timeGoal && (
                      <span className="text-[10px] text-[#98989D] flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.timeGoal}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleCompleted(item.id)}
                    className="p-1 rounded-full hover:bg-white/[0.08] transition text-[#98989D] hover:text-white"
                    title={isDone ? "Mark Incomplete" : "Mark Mastered"}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-[#30D158]" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#636366]" />
                    )}
                  </button>
                </div>

                <h3 className={`text-sm font-semibold mb-1 transition ${isDone ? 'text-[#D1D1D6] line-through' : 'text-white'}`}>
                  {item.title}
                </h3>
                <p className="text-[11px] text-[#98989D] font-medium mb-2 flex items-center space-x-1">
                  <span>Pattern:</span>
                  <span className="text-[#0A84FF]">{item.pattern}</span>
                </p>

                <p className="text-xs text-[#AEAEB2] leading-relaxed mb-4">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-[#636366]">
                  {isDone ? "Status: Completed" : "Ready for Practice"}
                </span>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-[#0A84FF] hover:text-[#70B4FF] transition"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
