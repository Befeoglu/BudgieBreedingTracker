import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, Scale, Baby } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
      newErrors.hatch_date = 'Çıkım tarihi zorunludur';
    }

    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) < 0)) {
      newErrors.weight = 'Geçerli bir ağırlık girin';
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
      
      const message = isEditing ? 'Yavru bilgileri güncellendi!' : 'Yeni yavru eklendi!';
      showToast(message, 'success');

    } catch (error: any) {
      console.error('Error saving chick:', error);
      showToast(error.message || 'Bir hata oluştu', 'error');
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
      showToast('Yavru silindi', 'success');
      setShowDeleteConfirm(false);

    } catch (error: any) {
      console.error('Error deleting chick:', error);
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
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">
              {isEditing ? 'Yavru Bilgilerini Düzenle' : 'Yeni Yavru Ekle'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Baby className="w-10 h-10 text-yellow-600" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Yavru Adı
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300"
                placeholder="Örn: Yavru 1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Çıkım Tarihi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="date"
                  value={formData.hatch_date}
                  onChange={(e) => handleInputChange('hatch_date', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                    errors.hatch_date ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                  }`}
                />
              </div>
              {errors.hatch_date && (
                <p className="mt-2 text-sm text-red-600 animate-shake">{errors.hatch_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Ağırlık (gram)
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                    errors.weight ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                  }`}
                  placeholder="Örn: 5.2"
                />
              </div>
              {errors.weight && (
                <p className="mt-2 text-sm text-red-600 animate-shake">{errors.weight}</p>
              )}
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
                placeholder="Yavru ile ilgili notlar, gözlemler..."
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
              <h3 className="text-xl font-bold text-neutral-800 mb-2">Yavruyu Sil</h3>
              <p className="text-neutral-600 mb-6">
                Bu yavruyu silmek istediğinizden emin misiniz? 
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