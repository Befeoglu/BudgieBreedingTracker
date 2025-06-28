import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, Settings, LogOut, Edit3, ChevronDown } from 'lucide-react';
import { signOut } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  user: any;
  title: string;
  onProfileEdit?: () => void;
  onSettingsClick?: () => void;
}

interface UserProfile {
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export const Header: React.FC<HeaderProps> = ({ user, title, onProfileEdit, onSettingsClick }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (data) {
        const nameParts = (data.full_name || '').split(' ');
        setUserProfile({
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          full_name: data.full_name || ''
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
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

  const getDisplayName = () => {
    if (loading) return 'User';
    
    const { first_name, last_name, full_name } = userProfile;
    
    if (full_name && full_name.trim()) {
      return full_name.trim();
    }
    
    if (first_name || last_name) {
      return `${first_name || ''} ${last_name || ''}`.trim();
    }
    
    return user?.email?.split('@')[0] || 'User';
  };

  const getShortName = () => {
    if (loading) return 'U';
    
    const { first_name, last_name, full_name } = userProfile;
    
    if (full_name && full_name.trim()) {
      const nameParts = full_name.trim().split(' ');
      return nameParts.map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2);
    }
    
    if (first_name || last_name) {
      const firstInitial = first_name ? first_name.charAt(0).toUpperCase() : '';
      const lastInitial = last_name ? last_name.charAt(0).toUpperCase() : '';
      return (firstInitial + lastInitial) || 'U';
    }
    
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <header className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400 truncate">
                BudgieBreedingTracker
              </h1>
            </div>
            <div className="ml-3 sm:ml-6 min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-medium text-neutral-800 dark:text-neutral-200 truncate">
                {title}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Notifications */}
            <button className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Settings */}
            <button 
              onClick={onSettingsClick}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Profile Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400">
                    {getShortName()}
                  </span>
                </div>
                <span className="hidden sm:block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate max-w-[100px]">
                  {getDisplayName()}
                </span>
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 dark:text-neutral-400 transition-transform ${
                  showProfileMenu ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50 animate-slide-up">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {getShortName()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{getDisplayName()}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleEditProfile}
                      className="w-full flex items-center px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 mr-3 text-neutral-500 dark:text-neutral-400" />
                      Edit Profile
                    </button>

                    <button
                      onClick={handleSettingsClick}
                      className="w-full flex items-center px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3 text-neutral-500 dark:text-neutral-400" />
                      Settings
                    </button>

                    <div className="border-t border-neutral-100 dark:border-neutral-700 my-1"></div>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-red-500 dark:text-red-400" />
                      Sign Out
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