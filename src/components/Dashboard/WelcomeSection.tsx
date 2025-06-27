import React from 'react';
import { Bird } from 'lucide-react';

interface WelcomeSectionProps {
  userName: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white mb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {getGreeting()}, {userName}!
          </h2>
          <p className="text-primary-100 text-lg">
            Kuluçka takibinize hoş geldiniz
          </p>
        </div>
        <div className="animate-bounce-gentle">
          <Bird className="w-12 h-12 text-primary-100" />
        </div>
      </div>
    </div>
  );
};
