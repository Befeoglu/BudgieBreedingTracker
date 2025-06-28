import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, Users, FileText, Heart, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DatePicker } from '../Common/DatePicker';
import { notificationService } from '../../services/notificationService';
import { useTranslation } from '../../hooks/useTranslation';

interface Bird {
  id: string;
  name: string;
  ring_number: string;
  gender: 'male' | 'female';
  species?: string;
}

interface Incubation {
  id: string;
  user_id: string;
  nest_name: string;
  start_date: string;
  expected_hatch_date: string;
  status: 'active' | 'completed' | 'failed';
  notes?: string;
  female_bird_id?: string;
  male_bird_id?: string;
  created_at: string;
  updated_at: string;
}

interface IncubationFormProps {
  incubation?: Incubation | null;
  onSave: (incubation: Incubation) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
}

export const IncubationForm: React.FC<IncubationFormProps> = ({
  incubation,
  onSave,
  onCancel,
  onDelete,
  isEditing = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nest_name: '',
    female_bird_id: '',
    male_bird_id: '',
    start_date: new Date().toISOString().split('T')[0], // Varsayılan: bugün
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [maleBirds, setMaleBirds] = useState<Bird[]>([]);
  const [femaleBirds, setFemaleBirds] = useState<Bird[]>([]);
  const [loadingBirds, setLoadingBirds] = useState(true);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadBirds();
    
    if (incubation && isEditing) {
      setFormData({
        nest_name: incubation.nest_name || '',
        female_bird_id: incubation.female_bird_id || '',
        male_bird_id: incubation.male_bird_id || '',
        start_date: incubation.start_date || '',
        notes: incubation.notes || ''
      });
    }
  }, [incubation, isEditing]);

  // Form değişikliklerini takip et
  useEffect(() => {
    if (!isEditing) {
      const hasChanges = formData.nest_name.trim() !== '' || 
                        formData.female_bird_id !== '' || 
                        formData.male_bird_id !== '' ||
                        formData.start_date !== new Date().toISOString().split('T')[0] ||
                        formData.notes.trim() !== '';
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, isEditing]);

  const loadBirds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: birds, error } = await supabase
        .from('birds')
        .select('id, name, ring_number, gender, species')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // Erkek ve dişi kuşları ayır
      const males = (birds || []).filter(bird => bird.gender === 'male');
      const females = (birds || []).filter(bird => bird.gender === 'female');

      setMaleBirds(males);
      setFemaleBirds(females);
    } catch (error) {
      console.error('Error loading birds:', error);
      showToast('Kuşlar yüklenirken hata oluştu', 'error');
    } finally {
      setLoadingBirds(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nest_name.trim()) {
      newErrors.nest_name = t('incubation.nestNameRequired');
    }

    if (!formData.female_bird_id) {
      newErrors.female_bird_id = 'Lütfen bir dişi kuş seçin';
    }

    if (!formData.male_bird_id) {
      newErrors.male_bird_id = 'Lütfen bir erkek kuş seçin';
    }

    if (!formData.start_date) {
      newErrors.start_date = t('incubation.startDateRequired');
    }

    // Başlangıç tarihi kontrolü
    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate > today) {
        newErrors.start_date = 'Başlangıç tarihi bugünden ileri olamaz';
      }
      
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (startDate < oneYearAgo) {
        newErrors.start_date = 'Başlangıç tarihi çok eski';
      }
    }

    // Aynı kuş kontrol
    if (formData.female_bird_id && formData.male_bird_id && formData.female_bird_id === formData.male_bird_id) {
      newErrors.male_bird_id = 'Erkek ve dişi kuş aynı olamaz';
      newErrors.female_bird_id = 'Erkek ve dişi kuş aynı olamaz';
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

  const calculateExpectedHatchDate = (startDate: string): string => {
    const start = new Date(startDate);
    const expectedDate = new Date(start);
    expectedDate.setDate(start.getDate() + 18); // 18 gün sonra tahmini çıkım
    return expectedDate.toISOString().split('T')[0];
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

      const expectedHatchDate = calculateExpectedHatchDate(formData.start_date);

      const clutchData = {
        nest_name: formData.nest_name.trim(),
        start_date: formData.start_date,
        expected_hatch_date: expectedHatchDate,
        notes: formData.notes.trim() || null,
        user_id: user.id,
        status: 'active' as const
      };

      let result;
      if (isEditing && incubation) {
        result = await supabase
          .from('clutches')
          .update(clutchData)
          .eq('id', incubation.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('clutches')
          .insert(clutchData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Bildirim zamanlaması (sadece yeni kuluçka için)
      if (!isEditing) {
        try {
          await notificationService.scheduleHatchReminders(
            result.data.id,
            formData.start_date,
            expectedHatchDate
          );
        } catch (notificationError) {
          console.error('Error scheduling notifications:', notificationError);
          // Bildirim hatası ana işlemi etkilemez
        }
      }

      // Transform data for consistency
      const transformedData = {
        ...result.data,
        female_bird_id: formData.female_bird_id,
        male_bird_id: formData.male_bird_id,
        female_bird: femaleBirds.find(b => b.id === formData.female_bird_id),
        male_bird: maleBirds.find(b => b.id === formData.male_bird_id)
      };

      onSave(transformedData);
      setHasUnsavedChanges(false);
      
      const message = isEditing ? t('incubation.incubationUpdated') : 'Yeni kuluçka başarıyla eklendi!';
      showToast(message, 'success');

    } catch (error: any) {
      console.error('Error saving incubation:', error);
      showToast(error.message || t('errors.general'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!incubation || !onDelete) return;

    // Make sure we have a valid ID before attempting delete
    if (!incubation.id) {
      console.error('Cannot delete incubation with undefined ID');
      showToast('Silme işlemi başarısız: Geçersiz ID', 'error');
      return;
    }

    setLoading(true);

    try {
      // Just call the parent's onDelete handler instead of making direct Supabase call
      onDelete(incubation.id);
      showToast(t('incubation.incubationDeleted'), 'success');
      setShowDeleteConfirm(false);

    } catch (error: any) {
      console.error('Error deleting incubation:', error);
      showToast(error.message || t('errors.general'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges && !isEditing) {
      setShowUnsavedChangesModal(true);
    } else {
      onCancel();
    }
  };

  const confirmCancel = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedChangesModal(false);
    onCancel();
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const toast = document.createElement('div');
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }[type];
    
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 animate-slide-up ${bgColor}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const selectedFemale = femaleBirds.find(bird => bird.id === formData.female_bird_id);
  const selectedMale = maleBirds.find(bird => bird.id === formData.male_bird_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              {isEditing ? 'Kuluçka Düzenle' : 'Yeni Kuluçka Ekle'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kuluçka Adı */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                {t('incubation.nestName')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <input
                  type="text"
                  value={formData.nest_name}
                  onChange={(e) => handleInputChange('nest_name', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 ${
                    errors.nest_name ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900/50 focus:border-red-400 dark:focus:border-red-600' : 'border-neutral-200 dark:border-neutral-600'
                  }`}
                  placeholder={t('incubation.nestNamePlaceholder')}
                  maxLength={100}
                />
              </div>
              {errors.nest_name && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.nest_name}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Örn: "Mart 2024 Çifti", "Luna & Apollo - 1. Kuluçka"
              </p>
            </div>

            {/* Kuş Seçimleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dişi Kuş Seçimi */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Dişi Kuş Seçimi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-500 z-10" />
                  <select
                    value={formData.female_bird_id}
                    onChange={(e) => handleInputChange('female_bird_id', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 appearance-none ${
                      errors.female_bird_id ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900/50 focus:border-red-400 dark:focus:border-red-600' : 'border-neutral-200 dark:border-neutral-600'
                    }`}
                    disabled={loadingBirds}
                  >
                    <option value="">
                      {loadingBirds ? 'Dişi kuşlar yükleniyor...' : 'Bir dişi kuş seçin'}
                    </option>
                    {femaleBirds.map((bird) => (
                      <option key={bird.id} value={bird.id}>
                        {bird.name} ({bird.ring_number})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.female_bird_id && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.female_bird_id}</p>
                )}
                
                {/* Seçilen dişi kuş detayları */}
                {selectedFemale && (
                  <div className="mt-3 p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-pink-700 dark:text-pink-300 flex items-center gap-2">
                        ♀ {selectedFemale.name}
                      </p>
                      <p className="text-neutral-700 dark:text-neutral-300">{selectedFemale.ring_number}</p>
                      {selectedFemale.species && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{selectedFemale.species}</p>
                      )}
                    </div>
                  </div>
                )}

                {femaleBirds.length === 0 && !loadingBirds && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ Henüz dişi kuş yok. Önce dişi kuş eklemelisiniz.
                    </p>
                  </div>
                )}
              </div>

              {/* Erkek Kuş Seçimi */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Erkek Kuş Seçimi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 z-10" />
                  <select
                    value={formData.male_bird_id}
                    onChange={(e) => handleInputChange('male_bird_id', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 appearance-none ${
                      errors.male_bird_id ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900/50 focus:border-red-400 dark:focus:border-red-600' : 'border-neutral-200 dark:border-neutral-600'
                    }`}
                    disabled={loadingBirds}
                  >
                    <option value="">
                      {loadingBirds ? 'Erkek kuşlar yükleniyor...' : 'Bir erkek kuş seçin'}
                    </option>
                    {maleBirds.map((bird) => (
                      <option key={bird.id} value={bird.id}>
                        {bird.name} ({bird.ring_number})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.male_bird_id && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.male_bird_id}</p>
                )}
                
                {/* Seçilen erkek kuş detayları */}
                {selectedMale && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        ♂ {selectedMale.name}
                      </p>
                      <p className="text-neutral-700 dark:text-neutral-300">{selectedMale.ring_number}</p>
                      {selectedMale.species && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{selectedMale.species}</p>
                      )}
                    </div>
                  </div>
                )}

                {maleBirds.length === 0 && !loadingBirds && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ Henüz erkek kuş yok. Önce erkek kuş eklemelisiniz.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Çift Önizlemesi */}
            {selectedFemale && selectedMale && (
              <div className="p-4 bg-gradient-to-r from-pink-50 to-blue-50 dark:from-pink-900/20 dark:to-blue-900/20 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-2">
                      <span className="text-pink-600 dark:text-pink-400 font-bold">♀</span>
                    </div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{selectedFemale.name}</p>
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-6 h-6 text-red-500 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">♂</span>
                    </div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{selectedMale.name}</p>
                  </div>
                </div>
                <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-3">
                  🥚 Seçilen çift: {selectedFemale.name} & {selectedMale.name}
                </p>
              </div>
            )}

            {/* Başlangıç Tarihi */}
            <div>
              <DatePicker
                label={`${t('incubation.startDate')} *`}
                value={formData.start_date}
                onChange={(date) => handleInputChange('start_date', date)}
                required
                error={errors.start_date}
                maxDate={new Date().toISOString().split('T')[0]}
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                📅 Tahmini çıkım tarihi otomatik hesaplanacak (+18 gün)
              </p>
            </div>

            {/* Notlar */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                {t('incubation.notes')}
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 resize-none bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                  placeholder="Kuluçka ile ilgili özel notlarınız, gözlemleriniz..."
                  maxLength={500}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Opsiyonel - çevre şartları, özel durumlar vb.
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formData.notes.length}/500
                </p>
              </div>
            </div>

            {/* Bildirim Bilgisi */}
            {!isEditing && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Otomatik Hatırlatmalar</p>
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p>• 16. gün: "Yaklaşan yumurta çatlama" bildirimi</p>
                  <p>• 18. gün: "Çatlama zamanı" bildirimi</p>
                </div>
              </div>
            )}

            {/* Butonlar */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || loadingBirds || femaleBirds.length === 0 || maleBirds.length === 0}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEditing ? 'Değişiklikleri Kaydet' : 'Kuluçkayı Başlat'}
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
                onClick={handleCancel}
                className="px-6 py-4 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold hover:bg-neutral-200 dark:hover:bg-neutral-600 focus:ring-4 focus:ring-neutral-200 dark:focus:ring-neutral-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Kaydedilmemiş Değişiklikler Modalı */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full animate-slide-up transition-colors duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">Kaydedilmemiş Değişiklikler</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Yaptığınız değişiklikler kaybolacak. Çıkmak istediğinizden emin misiniz?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnsavedChangesModal(false)}
                  className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  Geri Dön
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  Çık
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full animate-slide-up transition-colors duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">{t('incubation.deleteIncubation')}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                <strong>{formData.nest_name}</strong> kuluçkasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

export { IncubationForm }