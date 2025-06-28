import React, { useState, useEffect } from 'react';
import { Bird } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface WelcomeSectionProps {
  user: any;
}

interface UserProfile {
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ user }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);

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
        // Parse full_name into first_name and last_name
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const getDisplayName = () => {
    if (loading) return 'Kullanıcı';
    
    const { first_name, last_name, full_name } = userProfile;
    
    // Önce full_name'i kontrol et
    if (full_name && full_name.trim()) {
      return full_name.trim();
    }
    
    // Sonra first_name ve last_name'i birleştir
    if (first_name || last_name) {
      return `${first_name || ''} ${last_name || ''}`.trim();
    }
    
    // Son çare olarak email'den kullanıcı adını al (@ işaretinden önceki kısım)
    return user?.email?.split('@')[0] || 'Kullanıcı';
  };

  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-4 sm:p-6 text-white mb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 pr-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
            {getGreeting()}, {getDisplayName()}!
          </h2>
          <p className="text-primary-100 text-base sm:text-lg leading-relaxed">
            Kuluçka takibinize hoş geldiniz
          </p>
        </div>
        <div className="animate-bounce-gentle flex-shrink-0">
          <Bird className="w-10 h-10 sm:w-12 sm:h-12 text-primary-100" />
        </div>
      </div>
    </div>
  );
};