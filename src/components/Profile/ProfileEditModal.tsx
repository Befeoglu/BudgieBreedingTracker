import React, { useState, useEffect } from 'react';
import { X, Save, User, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useTranslation } from '../../hooks/useTranslation';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  avatar_url: string;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && user) {
      loadUserProfile();
    }
  }, [isOpen, user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        // Parse full_name into first_name and last_name
        const nameParts = (data.full_name || '').split(' ');
        setFormData({
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('profile.firstNameRequired');
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t('profile.lastNameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Combine first_name and last_name into full_name
      const full_name = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();

      const { error } = await supabase
        .from('users')
        .update({
          full_name: full_name,
          avatar_url: formData.avatar_url || null
        })
        .eq('id', user.id);

      if (error) throw error;

      showToast(t('profile.profileUpdated'), 'success');
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast(error.message || t('profile.profileUpdateError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 animate-slide-up ${bgColor}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-800">{t('profile.profileInfo')}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-primary-100 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt={t('profile.avatar')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-600" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors shadow-lg"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-sm text-neutral-600 mt-2">{t('profile.changePhoto')}</p>
            </div>

            {/* Ad ve Soyad - Yan Yana */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  {t('profile.firstName')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                      errors.first_name ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                    }`}
                    placeholder={t('profile.enterFirstName')}
                  />
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-red-600 animate-shake">{errors.first_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  {t('profile.lastName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                    errors.last_name ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                  }`}
                  placeholder={t('profile.enterLastName')}
                />
                {errors.last_name && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.last_name}</p>
                )}
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {t('common.save')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};