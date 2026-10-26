import React, { useState, useEffect } from 'react';
import {
  Code2,
  Sparkles,
  CheckCircle2,
  Play,
  Filter,
  Plus,
  Layers,
  Search,
  ArrowRight,
  X,
} from 'lucide-react';
import apiClient from '../services/api';
import { CodingProblem, Language, Difficulty } from '../types';
import { useAuth } from '../context/AuthContext';

interface PracticeProblemsProps {
  onSolveProblem: (id: number) => void;
}

export const PracticeProblems: React.FC<PracticeProblemsProps> = ({ onSolveProblem }) => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Adaptive Generator Modal State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genTopic, setGenTopic] = useState('Arrays & Hashing');
  const [genLanguage, setGenLanguage] = useState<Language>(
    user?.preferences?.preferred_language || 'python'
  );
  const [genDifficulty, setGenDifficulty] = useState<Difficulty>('easy');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<CodingProblem[]>('/questions/list');
      setProblems(res.data);
    } catch (err) {
      console.error('Error fetching problems', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAdaptive = async () => {
    setIsGenerating(true);
    try {
      const res = await apiClient.post<CodingProblem>('/questions/generate', {
        language: genLanguage,
        topic: genTopic,
        difficulty: genDifficulty,
        adapt_to_user_history: true,
      });

      setShowGenModal(false);
      fetchProblems();
      onSolveProblem(res.data.id);
    } catch (err) {
      console.error('Failed to generate adaptive question', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = problems.filter((p) => {
    const matchLang = selectedLanguage === 'all' || p.language === selectedLanguage;
    const matchDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLang && matchDiff && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Code2 className="h-6 w-6 text-brand-400" />
            Adaptive Practice Problems
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Solve DSA problems with real automated test-case evaluation and progressive AI hints.
          </p>
        </div>

        {/* Generate Adaptive Question Trigger Button */}
        <button
          onClick={() => setShowGenModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan px-4 py-2.5 text-xs font-bold text-white shadow-glow-brand hover:opacity-90 transition-all cursor-pointer self-start"
        >
          <Sparkles className="h-4 w-4" />
          <span>Generate Adaptive Challenge</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-card p-3 border border-surface-border text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Language filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-xl bg-surface-hover px-3 py-1.5 text-slate-200 border border-surface-border focus:outline-none"
          >
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          {/* Difficulty filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded-xl bg-surface-hover px-3 py-1.5 text-slate-200 border border-surface-border focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems or topics..."
            className="w-full rounded-xl bg-background-darker pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 border border-surface-border focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Problem Cards Grid */}
      <div className="space-y-3">
        {filtered.map((prob) => (
          <div
            key={prob.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-surface-card p-5 border border-surface-border hover:border-brand-500/40 transition-all shadow-md"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white hover:text-brand-300 transition-colors">
                  {prob.title}
                </h3>
                {prob.solved && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Solved
                  </span>
                )}
                {prob.is_ai_generated && (
                  <span className="rounded-full bg-accent-purple/15 px-2 py-0.5 text-[10px] font-semibold text-accent-purple border border-accent-purple/30">
                    AI Adaptive
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                <span className="capitalize font-mono text-brand-300">{prob.language}</span>
                <span>•</span>
                <span>{prob.topic}</span>
                <span>•</span>
                <span
                  className={`font-semibold capitalize ${
                    prob.difficulty === 'easy'
                      ? 'text-emerald-400'
                      : prob.difficulty === 'medium'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {prob.difficulty}
                </span>
                <span>•</span>
                <span>{prob.test_cases?.length || 0} Test Cases</span>
              </div>
            </div>

            <button
              onClick={() => onSolveProblem(prob.id)}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-glow-brand hover:bg-brand-500 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Solve Challenge</span>
            </button>
          </div>
        ))}
      </div>

      {/* ADAPTIVE GENERATOR MODAL */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-surface-card p-6 shadow-2xl border border-surface-border">
            <button
              onClick={() => setShowGenModal(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-surface-hover hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan shadow-glow-brand">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Generate Adaptive Problem</h2>
              <p className="text-xs text-slate-400 mt-1">
                The engine reviews your past attempt history to formulate a problem at the right frontier of difficulty.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Language Track
                </label>
                <select
                  value={genLanguage}
                  onChange={(e) => setGenLanguage(e.target.value as Language)}
                  className="w-full rounded-xl bg-background-darker px-3 py-2 text-xs text-white border border-surface-border focus:border-brand-500 focus:outline-none"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Algorithm / Data Structure Topic
                </label>
                <select
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full rounded-xl bg-background-darker px-3 py-2 text-xs text-white border border-surface-border focus:border-brand-500 focus:outline-none"
                >
                  <option value="Arrays & Hashing">Arrays & Hashing</option>
                  <option value="Two Pointers">Two Pointers</option>
                  <option value="Recursion & Call Stack">Recursion & Call Stack</option>
                  <option value="Linked Lists">Linked Lists</option>
                  <option value="Binary Search">Binary Search</option>
                  <option value="Trees & Traversal">Trees & Traversal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setGenDifficulty(d)}
                      className={`rounded-xl py-2 text-xs font-bold uppercase transition-all border cursor-pointer ${
                        genDifficulty === d
                          ? 'bg-brand-600 text-white border-brand-500 shadow-glow-brand'
                          : 'bg-background-darker text-slate-400 border-surface-border hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateAdaptive}
                disabled={isGenerating}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-glow-brand hover:bg-brand-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isGenerating ? 'Synthesizing with LLM Engine...' : 'Generate & Solve'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
