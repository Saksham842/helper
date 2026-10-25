'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  Play,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  source: string;
  modelAnswer: string;
  keyPoints: string[];
}

const INITIAL_QUESTIONS: QuestionItem[] = [
  {
    id: 'q-1',
    category: 'System Design',
    difficulty: 'Hard',
    question: 'How do you design a distributed URL shortener (e.g. TinyURL) supporting 50,000 writes/sec and 5,000,000 reads/sec?',
    source: 'Live HUD Session • Stripe Bar Raiser',
    modelAnswer:
      'Partition the system using distributed unique 64-bit ID generators (Twitter Snowflake/KSUID) encoded in Base62. Store metadata in horizontally sharded NoSQL (Cassandra/DynamoDB) keyed by short_hash. Front reads with distributed Redis cluster (LRU eviction) to achieve sub-10ms latency.',
    keyPoints: [
      'Base62 encoding (62^7 = ~3.5 trillion URLs)',
      'Snowflake 64-bit ID generation without central database bottleneck',
      'Multi-tiered caching with 80/20 read traffic pattern',
      'Rate limiting and Bloom filters to block malicious non-existent queries',
    ],
  },
  {
    id: 'q-2',
    category: 'Algorithms',
    difficulty: 'Hard',
    question: 'Design a Data Structure for Finding Median from a Data Stream with O(1) median query and O(log N) insertion.',
    source: 'Live HUD Session • Google DSA',
    modelAnswer:
      'Maintain two priority queues (heaps): a max-heap for the smaller half of numbers and a min-heap for the larger half. Balance heaps after every insertion so their sizes differ by at most 1. The median is either the top of the larger heap or the average of both tops.',
    keyPoints: [
      'Dual heap approach (MaxHeap for lower half, MinHeap for upper half)',
      'Balancing condition: |size(Max) - size(Min)| <= 1',
      'Time Complexity: O(log N) per insert, O(1) for findMedian',
      'Space Complexity: O(N) total storage',
    ],
  },
  {
    id: 'q-3',
    category: 'Frontend & React',
    difficulty: 'Medium',
    question: 'How does React 19 Concurrent Rendering and Suspense optimize UI responsiveness during heavy state transitions?',
    source: 'Mock Interview • Frontend Specialist',
    modelAnswer:
      'React 19 separates state updates into urgent and non-urgent transitions (via useTransition and useDeferredValue). Non-urgent renders can be paused or abandoned if new input arrives, keeping the main thread free for 60fps input latency (INP). Suspense boundaries coordinate fallback loading states without unmounting surrounding DOM trees.',
    keyPoints: [
      'Interruptible background rendering without blocking browser event loop',
      'useTransition hooks for non-urgent filter/sort calculations',
      'Automatic batching across asynchronous microtasks and timers',
      'Optimized hydration mechanics with streaming SSR',
    ],
  },
  {
    id: 'q-4',
    category: 'System Design',
    difficulty: 'Medium',
    question: 'What is the difference between Optimistic Concurrency Control and Pessimistic Locking in high-concurrency ticket reservations?',
    source: 'Live HUD Session • Uber Backend',
    modelAnswer:
      'Pessimistic locking uses database row/table locks (SELECT FOR UPDATE) preventing concurrent access until commit, preventing conflicts at the cost of high throughput degradation and potential deadlocks. Optimistic locking verifies a version column at commit time (WHERE id = ? AND version = ?); if version changed, the transaction aborts and retries. For ticket booking, pessimistic locks or Redis distributed locks (Redlock) with short TTLs are typically preferred to prevent duplicate seat assignments.',
    keyPoints: [
      'Pessimistic: Safe for high-contention resources, lower throughput',
      'Optimistic: High read performance, retry loops under collision',
      'Distributed lock with Redis Lua script for millisecond-level atomicity',
    ],
  },
  {
    id: 'q-5',
    category: 'Behavioral & Leadership',
    difficulty: 'Medium',
    question: 'Describe a situation where you had a strong technical disagreement with a team lead and how you resolved it.',
    source: 'Mock Drill • Behavioral Track',
    modelAnswer:
      'Answer following the STAR method: Frame the Situation (disagreement over GraphQL vs REST/gRPC for a mobile API), Task (deliver high-throughput API with tight deadlines), Action (created empirical latency and payload benchmarks, organized an objective tradeoff matrix with team lead, agreed on pilot branch), and Result (lead adopted gRPC for microservices and REST for client, reducing network serialization overhead by 40%).',
    keyPoints: [
      'STAR structure (Situation, Task, Action, Result)',
      'Empirical data and benchmarks over personal opinions',
      'Commitment to team alignment and shared post-decision ownership',
    ],
  },
  {
    id: 'q-6',
    category: 'Concurrency & DB',
    difficulty: 'Hard',
    question: 'How do you prevent cache stampede / thundering herd when a popular Redis key expires simultaneously for thousands of concurrent requests?',
    source: 'Live HUD Session • Netflix Architecture',
    modelAnswer:
      'Three proven architectural mitigations: 1) Probabilistic Early Expiration (XFetch algorithm) where requests compute if they should refresh the cache before true TTL expires; 2) Distributed Mutex Lock (single worker acquires lock to query DB, remaining requests wait or serve stale cache); 3) Background cron refresh worker ensuring keys never expire synchronously in the critical path.',
    keyPoints: [
      'XFetch probabilistic early computation formula',
      'Mutex locking via Redis SET key val NX EX 5',
      'Serve stale cache while background worker updates database asynchronously',
    ],
  },
];

export default function QuestionBankPage() {
  const [questions] = useState<QuestionItem[]>(INITIAL_QUESTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = ['All', 'System Design', 'Algorithms', 'Frontend & React', 'Behavioral & Leadership', 'Concurrency & DB'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.modelAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.source.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [questions, searchQuery, selectedCategory, selectedDifficulty]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f5]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#090a0f]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-bold text-white text-sm">Personal Question Bank</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/mock"
            className="flex items-center gap-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 px-3.5 py-1.5 text-xs font-bold text-black transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-black" />
            <span>Practice Drills</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-purple-950/20 via-[#12141c] to-[#12141c] p-6 md:p-8 shadow-xl">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Indexed Technical Question Bank
              <Sparkles className="h-5 w-5 text-purple-400" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Every question encountered during your live stealth HUD interviews and mock practice sessions is automatically indexed here with model answers and core architecture bullet points.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-xs text-purple-300">
            <BookOpen className="h-4 w-4 text-purple-400 flex-shrink-0" />
            <span>{filteredQuestions.length} Questions Available</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions, keywords (e.g. Redis, gRPC, median, STAR)..."
                className="w-full rounded-2xl border border-white/10 bg-[#12141c] pl-10 pr-4 py-3 text-xs text-white focus:border-purple-500 focus:outline-none shadow-sm"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[#12141c] p-1.5 w-full sm:w-auto">
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    selectedDifficulty === d
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  selectedCategory === cat
                    ? 'border-purple-500/40 bg-purple-500/10 text-white font-semibold'
                    : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="flex flex-col gap-4">
          {filteredQuestions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#12141c] p-12 text-center text-xs text-zinc-500">
              No questions found matching your filter criteria. Try searching for a different keyword.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isExpanded = expandedId === q.id;
              const isBookmarked = bookmarkedIds.has(q.id);

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-purple-500/30 bg-[#141520]'
                      : 'border-white/10 bg-[#12141c] hover:border-white/20'
                  }`}
                >
                  <div className="p-6 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                          {q.category}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            q.difficulty === 'Hard'
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              : q.difficulty === 'Medium'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">{q.source}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBookmark(q.id)}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            isBookmarked
                              ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                              : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                          }`}
                          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                        >
                          {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white leading-relaxed">{q.question}</h3>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Model Answer' : 'View Model Answer & Key Points'}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      <Link
                        href="/dashboard/mock"
                        className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors"
                      >
                        <Play className="h-3 w-3" />
                        <span>Practice in Voice Simulator</span>
                      </Link>
                    </div>
                  </div>

                  {/* Expandable Model Answer Drawer */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 flex flex-col gap-4 bg-black/20 rounded-b-2xl">
                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                          Architectural Model Answer
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                          {q.modelAnswer}
                        </p>
                      </div>

                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                          Core High-Impact Bullet Points (Glanceable on HUD)
                        </span>
                        <ul className="flex flex-col gap-2">
                          {q.keyPoints.map((pt, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                              <span className="text-purple-400 font-bold">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
