import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
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

function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const userName = user.email?.split('@')[0] || 'Kullanıcı';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in">
            <WelcomeSection userName={userName} />
            <QuickStats />
            <ActiveIncubations />
            <TodoList />
          </div>
        );
      case 'birds':
        return (
          <div className="animate-slide-up">
            <BirdGrid />
          </div>
        );
      case 'calendar':
        return (
          <div className="animate-slide-up">
            <CalendarView />
          </div>
        );
      case 'stats':
        return (
          <div className="animate-slide-up">
            <StatsOverview />
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
        return 'Pano';
      case 'birds':
        return 'Kuşlarım';
      case 'calendar':
        return 'Takvim';
      case 'stats':
        return 'İstatistikler';
      case 'settings':
        return 'Ayarlar';
      default:
        return 'Kuluçka Takip';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <Header user={user} title={getPageTitle()} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {renderContent()}
      </main>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
