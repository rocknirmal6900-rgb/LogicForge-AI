import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Code2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Info,
  Key,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Language, ExperienceLevel, LearningGoal, ExplanationLanguage, UserPreferences } from '../types';

interface SettingsProps {
  onOpenOnboarding: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenOnboarding }) => {
  const { user, updatePreferences } = useAuth();
  const [language, setLanguage] = useState<Language>(
    user?.preferences?.preferred_language || 'python'
  );
  const [level, setLevel] = useState<ExperienceLevel>(
    user?.preferences?.experience_level || 'beginner'
  );
  const [goal, setGoal] = useState<LearningGoal>(
    user?.preferences?.goal || 'dsa'
  );
  const [explanationLang, setExplanationLang] = useState<ExplanationLanguage>(
    user?.preferences?.explanation_language || 'english'
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefs: UserPreferences = {
      preferred_language: language,
      experience_level: level,
      goal: goal,
      explanation_language: explanationLang,
    };
    await updatePreferences(prefs);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-surface-border pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-brand-400" />
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize your personalized coding tutor, language track, explanation dialect, and review system configuration.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="rounded-2xl bg-surface-card p-6 border border-surface-border space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-surface-border">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan text-white text-base font-bold shadow-glow-brand">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{user?.full_name || 'Active Student'}</h3>
            <p className="text-xs text-slate-400">{user?.email || 'Logged in account'}</p>
          </div>
        </div>

        {/* Learning Preferences Form */}
        <form onSubmit={handleSavePreferences} className="space-y-5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 text-brand-400" />
              Tutor Learning Configuration
            </span>
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
            >
              Relaunch Onboarding Wizard →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Programming Track
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full rounded-xl bg-background-darker px-3 py-2 text-xs text-white border border-surface-border focus:border-brand-500 focus:outline-none"
              >
                <option value="python">Python 3 (Dynamic Typing & DSA)</option>
                <option value="cpp">C++ (Pointers & STL)</option>
                <option value="java">Java (OOP & Collections)</option>
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Experience Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
                className="w-full rounded-xl bg-background-darker px-3 py-2 text-xs text-white border border-surface-border focus:border-brand-500 focus:outline-none capitalize"
              >
                <option value="beginner">Beginner (Foundations & Syntax)</option>
                <option value="intermediate">Intermediate (Arrays, Stacks, Functions)</option>
                <option value="advanced">Advanced (Trees, Graphs, DP)</option>
              </select>
            </div>

            {/* Learning Goal */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Learning Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as LearningGoal)}
                className="w-full rounded-xl bg-background-darker px-3 py-2 text-xs text-white border border-surface-border focus:border-brand-500 focus:outline-none"
              >
                <option value="college_exams">College Exams & Viva Preparation</option>
                <option value="dsa">DSA & Problem Solving Mastery</option>
                <option value="interview_prep">FAANG / Tech Interview Preparation</option>
                <option value="general">General Programming & Logic Building</option>
              </select>
            </div>

            {/* Explanation Language */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Explanation Language & Style
              </label>
              <select
                value={explanationLang}
                onChange={(e) => setExplanationLang(e.target.value as ExplanationLanguage)}
                className="w-full rounded-xl bg-background-darker px-3 py-2 text-xs text-white border border-surface-border focus:border-brand-500 focus:outline-none font-semibold text-accent-cyan"
              >
                <option value="english">Standard English (Technical Clarity)</option>
                <option value="hinglish">Hinglish (Hindi + English Conversational Mentor)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-glow-brand hover:bg-brand-500 transition-all cursor-pointer"
            >
              Save Learning Preferences
            </button>
            {isSaved && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Preferences Updated!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* System & Architecture Status */}
      <div className="rounded-2xl bg-surface-card p-6 border border-surface-border space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Runtime Environment & Security Sandbox
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-surface-hover/50 p-3.5 border border-surface-border space-y-1">
            <span className="text-slate-400 font-medium block">Code Runner Sandbox</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Isolated Subprocess Runner Active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Limits: 5.0s CPU timeout, 10KB stdout/stderr buffer, stripped environment variables (no secret leakage).
            </p>
          </div>

          <div className="rounded-xl bg-surface-hover/50 p-3.5 border border-surface-border space-y-1">
            <span className="text-slate-400 font-medium block">Generative AI Dual-Engine Architecture</span>
            <div className="flex items-center gap-1.5 text-brand-300 font-bold">
              <Sparkles className="h-4 w-4" />
              <span>Primary: Google Gemini | Fallback: Groq Cloud</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Google Gemini is configured as the primary reasoning engine. If Gemini is unavailable, rate-limited, or throws an error, the system automatically falls back to Groq Cloud (<code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded">qwen/qwen3.8-27b</code> / <code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded">openai/gpt-oss-120b</code>) with zero student disruption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
