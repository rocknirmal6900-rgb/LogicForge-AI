import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import apiClient from '../services/api';
import { ProgressSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../components/layout/Sidebar';

interface ProgressAnalyticsProps {
  onNavigate: (tab: NavTab) => void;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ onNavigate }) => {
  const { isAuthenticated, refreshUser } = useAuth();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, [isAuthenticated]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const res = await apiClient.get<ProgressSummary>('/progress/summary');
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Error fetching progress summary', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetHistory = async () => {
    setIsResetting(true);
    try {
      await apiClient.post('/users/reset-history');
      setShowResetConfirm(false);
      fetchProgress();
      await refreshUser();
    } catch (err) {
      console.error('Error resetting history', err);
    } finally {
      setIsResetting(false);
    }
  };

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-400" />
            Learning Analytics & Mastery
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical, transparent progress computed strictly from verified test-case executions and concept quizzes.
          </p>
        </div>

        {/* Reset History Trigger */}
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer self-start"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Learning History</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-surface-card p-5 border border-surface-border">
          <span className="text-xs text-slate-400 font-medium">Problems Solved</span>
          <div className="text-2xl font-black text-white mt-2">
            {summary?.problems_solved || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {summary?.total_attempts || 0} recorded attempts
          </span>
        </div>

        <div className="rounded-2xl bg-surface-card p-5 border border-surface-border">
          <span className="text-xs text-slate-400 font-medium">Empirical Accuracy</span>
          <div className="text-2xl font-black text-accent-cyan mt-2">
            {summary?.accuracy_percentage || 0}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Automated test-suite pass rate
          </span>
        </div>

        <div className="rounded-2xl bg-surface-card p-5 border border-surface-border">
          <span className="text-xs text-slate-400 font-medium">Current Streak</span>
          <div className="text-2xl font-black text-amber-400 mt-2 flex items-center gap-1.5">
            <Flame className="h-6 w-6" />
            {summary?.streak_days || 0}d
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Consecutive active learning days
          </span>
        </div>

        <div className="rounded-2xl bg-surface-card p-5 border border-surface-border">
          <span className="text-xs text-slate-400 font-medium">Hands-on Time</span>
          <div className="text-2xl font-black text-brand-300 mt-2">
            {summary?.learning_hours || 0}h
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Active coding & dry-run drills
          </span>
        </div>
      </div>

      {/* Transparent Mastery Formula Callout */}
      <div className="rounded-2xl bg-brand-500/10 p-5 border border-brand-500/20 text-xs">
        <div className="flex items-center gap-2 text-brand-300 font-bold mb-1.5">
          <Info className="h-4 w-4" />
          <span>Transparent Concept Mastery Formula</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          {summary?.mastery_formula_explanation ||
            "Mastery Score = (50% * Test Pass Rate) + (30% * (1 - Hint Penalty)) + (20% * Concept Quiz Score). Penalties scale gently with hint usage (15% per hint, max 60% penalty) to encourage independent problem solving."}
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="rounded-2xl bg-surface-card p-6 border border-surface-border">
          <h3 className="text-sm font-bold text-white mb-1">Weekly Problem Solving Volume</h3>
          <p className="text-xs text-slate-400 mb-4">Total challenges submitted each day</p>

          <div className="h-64 w-full">
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
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="problems" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No activity data recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Topic Mastery Distribution */}
        <div className="rounded-2xl bg-surface-card p-6 border border-surface-border">
          <h3 className="text-sm font-bold text-white mb-1">Topic-Wise Mastery Levels</h3>
          <p className="text-xs text-slate-400 mb-4">Calculated mastery percentage per syllabus module</p>

          <div className="space-y-4">
            {summary && summary.topic_mastery.length > 0 ? (
              summary.topic_mastery.map((tm, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">{tm.topic}</span>
                    <span className="text-brand-300">{Math.round(tm.score)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan rounded-full transition-all duration-500"
                      style={{ width: `${tm.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{tm.problems_solved} solved</span>
                    <span>{tm.total_attempts} attempts</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-slate-500 text-center p-4">
                No topic attempts recorded yet. Solve practice problems or take concept quizzes to build mastery scores.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weak Topics / Recommendations */}
      {summary && summary.weak_topics.length > 0 && (
        <div className="rounded-2xl bg-surface-card p-6 border border-surface-border space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
            <AlertTriangle className="h-4 w-4" />
            <span>Targeted Weak Concept Recommendations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {summary.weak_topics.map((wt, i) => (
              <div key={i} className="rounded-xl bg-surface-hover/60 p-4 border border-surface-border text-xs space-y-1.5">
                <span className="font-bold text-white block">{wt.topic}</span>
                <p className="text-slate-400 leading-relaxed">{wt.reason}</p>
                <p className="text-brand-300 font-medium">{wt.suggested_action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-card p-6 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <ShieldAlert className="h-5 w-5" />
              <span>Reset Learning History?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will permanently clear all your past problem attempts, topic mastery scores, and lesson progress records. This cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-xl bg-surface-hover py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleResetHistory}
                disabled={isResetting}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset History'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
