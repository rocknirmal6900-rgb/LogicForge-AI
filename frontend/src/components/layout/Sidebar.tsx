import React from 'react';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Code2,
  Terminal,
  BarChart3,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'tutor'
  | 'concepts'
  | 'practice'
  | 'playground'
  | 'progress'
  | 'bookmarks'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  streakCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  streakCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tutor' as NavTab, label: 'AI Tutor', icon: Bot, badge: 'Live AI' },
    { id: 'concepts' as NavTab, label: 'Learn Concepts', icon: BookOpen },
    { id: 'practice' as NavTab, label: 'Practice Problems', icon: Code2, badge: 'Adaptive' },
    { id: 'playground' as NavTab, label: 'Code Playground', icon: Terminal },
    { id: 'progress' as NavTab, label: 'My Progress', icon: BarChart3 },
    { id: 'bookmarks' as NavTab, label: 'Bookmarks', icon: Bookmark },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-surface-border bg-background-darker/95 backdrop-blur-md transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-surface-border">
        <div
          className={`flex items-center space-x-3 overflow-hidden cursor-pointer ${
            isCollapsed ? 'justify-center w-full' : ''
          }`}
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan shadow-glow-brand">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                LogicForge
                <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-300 border border-brand-500/30">
                  MENTOR
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                AI Coding Tutor & DSA
              </span>
            </div>
          )}
        </div>

        {/* Collapse button on non-collapsed */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-hover hover:text-white transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand button on collapsed */}
      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-surface-border/50">
          <button
            onClick={() => setIsCollapsed(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-hover hover:text-white transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`group relative flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-500/15 text-white border border-brand-500/30 shadow-glow-brand/50'
                  : 'text-slate-400 hover:bg-surface-hover/70 hover:text-slate-200'
              } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-brand-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    item.badge === 'Live AI'
                      ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                      : 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active glow pip on left */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand-400 shadow-glow-brand" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Streak / Motivation Widget Footer */}
      <div className="p-3 border-t border-surface-border">
        {isCollapsed ? (
          <div
            className="flex flex-col items-center justify-center py-2 text-amber-400 cursor-pointer"
            title={`${streakCount} Day Streak`}
            onClick={() => setActiveTab('progress')}
          >
            <Flame className="h-6 w-6 animate-pulse" />
            <span className="text-[11px] font-bold mt-0.5">{streakCount}d</span>
          </div>
        ) : (
          <div
            onClick={() => setActiveTab('progress')}
            className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3 border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Flame className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">
                  {streakCount > 0 ? `${streakCount} Day Streak!` : 'Start Streak'}
                </span>
                <span className="text-[10px] text-amber-300/80">
                  {streakCount > 0 ? 'Consistency unlocked' : 'Solve a daily question'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400">{streakCount} 🔥</span>
          </div>
        )}
      </div>
    </aside>
  );
};
