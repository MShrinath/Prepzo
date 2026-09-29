import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  ExternalLink,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const RESOURCES = [
  {
    category: 'System Design',
    title: 'SQL vs NoSQL Scalability Trade-offs',
    level: 'Intermediate',
    desc: 'When to pick relational consistency (ACID) vs distributed availability (BASE) in high-throughput architectures.',
    link: 'https://github.com/donnemartin/system-design-primer',
  },
  {
    category: 'Data Structures & Algorithms',
    title: 'Two Pointers & Sliding Window Patterns',
    level: 'Medium',
    desc: 'Optimal O(n) scan techniques for arrays, string substrings, and subarray sum minimization.',
    link: 'https://leetcode.com',
  },
  {
    category: 'Behavioral & Leadership',
    title: 'STAR Method Mastery for Senior Engineers',
    level: 'Foundational',
    desc: 'How to structure Situation, Task, Action, and Measurable Result with engineering ownership metrics.',
    link: 'https://prepzo.ai/guides/star-method',
  },
  {
    category: 'Microservices',
    title: 'Event-Driven Architectures with Kafka & RabbitMQ',
    level: 'Advanced',
    desc: 'Idempotency, dead-letter queues, and outbox pattern implementations in distributed microservices.',
    link: 'https://microservices.io',
  },
];

export default function ResourcesView() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Curated Resources &amp; Guides
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Deep-dive technical primers and behavioral frameworks vetted by hiring managers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {RESOURCES.map((r, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
                  {r.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">{r.level}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                {r.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {r.desc}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">10 min read</span>
              <a
                href={r.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Explore Guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
