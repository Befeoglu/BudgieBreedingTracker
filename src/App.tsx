import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTranslation } from './hooks/useTranslation';
import { AuthForm } from './components/Auth/AuthForm';
import { Header } from './components/Layout/Header';
import { BottomNav } from './components/Layout/BottomNav';
import { WelcomeSection } from './components/Dashboard/WelcomeSection';
import { ActiveIncubations } from './components/Dashboard/ActiveIncubations';
import { TodoList } from './components/Dashboard/TodoList';
import { QuickStats } from './components/Dashboard/QuickStats';
import { BirdGrid } from './components/Birds/BirdGrid';
import { CalendarView } from './components/Calendar/CalendarView';
import { StatsOverview } from './components/Stats/StatsOverview';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { ChicksView } from './components/Chicks/ChicksView';
import { PedigreeView } from './components/Pedigree/PedigreeView';
import { ProfileEditModal } from './components/Profile/ProfileEditModal';

function App() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    applyTheme(shouldUseDark);
  }, []);

  const applyTheme = (isDark: boolean) => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#1f2937';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f5f5f4';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in">
            <WelcomeSection user={user} />
            <QuickStats />
            <ActiveIncubations />
            <TodoList />
          </div>
        );
      case 'stats':
        return (
          <div className="animate-slide-up">
            <StatsOverview />
          </div>
        );
      case 'birds':
        return (
          <div className="animate-slide-up">
            <BirdGrid />
          </div>
        );
      case 'chicks':
        return (
          <div className="animate-slide-up">
            <ChicksView />
          </div>
        );
      case 'pedigree':
        return (
          <div className="animate-slide-up">
            <PedigreeView />
          </div>
        );
      case 'calendar':
        return (
          <div className="animate-slide-up">
            <CalendarView />
          </div>
        );
      case 'settings':
        return (
          <div className="animate-slide-up">
            <SettingsPanel />
          </div>
        );
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return t('navigation.dashboard');
      case 'stats':
        return t('navigation.statistics');
      case 'birds':
        return t('navigation.myBirds');
      case 'chicks':
        return t('navigation.chicks');
      case 'pedigree':
        return t('navigation.pedigree');
      case 'calendar':
        return t('navigation.calendar');
      case 'settings':
        return t('navigation.settings');
      default:
        return 'BudgieBreedingTracker';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300">
      <Header 
        user={user} 
        title={getPageTitle()} 
        onProfileEdit={() => setShowProfileModal(true)}
        onSettingsClick={() => setActiveTab('settings')}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {renderContent()}
      </main>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />
    </div>
  );
}

export default App;