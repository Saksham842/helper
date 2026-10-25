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
  Lightbulb,
  Tag,
} from 'lucide-react';
import { QUESTION_BANK, QuestionBankItem, QuestionTag } from '@ghostpilot/shared';

export default function QuestionBankPage() {
  const [questions] = useState<QuestionBankItem[]>(QUESTION_BANK);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = ['All', 'System Design', 'Algorithms', 'Frontend & React', 'Backend & Distributed Systems', 'Behavioral & Leadership'];
  const tags: string[] = ['All', 'Behavioural', 'Technical', 'System Design', 'Coding', 'Strategy', 'Architecture'];
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
        q.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.hint && q.hint.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
      const matchesTag = selectedTag === 'All' || q.tags.includes(selectedTag as QuestionTag);
      const matchesDifficulty = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesTag && matchesDifficulty;
    });
  }, [questions, searchQuery, selectedCategory, selectedTag, selectedDifficulty]);

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
            <span>Practice in Simulator</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Hero Banner */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-purple-950/30 via-[#12141c] to-blue-950/20 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-2 max-w-2xl relative z-10">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                Curated High-Impact Question Bank
              </span>
              <span className="text-xs text-zinc-500">
                {questions.length} questions • Tiered 1–3
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Master High-Stakes Technical & System Design Rounds
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Drill down into real-world interview challenges tagged with difficulty levels, hint guidance, and architectural model answers calibrated for live copilot reference.
            </p>
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search questions, model concepts, hints, or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#12141c] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-purple-500/50 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 shrink-0">
                Difficulty:
              </span>
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedDifficulty === diff
                      ? 'bg-purple-500 text-black font-bold'
                      : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3.5 py-2 text-xs font-medium border-b-2 transition-all ${
                  selectedCategory === cat
                    ? 'border-purple-500 text-purple-300 font-bold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tag Badges Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1 mr-1">
              <Tag className="h-3 w-3" />
              Tag:
            </span>
            {tags.map((tg) => (
              <button
                key={tg}
                onClick={() => setSelectedTag(tg)}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition-colors ${
                  selectedTag === tg
                    ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold'
                    : 'bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {tg}
              </button>
            ))}
          </div>
        </div>

        {/* Question List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>
              Showing {filteredQuestions.length} of {questions.length} questions
            </span>
            {bookmarkedIds.size > 0 && (
              <span className="text-purple-400 font-medium">
                {bookmarkedIds.size} bookmarked
              </span>
            )}
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#12141c] p-12 text-center text-xs text-zinc-500">
              No questions found matching your filter criteria. Try clearing filters or search term.
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
                          {q.difficulty} (Tier {q.difficultyTier})
                        </span>
                        {q.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-medium text-zinc-400"
                          >
                            {t}
                          </span>
                        ))}
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

                    {/* Hint / Strategy Callout */}
                    {q.hint && (
                      <div className="flex items-start gap-2 rounded-xl bg-purple-500/[0.04] border border-purple-500/10 p-2.5 text-xs text-purple-200/90">
                        <Lightbulb className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-purple-300 text-[11px] uppercase tracking-wide mr-1">
                            Strategy Hint:
                          </strong>
                          <span>{q.hint}</span>
                        </div>
                      </div>
                    )}

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
                              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
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
