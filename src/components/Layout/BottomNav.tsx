import React from 'react';
import { Home, Bird, Calendar, BarChart3, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Pano', icon: Home },
    { id: 'birds', label: 'Kuşlarım', icon: Bird },
    { id: 'calendar', label: 'Takvim', icon: Calendar },
    { id: 'stats', label: 'İstatistik', icon: BarChart3 },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 pb-safe">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-primary-600' : ''}`} />
                <span className={`text-xs font-medium truncate ${
                  isActive ? 'text-primary-600' : ''
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
