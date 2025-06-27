import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, Egg } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Incubation {
  id: string;
  user_id: string;
  nest_name: string;
  start_date: string;
  expected_hatch_date: string;
  egg_count?: number;
  success_rate?: number;
  status: 'active' | 'completed' | 'failed';
  notes?: string;
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
  const [formData, setFormData] = useState({
    nest_name: '',
    start_date: '',
    expected_hatch_date: '',
    egg_count: 0,
    notes: '',
    status: 'active' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (incubation && isEditing) {
      setFormData({
        nest_name: incubation.nest_name || '',
        start_date: incubation.start_date || '',
        expected_hatch_date: incubation.expected_hatch_date || '',
        egg_count: incubation.egg_count || 0,
        notes: incubation.notes || '',
        status: incubation.status || 'active'
      });
    }
  }, [incubation, isEditing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nest_name.trim()) {
      newErrors.nest_name = 'Kuluçka adı zorunludur';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Başlangıç tarihi zorunludur';
    }

    if (!formData.expected_hatch_date) {
      newErrors.expected_hatch_date = 'Tahmini çıkım tarihi zorunludur';
    }

    if (formData.start_date && formData.expected_hatch_date) {
      const startDate = new Date(formData.start_date);
      const expectedDate = new Date(formData.expected_hatch_date);
      
      if (expectedDate <= startDate) {
        newErrors.expected_hatch_date = 'Çıkım tarihi başlangıç tarihinden sonra olmalıdır';
      }
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
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

      const clutchData = {
        nest_name: formData.nest_name,
        start_date: formData.start_date,
        expected_hatch_date: formData.expected_hatch_date,
        user_id: user.id
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

      // Transform back to incubation format
      const savedIncubation = {
        ...result.data,
        egg_count: formData.egg_count,
        success_rate: 85, // Mock data
        status: formData.status,
        notes: formData.notes
      };

      onSave(savedIncubation);
      
      const message = isEditing ? 'Kuluçka bilgileri güncellendi!' : 'Yeni kuluçka eklendi!';
      showToast(message, 'success');

    } catch (error: any) {
      console.error('Error saving incubation:', error);
      showToast(error.message || 'Bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!incubation || !onDelete) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('clutches')
        .delete()
        .eq('id', incubation.id);

      if (error) throw error;

      onDelete(incubation.id);
      showToast('Kuluçka silindi', 'success');
      setShowDeleteConfirm(false);

    } catch (error: any) {
      console.error('Error deleting incubation:', error);
      showToast(error.message || 'Silme işlemi başarısız', 'error');
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">
              {isEditing ? 'Kuluçka Bilgilerini Düzenle' : 'Yeni Kuluçka Ekle'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Kuluçka Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nest_name}
                  onChange={(e) => handleInputChange('nest_name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                    errors.nest_name ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                  }`}
                  placeholder="Örn: Luna & Apollo - 1. Kuluçka"
                />
                {errors.nest_name && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.nest_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Başlangıç Tarihi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                      errors.start_date ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                    }`}
                  />
                </div>
                {errors.start_date && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.start_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Tahmini Çıkım Tarihi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="date"
                    value={formData.expected_hatch_date}
                    onChange={(e) => handleInputChange('expected_hatch_date', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                      errors.expected_hatch_date ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                    }`}
                  />
                </div>
                {errors.expected_hatch_date && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.expected_hatch_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Yumurta Sayısı
                </label>
                <div className="relative">
                  <Egg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="number"
                    min="0"
                    value={formData.egg_count}
                    onChange={(e) => handleInputChange('egg_count', parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Durum
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300"
                >
                  <option value="active">Aktif</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="failed">Başarısız</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 resize-none"
                placeholder="Kuluçka ile ilgili notlar, gözlemler..."
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
                    {isEditing ? 'Güncelle' : 'Kaydet'}
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
                  Sil
                </button>
              )}

              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-4 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 focus:ring-4 focus:ring-neutral-200 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">Kuluçkayı Sil</h3>
              <p className="text-neutral-600 mb-6">
                <strong>{formData.nest_name}</strong> adlı kuluçkayı silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Evet, Sil'
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