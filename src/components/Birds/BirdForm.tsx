import React, { useState, useEffect } from 'react';
import { Camera, Upload, X, Save, Trash2, Star, StarOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Bird } from '../../types';

interface BirdFormProps {
  bird?: Bird | null;
  onSave: (bird: Bird) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
}

export const BirdForm: React.FC<BirdFormProps> = ({
  bird,
  onSave,
  onCancel,
  onDelete,
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    ring_number: '',
    species: 'Muhabbet Kuşu',
    gender: 'male' as 'male' | 'female',
    birth_date: '',
    color_mutation: '',
    notes: '',
    photo_url: '',
    is_favorite: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    if (bird && isEditing) {
      setFormData({
        name: bird.name || '',
        ring_number: bird.ring_number || '',
        species: bird.species || 'Muhabbet Kuşu',
        gender: bird.gender || 'male',
        birth_date: bird.birth_date || '',
        color_mutation: bird.color_mutation || '',
        notes: bird.notes || '',
        photo_url: bird.photo_url || '',
        is_favorite: bird.is_favorite || false
      });
      setPhotoPreview(bird.photo_url || '');
    }
  }, [bird, isEditing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Kuş adı zorunludur';
    }

    if (!formData.ring_number.trim()) {
      newErrors.ring_number = 'Bilezik numarası zorunludur';
    }

    if (!formData.birth_date) {
      newErrors.birth_date = 'Doğum tarihi zorunludur';
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        setFormData(prev => ({ ...prev, photo_url: result }));
      };
      reader.readAsDataURL(file);
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

      const birdData = {
        ...formData,
        user_id: user.id
      };

      let result;
      if (isEditing && bird) {
        result = await supabase
          .from('birds')
          .update(birdData)
          .eq('id', bird.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('birds')
          .insert(birdData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onSave(result.data);
      
      const message = isEditing ? 'Kuş bilgileri güncellendi!' : 'Yeni kuş eklendi!';
      showToast(message, 'success');

    } catch (error: any) {
      console.error('Error saving bird:', error);
      showToast(error.message || 'Bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!bird || !onDelete) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('birds')
        .delete()
        .eq('id', bird.id);

      if (error) throw error;

      onDelete(bird.id);
      showToast('Kuş silindi', 'success');
      setShowDeleteConfirm(false);

    } catch (error: any) {
      console.error('Error deleting bird:', error);
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

  const speciesOptions = [
    'Muhabbet Kuşu',
    'Kanarya',
    'Hint Bülbülü',
    'Cennet Kuşu',
    'Zebra Finch',
    'Diğer'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">
              {isEditing ? 'Kuş Bilgilerini Düzenle' : 'Yeni Kuş Ekle'}
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
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-neutral-100 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Kuş fotoğrafı"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-neutral-400" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                  <Upload className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-neutral-600 mt-2">Fotoğraf yüklemek için tıklayın</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Kuş Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                    errors.name ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                  }`}
                  placeholder="Örn: Luna"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Bilezik Numarası <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ring_number}
                  onChange={(e) => handleInputChange('ring_number', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                    errors.ring_number ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                  }`}
                  placeholder="Örn: TR-2024-001"
                />
                {errors.ring_number && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.ring_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Tür
                </label>
                <select
                  value={formData.species}
                  onChange={(e) => handleInputChange('species', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300"
                >
                  {speciesOptions.map(species => (
                    <option key={species} value={species}>{species}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Cinsiyet <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm font-medium text-neutral-700">Erkek ♂</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm font-medium text-neutral-700">Dişi ♀</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Doğum Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 ${
                    errors.birth_date ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-neutral-200'
                  }`}
                />
                {errors.birth_date && (
                  <p className="mt-2 text-sm text-red-600 animate-shake">{errors.birth_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Renk Mutasyonu
                </label>
                <input
                  type="text"
                  value={formData.color_mutation}
                  onChange={(e) => handleInputChange('color_mutation', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300"
                  placeholder="Örn: Lutino, Albino, Normal"
                />
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
                placeholder="Kuşla ilgili genel notlar, sağlık durumu, davranışlar..."
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
              <div className="flex items-center gap-3">
                {formData.is_favorite ? (
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                ) : (
                  <StarOff className="w-5 h-5 text-neutral-400" />
                )}
                <div>
                  <p className="font-medium text-neutral-800">Favori Kuş</p>
                  <p className="text-sm text-neutral-600">Hızlı erişim için işaretle</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange('is_favorite', !formData.is_favorite)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_favorite ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_favorite ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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
              <h3 className="text-xl font-bold text-neutral-800 mb-2">Kuşu Sil</h3>
              <p className="text-neutral-600 mb-6">
                <strong>{formData.name}</strong> adlı kuşu silmek istediğinizden emin misiniz? 
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