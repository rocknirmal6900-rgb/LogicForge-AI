import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { TopNav } from './TopNav';
import { AuthModal } from '../auth/AuthModal';
import { OnboardingModal } from '../auth/OnboardingModal';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

// Pages
import { Dashboard } from '../../pages/Dashboard';
import { AITutor } from '../../pages/AITutor';
import { LearnConcepts } from '../../pages/LearnConcepts';
import { PracticeProblems } from '../../pages/PracticeProblems';
import { CodePlayground } from '../../pages/CodePlayground';
import { ProgressAnalytics } from '../../pages/ProgressAnalytics';
import { Bookmarks } from '../../pages/Bookmarks';
import { Settings } from '../../pages/Settings';

export const AppShell: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [streakCount, setStreakCount] = useState<number>(0);

  // Selected problem or lesson to load in playground/concepts
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);

  useEffect(() => {
    // If user has no preferences yet, prompt onboarding
    if (isAuthenticated && user && !user.preferences) {
      setIsOnboardingModalOpen(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Fetch streak and progress summary
    if (isAuthenticated) {
      apiClient.get('/progress/summary')
        .then(res => setStreakCount(res.data.streak_days || 0))
        .catch(() => setStreakCount(0));
    }
  }, [isAuthenticated, activeTab]);

  const handleOpenPlaygroundWithProblem = (problemId: number) => {
    setSelectedProblemId(problemId);
    setActiveTab('playground');
  };

  const handleAskTutorWithCode = (code: string) => {
    setActiveTab('tutor');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-slate-100">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        streakCount={streakCount}
      />

      {/* Main App Layout */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-background to-background-darker">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigate={setActiveTab}
                onOpenProblem={handleOpenPlaygroundWithProblem}
                onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
              />
            )}
            {activeTab === 'tutor' && <AITutor />}
            {activeTab === 'concepts' && (
              <LearnConcepts
                onOpenTutor={(msg) => setActiveTab('tutor')}
                onOpenPlayground={() => setActiveTab('playground')}
              />
            )}
            {activeTab === 'practice' && (
              <PracticeProblems onSolveProblem={handleOpenPlaygroundWithProblem} />
            )}
            {activeTab === 'playground' && (
              <CodePlayground
                initialProblemId={selectedProblemId}
                onAskTutor={handleAskTutorWithCode}
              />
            )}
            {activeTab === 'progress' && <ProgressAnalytics onNavigate={setActiveTab} />}
            {activeTab === 'bookmarks' && (
              <Bookmarks
                onNavigateLesson={() => setActiveTab('concepts')}
                onNavigateProblem={handleOpenPlaygroundWithProblem}
              />
            )}
            {activeTab === 'settings' && (
              <Settings onOpenOnboarding={() => setIsOnboardingModalOpen(true)} />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessNeedOnboarding={() => setIsOnboardingModalOpen(true)}
      />
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
    </div>
  );
};
