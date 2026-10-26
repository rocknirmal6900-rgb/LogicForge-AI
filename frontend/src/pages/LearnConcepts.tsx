import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Code2,
  Layers,
  HelpCircle,
  Play,
  Sparkles,
  Award,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  X,
  Clock,
} from 'lucide-react';
import apiClient from '../services/api';
import { Topic, Lesson, Language } from '../types';
import { useAuth } from '../context/AuthContext';

interface LearnConceptsProps {
  onOpenTutor: (conceptContext: string) => void;
  onOpenPlayground: () => void;
}

export const LearnConcepts: React.FC<LearnConceptsProps> = ({
  onOpenTutor,
  onOpenPlayground,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    user?.preferences?.preferred_language || 'python'
  );
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    fetchTopics(selectedLanguage);
  }, [selectedLanguage]);

  const fetchTopics = async (lang: Language) => {
    setLoading(true);
    try {
      const res = await apiClient.get<Topic[]>(`/concepts/topics?language=${lang}`);
      setTopics(res.data);
    } catch (err) {
      console.error('Error fetching concept topics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLesson = async (slug: string) => {
    try {
      const res = await apiClient.get<Lesson>(`/concepts/lessons/${slug}`);
      setActiveLesson(res.data);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
    } catch (err) {
      console.error('Error opening lesson', err);
    }
  };

  const handleMarkComplete = async () => {
    if (!activeLesson || !isAuthenticated) return;
    try {
      await apiClient.post(`/concepts/lessons/${activeLesson.id}/complete`);
      setActiveLesson({ ...activeLesson, is_completed: true });
      fetchTopics(selectedLanguage);
    } catch (err) {
      console.error('Error marking lesson complete', err);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeLesson) return;
    try {
      const res = await apiClient.post(`/concepts/lessons/${activeLesson.id}/quiz`, quizAnswers);
      setQuizResult(res.data);
      setQuizSubmitted(true);
      fetchTopics(selectedLanguage);
    } catch (err) {
      console.error('Error submitting quiz', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Language Track Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-400" />
            Curated Concept Library
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Master fundamental data structures, line-by-line mental models, and memory architectures.
          </p>
        </div>

        {/* Multi-language Selector Tabs */}
        <div className="flex rounded-xl bg-surface-card p-1 border border-surface-border self-start">
          {[
            { id: 'python' as Language, label: 'Python 3' },
            { id: 'cpp' as Language, label: 'C++' },
            { id: 'java' as Language, label: 'Java' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedLanguage(tab.id);
                setActiveLesson(null);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedLanguage === tab.id
                  ? 'bg-brand-600 text-white shadow-glow-brand'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DETAIL MODAL / VIEW FOR ACTIVE LESSON */}
      {activeLesson ? (
        <div className="space-y-6 rounded-3xl bg-surface-card p-6 sm:p-8 border border-surface-border shadow-2xl animate-in fade-in duration-200">
          {/* Top back bar */}
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <button
              onClick={() => setActiveLesson(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Topics</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenTutor(`I have a question about ${activeLesson.title}`)}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500/15 px-3 py-1.5 text-xs font-semibold text-brand-300 border border-brand-500/30 hover:bg-brand-500/25 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask AI Tutor About This</span>
              </button>

              <button
                onClick={handleMarkComplete}
                disabled={activeLesson.is_completed}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeLesson.is_completed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-brand-600 text-white shadow-glow-brand hover:bg-brand-500'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{activeLesson.is_completed ? 'Completed' : 'Mark as Completed'}</span>
              </button>
            </div>
          </div>

          {/* Lesson Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 capitalize">
              <span>{activeLesson.language}</span>
              <span>•</span>
              <span>Lesson Module</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {activeLesson.title}
            </h2>
          </div>

          {/* 1. Learning Objectives */}
          {activeLesson.objectives && activeLesson.objectives.length > 0 && (
            <div className="rounded-2xl bg-surface-hover/50 p-4 border border-surface-border">
              <span className="text-xs font-bold text-slate-200 block mb-2">
                🎯 Learning Objectives
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeLesson.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-emerald shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Conceptual Explanation */}
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {activeLesson.content_markdown}
          </div>

          {/* 3. Code Example & Line-by-Line Breakdown */}
          {activeLesson.code_example && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-brand-400" />
                  Code Example & Syntax
                </span>
                <button
                  onClick={onOpenPlayground}
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
                >
                  Run in Playground →
                </button>
              </div>

              <div className="rounded-2xl bg-background-darker p-4 font-mono text-xs text-slate-200 border border-surface-border overflow-x-auto">
                <pre>{activeLesson.code_example}</pre>
              </div>
            </div>
          )}

          {/* 4. Line-by-Line Explanation Table */}
          {activeLesson.line_by_line && activeLesson.line_by_line.length > 0 && (
            <div className="rounded-2xl bg-background-darker p-4 border border-surface-border">
              <span className="text-xs font-bold text-slate-200 block mb-3">
                🔍 Line-by-Line Deep Dive
              </span>
              <div className="space-y-2">
                {activeLesson.line_by_line.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 text-xs font-mono p-2 rounded-lg bg-surface-card/60">
                    <span className="col-span-1 text-slate-500 font-bold">Line {item.line}</span>
                    <span className="col-span-5 text-brand-300 truncate">{item.code}</span>
                    <span className="col-span-6 text-slate-300 font-sans">{item.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Dry Run Simulation State Table */}
          {activeLesson.dry_run_data && activeLesson.dry_run_data.length > 0 && (
            <div className="rounded-2xl bg-background-darker p-4 border border-surface-border">
              <span className="text-xs font-bold text-emerald-400 block mb-3 flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                Dry Run Simulation: State Trace
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-surface-border text-slate-400">
                      <th className="pb-2">Step</th>
                      <th className="pb-2">Memory & Variable State</th>
                      <th className="pb-2">Execution Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50">
                    {activeLesson.dry_run_data.map((step, idx) => (
                      <tr key={idx} className="font-mono">
                        <td className="py-2 text-slate-400 font-bold">Step {step.step}</td>
                        <td className="py-2 text-accent-cyan">
                          {JSON.stringify(step.state).replace(/[{""}]/g, '')}
                        </td>
                        <td className="py-2 text-slate-300 font-sans">{step.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Common Pitfalls & Mistakes */}
          {activeLesson.common_mistakes && activeLesson.common_mistakes.length > 0 && (
            <div className="rounded-2xl bg-rose-500/10 p-4 border border-rose-500/20">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Common Conceptual Mistakes & Gotchas
              </span>
              <ul className="space-y-1 text-xs text-rose-200/90 list-disc list-inside">
                {activeLesson.common_mistakes.map((mistake, mIdx) => (
                  <li key={mIdx}>{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 7. Conceptual Quiz */}
          {activeLesson.quiz && activeLesson.quiz.length > 0 && (
            <div className="rounded-2xl bg-surface-hover/60 p-5 border border-surface-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-brand-400" />
                  Quick Concept Mastery Check
                </span>
                {quizSubmitted && quizResult && (
                  <span className="text-xs font-bold text-accent-cyan">
                    Score: {quizResult.score_percentage}%
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {activeLesson.quiz.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-xs font-semibold text-slate-200">{q.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[q.id.toString()] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (!quizSubmitted) {
                                setQuizAnswers({ ...quizAnswers, [q.id.toString()]: optIdx });
                              }
                            }}
                            className={`rounded-xl p-3 text-left text-xs transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-brand-600/30 border-brand-500 text-white font-medium'
                                : 'bg-surface-card border-surface-border text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!quizSubmitted ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(quizAnswers).length === 0}
                    className="mt-4 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-glow-brand hover:bg-brand-500 disabled:opacity-50 cursor-pointer"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <div className="mt-3 p-3 rounded-xl bg-background-darker border border-surface-border text-xs text-slate-300">
                    <p className="font-semibold text-emerald-400">
                      Quiz evaluated! Your mastery score has been updated.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TOPIC GRID LIST */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex flex-col justify-between rounded-2xl bg-surface-card p-6 border border-surface-border hover:border-brand-500/40 transition-all shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-300 capitalize">
                    {topic.language}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{topic.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                {/* Mastery Progress Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Mastery</span>
                    <span className="font-bold text-white">{Math.round(topic.mastery_percentage)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-hover overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan rounded-full transition-all duration-500"
                      style={{ width: `${topic.mastery_percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lesson Links */}
              <div className="mt-6 pt-4 border-t border-surface-border/60 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">Lessons:</span>
                {topic.lessons && topic.lessons.map((les) => (
                  <button
                    key={les.id}
                    onClick={() => handleOpenLesson(les.slug)}
                    className="flex w-full items-center justify-between rounded-xl bg-surface-hover/40 px-3 py-2 text-xs text-slate-300 hover:bg-surface-hover hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <span className="truncate">{les.title}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
