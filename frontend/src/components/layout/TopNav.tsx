import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Sparkles,
  BookMarked,
  SlidersHorizontal,
  Code,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Language } from '../../types';

interface TopNavProps {
  onOpenAuth: () => void;
  onOpenOnboarding: () => void;
  onSearchSelect?: (query: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenAuth,
  onOpenOnboarding,
}) => {
  const { user, isAuthenticated, logout, updatePreferences } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentLang = user?.preferences?.preferred_language || 'python';
  const currentLevel = user?.preferences?.experience_level || 'beginner';
  const explanationLang = user?.preferences?.explanation_language || 'english';

  const handleLanguageChange = (lang: Language) => {
    if (user?.preferences) {
      updatePreferences({
        ...user.preferences,
        preferred_language: lang,
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-surface-border bg-background-darker/80 px-6 backdrop-blur-xl">
      {/* Left: Active Course / Track Session Indicator */}
      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2 rounded-xl bg-surface-card px-3 py-1.5 border border-surface-border text-xs">
          <div className="h-2 w-2 rounded-full bg-accent-emerald animate-ping" />
          <span className="text-slate-400">Current Track:</span>
          <select
            value={currentLang}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="bg-transparent font-semibold text-brand-300 focus:outline-none cursor-pointer capitalize"
          >
            <option value="python" className="bg-slate-900 text-slate-200">Python 3 (DSA & Basics)</option>
            <option value="cpp" className="bg-slate-900 text-slate-200">C++ (Pointers & STL)</option>
            <option value="java" className="bg-slate-900 text-slate-200">Java (OOP & Collections)</option>
          </select>
          <span className="text-slate-600">|</span>
          <span className="capitalize text-slate-300 font-medium">{currentLevel}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider text-accent-cyan">
            {explanationLang}
          </span>
        </div>
      </div>

      {/* Center: Quick Search Bar */}
      <div className="relative max-w-md w-full mx-4 hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search concepts, DSA topics, syntax, or ask AI... (Ctrl+K)"
          className="w-full rounded-xl bg-surface-card pl-9 pr-16 py-2 text-xs text-slate-200 placeholder-slate-400 border border-surface-border focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          <kbd className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Theme Toggle, Notifications, Auth/Profile */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-slate-400 hover:bg-surface-hover hover:text-white transition-colors border border-transparent hover:border-surface-border"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-400" />
          )}
        </button>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl p-2 text-slate-400 hover:bg-surface-hover hover:text-white transition-colors border border-transparent hover:border-surface-border"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-surface-card p-4 shadow-xl border border-surface-border z-50">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <span className="text-xs font-semibold text-white">Mentor Notifications</span>
                <span className="text-[10px] text-brand-400 cursor-pointer">Mark all read</span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="rounded-xl bg-surface-hover/60 p-2.5 border border-surface-border/50">
                  <div className="flex items-center gap-1.5 text-accent-cyan font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    Adaptive Challenge Ready
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Based on your recursion attempts, your tutor generated a custom practice problem.
                  </p>
                </div>
                <div className="rounded-xl bg-surface-hover/60 p-2.5 border border-surface-border/50">
                  <div className="flex items-center gap-1.5 text-accent-emerald font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Daily Streak Safe
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Keep up the momentum today to level up your mastery score!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Profile Dropdown */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 rounded-xl bg-surface-card py-1.5 px-3 border border-surface-border hover:border-brand-500/50 transition-all"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-accent-cyan text-white text-xs font-bold">
                {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {user.full_name || user.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {user.preferences?.experience_level || 'Student'}
                </span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-card p-2 shadow-2xl border border-surface-border z-50">
                <div className="px-3 py-2 border-b border-surface-border/60">
                  <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>
                <div className="mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenOnboarding();
                    }}
                    className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-surface-hover hover:text-white transition-colors"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-brand-400" />
                    <span>Learning Preferences</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow-brand hover:bg-brand-500 transition-all"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Sign In / Join</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
