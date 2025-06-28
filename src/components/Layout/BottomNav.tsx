import React from 'react';
import { Home, BarChart3, Bird, Baby, GitBranch } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: Home },
    { id: 'stats', label: t('navigation.statistics'), icon: BarChart3 },
    { id: 'birds', label: t('navigation.myBirds'), icon: Bird },
    { id: 'chicks', label: t('navigation.chicks'), icon: Baby },
    { id: 'pedigree', label: t('navigation.pedigree'), icon: GitBranch },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 pb-safe transition-colors duration-300">
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
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                <span className={`text-xs font-medium truncate max-w-full leading-tight ${
                  isActive ? 'text-primary-600 dark:text-primary-400' : ''
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