import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Scale, Baby } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DatePicker } from '../Common/DatePicker';
import { useTranslation } from '../../hooks/useTranslation';

interface Chick {
  id: string;
  user_id: string;
  egg_id?: string;
  name?: string;
  hatch_date: string;
  weight?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ChickFormProps {
  chick?: Chick | null;
  onSave: (chick: Chick) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
}

export const ChickForm: React.FC<ChickFormProps> = ({
  chick,
  onSave,
  onCancel,
  onDelete,
  isEditing = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    hatch_date: '',
    weight: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (chick && isEditing) {
      setFormData({
        name: chick.name || '',
        hatch_date: chick.hatch_date || '',
        weight: chick.weight ? chick.weight.toString() : '',
        notes: chick.notes || ''
      });
    }
  }, [chick, isEditing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hatch_date) {
      newErrors.hatch_date = t('chicks.hatchDateRequired');
    }

    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) < 0)) {
      newErrors.weight = t('chicks.validWeightRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.authError'));

      const chickData = {
        name: formData.name || null,
        hatch_date: formData.hatch_date,
        weight: formData.weight ? Number(formData.weight) : null,
        notes: formData.notes || null,
        user_id: user.id
      };

      let result;
      if (isEditing && chick) {
        result = await supabase
          .from('chicks')
          .update(chickData)
          .eq('id', chick.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('chicks')
          .insert(chickData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onSave(result.data);
      
      const message = isEditing ? t('chicks.chickUpdated') : t('chicks.chickAdded');
      showToast(message, 'success');

    } catch (error: any) {
      console.error('Error saving chick:', error);
      showToast(error.message || t('errors.general'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!chick || !onDelete) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('chicks')
        .delete()
        .eq('id', chick.id);

      if (error) throw error;

      onDelete(chick.id);
      showToast(t('chicks.chickDeleted'), 'success');
      setShowDeleteConfirm(false);

    } catch (error: any) {
      console.error('Error deleting chick:', error);
      showToast(error.message || t('errors.general'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 animate-slide-up ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
              {isEditing ? t('chicks.editChickInfo') : t('chicks.newChick')}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Baby className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                {t('chicks.chickName')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                placeholder={t('chicks.chickNamePlaceholder')}
              />
            </div>

            <div>
              <DatePicker
                label={t('chicks.hatchDate')}
                value={formData.hatch_date}
                onChange={(date) => handleInputChange('hatch_date', date)}
                required
                error={errors.hatch_date}
                maxDate={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                {t('chicks.weight')}
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 ${
                    errors.weight ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900/50 focus:border-red-400 dark:focus:border-red-600' : 'border-neutral-200 dark:border-neutral-600'
                  }`}
                  placeholder={t('chicks.weightPlaceholder')}
                />
              </div>
              {errors.weight && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.weight}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                {t('chicks.notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 resize-none bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                placeholder={t('chicks.notesPlaceholder')}
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEditing ? t('common.save') : t('common.save')}
                  </>
                )}
              </button>

              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 focus:ring-4 focus:ring-red-200 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  {t('common.delete')}
                </button>
              )}

              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-4 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold hover:bg-neutral-200 dark:hover:bg-neutral-600 focus:ring-4 focus:ring-neutral-200 dark:focus:ring-neutral-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full animate-slide-up transition-colors duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">{t('chicks.deleteChick')}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                {t('chicks.confirmDeleteChick')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    t('common.yes')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};