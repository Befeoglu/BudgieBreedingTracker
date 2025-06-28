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
import { IncubationView } from './components/Incubation/IncubationView';
import { ChicksView } from './components/Chicks/ChicksView';
import { PedigreeView } from './components/Pedigree/PedigreeView';
import { ProfileEditModal } from './components/Profile/ProfileEditModal';

function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);

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
      case 'incubation':
        return (
          <div className="animate-slide-up">
            <IncubationView />
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
        return 'AnaSayfa';
      case 'stats':
        return 'İstatistikler';
      case 'birds':
        return 'Kuşlarım';
      case 'incubation':
        return 'Kuluçka Takibi';
      case 'chicks':
        return 'Yavrular';
      case 'pedigree':
        return 'Soy Ağacı';
      case 'calendar':
        return 'Takvim';
      case 'settings':
        return 'Ayarlar';
      default:
        return 'Kuluçka Takip';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
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

      {/* Profil Düzenleme Modalı */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />
    </div>
  );
}

export default App;