import React, { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  Code2,
  BookOpen,
  AlertTriangle,
  Play,
  RotateCcw,
  Target,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { ProgressSummary, CodingProblem } from '../types';
import { NavTab } from '../components/layout/Sidebar';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenProblem: (id: number) => void;
  onOpenOnboarding: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenProblem,
  onOpenOnboarding,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [dailyProblem, setDailyProblem] = useState<CodingProblem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (isAuthenticated) {
          const res = await apiClient.get<ProgressSummary>('/progress/summary');
          setSummary(res.data);
        }

        // Fetch daily challenge or first problem
        const probRes = await apiClient.get<CodingProblem[]>('/questions/list');
        if (probRes.data && probRes.data.length > 0) {
          setDailyProblem(probRes.data[0]);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  const prefLang = user?.preferences?.preferred_language || 'python';
  const prefLevel = user?.preferences?.experience_level || 'beginner';
  const prefGoal = user?.preferences?.goal || 'dsa';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900/60 via-surface-card to-background-darker p-6 sm:p-8 border border-brand-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-300 border border-brand-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personalized AI Coding Mentor Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.full_name ? user.full_name.split(' ')[0] : 'Engineer'}! 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track: <span className="font-semibold text-white capitalize">{prefLang}</span> • Level: <span className="font-semibold text-white capitalize">{prefLevel}</span> • Focus: <span className="font-semibold text-accent-cyan uppercase">{prefGoal.replace('_', ' ')}</span>.
              Ready to sharpen your logical intuition with step-by-step dry runs today?
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('tutor')}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan px-4 py-2.5 text-xs font-bold text-white shadow-glow-brand hover:opacity-90 transition-all cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Ask AI Tutor</span>
            </button>
            <button
              onClick={onOpenOnboarding}
              className="flex items-center space-x-2 rounded-xl bg-surface-card px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white border border-surface-border hover:border-slate-600 transition-colors cursor-pointer"
            >
              <span>Preferences</span>
            </button>
          </div>
        </div>

        {/* Ambient Decorative Glow */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row (Real Data Driven) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="rounded-2xl bg-surface-card p-5 border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Daily Streak</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              {summary ? summary.streak_days : 0}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary && summary.streak_days > 0 ? 'Consecutive learning days' : 'Solve a challenge to start streak'}
          </p>
        </div>

        {/* Problems Solved */}
        <div className="rounded-2xl bg-surface-card p-5 border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Problems Solved</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              {summary ? summary.problems_solved : 0}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              / {summary ? summary.total_attempts : 0} attempts
            </span>
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1">
            {summary && summary.total_attempts > 0 ? `${summary.accuracy_percentage}% Accuracy` : '0 recorded attempts'}
          </p>
        </div>

        {/* Study Hours */}
        <div className="rounded-2xl bg-surface-card p-5 border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Estimated Practice</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              {summary ? summary.learning_hours : 0}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">hours</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Hands-on code execution time</p>
        </div>

        {/* Average Mastery */}
        <div className="rounded-2xl bg-surface-card p-5 border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Topic Mastery</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-purple/10 text-accent-purple">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              {summary && summary.topic_mastery.length > 0
                ? `${Math.round(summary.topic_mastery.reduce((a, b) => a + b.score, 0) / summary.topic_mastery.length)}%`
                : '0%'}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">verified</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Based on test cases & quizzes</p>
        </div>
      </div>

      {/* Main Grid: Weekly Activity Chart + Daily Challenge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Chart & Mastery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Activity Chart */}
          <div className="rounded-2xl bg-surface-card p-6 border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Weekly Problem Solving Activity</h3>
                <p className="text-xs text-slate-400 mt-0.5">Recorded coding attempts over the past 7 days</p>
              </div>
              <button
                onClick={() => onNavigate('progress')}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                Detailed Analytics <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="h-60 w-full">
              {summary && summary.recent_activity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.recent_activity}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="problems" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-500">
                  <BarChart className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-xs">No activity recorded yet this week</span>
                </div>
              )}
            </div>
          </div>

          {/* Continue Learning / Concepts in Progress */}
          <div className="rounded-2xl bg-surface-card p-6 border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Curriculum Track Modules</h3>
                <p className="text-xs text-slate-400 mt-0.5">Core concept explanations, dry runs, and line-by-line notes</p>
              </div>
              <button
                onClick={() => onNavigate('concepts')}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                Browse All <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Variables & Memory Reference', lang: 'Python', icon: Code2, desc: 'Object model, pointers, heap allocation', slug: 'py-vars-intro' },
                { title: 'Recursion & Call Stack Frames', lang: 'Python', icon: BookOpen, desc: 'Base cases, stack frames, dry run steps', slug: 'py-recursion-fundamentals' },
                { title: 'Pointers & Address Operators', lang: 'C++', icon: Code2, desc: 'Direct memory indirection, dereferencing', slug: 'cpp-pointers-basics' },
                { title: 'Classes, Objects & Encapsulation', lang: 'Java', icon: BookOpen, desc: 'OOP blueprints, heap state, getters/setters', slug: 'java-classes-objects' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate('concepts')}
                  className="group flex cursor-pointer items-start justify-between rounded-xl bg-surface-hover/50 p-4 border border-surface-border hover:border-brand-500/40 hover:bg-surface-hover transition-all"
                >
                  <div className="space-y-1">
                    <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-400 border border-brand-500/20">
                      {item.lang}
                    </span>
                    <h4 className="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-brand-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Daily Challenge & Weak Topics */}
        <div className="space-y-6">
          {/* Daily Challenge Card */}
          {dailyProblem && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-card to-background-darker p-5 border border-brand-500/30 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Target className="h-4 w-4" />
                  <span>Daily Coding Challenge</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 capitalize">
                  {dailyProblem.difficulty}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-bold text-white">{dailyProblem.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {dailyProblem.statement}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Topic: <strong className="text-slate-200">{dailyProblem.topic}</strong></span>
                  <span className="font-mono text-brand-300 capitalize">{dailyProblem.language}</span>
                </div>
              </div>

              <button
                onClick={() => onOpenProblem(dailyProblem.id)}
                className="mt-5 flex w-full items-center justify-center space-x-2 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-glow-brand hover:bg-brand-500 transition-all cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Solve in Monaco Playground</span>
              </button>
            </div>
          )}

          {/* Weak Topics / Smart Tutor Recommendations */}
          <div className="rounded-2xl bg-surface-card p-5 border border-surface-border">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white">Targeted Revision Recommendations</h4>
            </div>

            <div className="mt-3 space-y-3">
              {summary && summary.weak_topics.length > 0 ? (
                summary.weak_topics.map((wt, i) => (
                  <div key={i} className="rounded-xl bg-surface-hover/60 p-3 border border-surface-border/50 text-xs">
                    <p className="font-semibold text-white">{wt.topic}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{wt.reason}</p>
                    <p className="text-[11px] text-brand-300 mt-1">{wt.suggested_action}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-surface-hover/40 p-4 text-center border border-surface-border/40">
                  <CheckCircle2 className="h-6 w-6 text-accent-emerald mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-white">No weak concepts detected</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Solve practice questions to receive adaptive conceptual feedback and targeted drill suggestions.
                  </p>
                  <button
                    onClick={() => onNavigate('practice')}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 cursor-pointer"
                  >
                    Start practice problems <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
