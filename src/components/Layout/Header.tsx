import React from 'react';
import { User, Bell, Settings, LogOut } from 'lucide-react';
import { signOut } from '../../lib/supabase';

interface HeaderProps {
  user: any;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ user, title }) => {
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary-600 truncate">
                Kuluçka Takip
              </h1>
            </div>
            <div className="ml-3 sm:ml-6 min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-medium text-neutral-800 truncate">
                {title}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <button className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-neutral-700 truncate max-w-[80px] sm:max-w-none">
                {user?.email?.split('@')[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <LogOut className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};