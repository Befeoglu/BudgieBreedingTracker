import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, Settings, LogOut, Edit3, ChevronDown } from 'lucide-react';
import { signOut } from '../../lib/supabase';

interface HeaderProps {
  user: any;
  title: string;
  onProfileEdit?: () => void;
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, title, onProfileEdit, onSettingsClick }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    setShowProfileMenu(false);
  };

  const handleEditProfile = () => {
    if (onProfileEdit) {
      onProfileEdit();
    }
    setShowProfileMenu(false);
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    }
    setShowProfileMenu(false);
  };

  // Menü dışına tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const userName = user?.email?.split('@')[0] || 'Kullanıcı';

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary-600 truncate">
                BudgieBreedingTracker
              </h1>
            </div>
            <div className="ml-3 sm:ml-6 min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-medium text-neutral-800 truncate">
                {title}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Bildirimler */}
            <button className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Ayarlar */}
            <button 
              onClick={handleSettingsClick}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Profil Menüsü */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600" />
                </div>
                <span className="hidden sm:block text-xs sm:text-sm font-medium text-neutral-700 truncate max-w-[100px]">
                  {userName}
                </span>
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 transition-transform ${
                  showProfileMenu ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Dropdown Menü */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 animate-slide-up">
                  {/* Kullanıcı Bilgileri */}
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-800 truncate">{userName}</p>
                        <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menü Öğeleri */}
                  <div className="py-1">
                    <button
                      onClick={handleEditProfile}
                      className="w-full flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 mr-3 text-neutral-500" />
                      Profil Düzenle
                    </button>

                    <button
                      onClick={handleSettingsClick}
                      className="w-full flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3 text-neutral-500" />
                      Ayarlar
                    </button>

                    <div className="border-t border-neutral-100 my-1"></div>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-red-500" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};