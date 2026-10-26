import React, { useState } from 'react';
import { Sparkles, Code2, GraduationCap, Target, Languages, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Language, ExperienceLevel, LearningGoal, ExplanationLanguage, UserPreferences } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { user, updatePreferences } = useAuth();

  const [step, setStep] = useState<number>(1);
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
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleComplete = async () => {
    setIsSaving(true);
    const prefs: UserPreferences = {
      preferred_language: language,
      experience_level: level,
      goal: goal,
      explanation_language: explanationLang,
    };
    await updatePreferences(prefs);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface-card p-6 sm:p-8 shadow-2xl border border-surface-border">
        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-brand-500'
                    : s < step
                    ? 'w-4 bg-accent-emerald'
                    : 'w-4 bg-surface-border'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-slate-400">Step {step} of 4</span>
        </div>

        {/* STEP 1: PREFERRED LANGUAGE */}
        {step === 1 && (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Code2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Choose Primary Language</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your AI tutor will customize code dry-runs, syntax, and exercises for this track.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'python' as Language,
                  name: 'Python 3',
                  desc: 'Clean syntax, high productivity, ideal for beginners & interview DSA',
                  tag: 'Popular',
                },
                {
                  id: 'cpp' as Language,
                  name: 'C++',
                  desc: 'Pointers, memory management, competitive programming, and STL mastery',
                  tag: 'Fast & Deep',
                },
                {
                  id: 'java' as Language,
                  name: 'Java',
                  desc: 'Object-oriented patterns, JVM concepts, Collections framework',
                  tag: 'Enterprise & Exams',
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setLanguage(opt.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl p-4 border transition-all ${
                    language === opt.id
                      ? 'bg-brand-500/15 border-brand-500 shadow-glow-brand/40 text-white'
                      : 'bg-surface-hover/50 border-surface-border text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{opt.name}</span>
                      <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-300 border border-brand-500/30">
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {language === opt.id && <Check className="h-5 w-5 text-brand-400 shrink-0" />}
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-glow-brand hover:bg-brand-500 transition-all cursor-pointer"
            >
              <span>Next: Experience Level</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 2: EXPERIENCE LEVEL */}
        {step === 2 && (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Your Current Experience Level</h2>
              <p className="text-xs text-slate-400 mt-1">
                We adjust initial problem difficulty and tutor explanations accordingly.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'beginner' as ExperienceLevel,
                  name: 'Beginner',
                  desc: 'New to programming or learning syntax, basic loops, and variables',
                },
                {
                  id: 'intermediate' as ExperienceLevel,
                  name: 'Intermediate',
                  desc: 'Comfortable with functions, arrays, recursion, and basic data structures',
                },
                {
                  id: 'advanced' as ExperienceLevel,
                  name: 'Advanced',
                  desc: 'Familiar with trees, graphs, dynamic programming, and time complexities',
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setLevel(opt.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl p-4 border transition-all ${
                    level === opt.id
                      ? 'bg-accent-cyan/15 border-accent-cyan text-white shadow-glow-cyan/30'
                      : 'bg-surface-hover/50 border-surface-border text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-sm">{opt.name}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {level === opt.id && <Check className="h-5 w-5 text-accent-cyan shrink-0" />}
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 rounded-xl bg-surface-hover py-3 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 flex items-center justify-center space-x-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-glow-brand hover:bg-brand-500 cursor-pointer"
              >
                <span>Next: Learning Goal</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LEARNING GOAL */}
        {step === 3 && (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">What is your primary goal?</h2>
              <p className="text-xs text-slate-400 mt-1">
                We curate your daily challenges and concept tracks to reach this goal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'college_exams' as LearningGoal, name: 'College Exams', desc: 'Syllabus mastery & viva prep' },
                { id: 'dsa' as LearningGoal, name: 'DSA Mastery', desc: 'Data structures & algorithms' },
                { id: 'interview_prep' as LearningGoal, name: 'Interview Prep', desc: 'FAANG & tech interviews' },
                { id: 'general' as LearningGoal, name: 'General Learning', desc: 'Sharpen logic & build projects' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setGoal(opt.id)}
                  className={`flex cursor-pointer flex-col justify-between rounded-xl p-3.5 border transition-all ${
                    goal === opt.id
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-surface-hover/50 border-surface-border text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="font-semibold text-xs">{opt.name}</span>
                  <p className="text-[11px] text-slate-400 mt-1">{opt.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 rounded-xl bg-surface-hover py-3 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="w-2/3 flex items-center justify-center space-x-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-glow-brand hover:bg-brand-500 cursor-pointer"
              >
                <span>Next: Explanation Style</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EXPLANATION LANGUAGE (ENGLISH VS HINGLISH) */}
        {step === 4 && (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                <Languages className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Preferred Explanation Style</h2>
              <p className="text-xs text-slate-400 mt-1">
                How would you like your AI mentor to explain tricky concepts and dry runs?
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'english' as ExplanationLanguage,
                  name: 'English (Standard)',
                  desc: 'Clear, concise English with technical precision, analogies, and line-by-line breakdowns.',
                  sample: '"Let\'s break down recursion: the base case stops infinite loops, while the recursive step reduces the problem."',
                },
                {
                  id: 'hinglish' as ExplanationLanguage,
                  name: 'Hinglish (Conversational)',
                  desc: 'Bilingual mix of Hindi & English. Feels like learning from a smart college senior or coding buddy.',
                  sample: '"Dekho, recursion mein base condition sabse zaroori hai, warna stack overflow ho jayega!"',
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setExplanationLang(opt.id)}
                  className={`flex cursor-pointer flex-col rounded-xl p-4 border transition-all ${
                    explanationLang === opt.id
                      ? 'bg-accent-purple/15 border-accent-purple text-white shadow-glow-brand/30'
                      : 'bg-surface-hover/50 border-surface-border text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{opt.name}</span>
                    {explanationLang === opt.id && (
                      <Check className="h-4 w-4 text-accent-purple" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{opt.desc}</p>
                  <div className="mt-2 rounded bg-background-darker/60 p-2 font-mono text-[11px] text-brand-300 border border-surface-border/50">
                    {opt.sample}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="w-1/3 rounded-xl bg-surface-hover py-3 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isSaving}
                className="w-2/3 flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan py-3 text-xs font-bold text-white shadow-glow-brand hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isSaving ? 'Personalizing Mentor...' : 'Launch Learning Space'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
