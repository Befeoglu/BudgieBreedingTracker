import React from 'react';
import { Home, BarChart3, Bird, Egg, Baby, GitBranch } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'AnaSayfa', icon: Home },
    { id: 'stats', label: 'İstatistik', icon: BarChart3 },
    { id: 'birds', label: 'Kuşlarım', icon: Bird },
    { id: 'incubation', label: 'Kuluçka', icon: Egg },
    { id: 'chicks', label: 'Yavrular', icon: Baby },
    { id: 'pedigree', label: 'SoyAğacı', icon: GitBranch },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 pb-safe">
      <div className="max-w-7xl mx-auto px-1 sm:px-2">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2 sm:py-3 px-1 min-w-0 flex-1 transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 flex-shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
                <span className={`text-xs font-medium truncate max-w-full leading-tight ${
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