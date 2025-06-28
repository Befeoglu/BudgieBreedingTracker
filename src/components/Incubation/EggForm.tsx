import React, { useState, useEffect } from 'react';
import { X, Save, Egg, User, Calendar, Baby, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DatePicker } from '../Common/DatePicker';

interface Bird {
  id: string;
  name: string;
  ring_number: string;
  gender: 'male' | 'female';
  species?: string;
}

interface EggData {
  id?: string;
  clutch_id: string;
  position: number;
  number: number;
  status: 'belirsiz' | 'boş' | 'dolu' | 'çıktı';
  mother_id?: string;
  father_id?: string;
  added_date: string;
  notes?: string;
}

interface EggFormProps {
  clutchId: string;
  defaultMotherId?: string;
  defaultFatherId?: string;
  existingEggNumbers: number[];
  onSave: (egg: EggData) => void;
  onCancel: () => void;
  egg?: EggData | null;
  isEditing?: boolean;  
}

export const EggForm: React.FC<EggFormProps> = ({
  clutchId,
  defaultMotherId,
  defaultFatherId,
  existingEggNumbers,
  onSave,
  onCancel,
  egg,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<EggData>({
    clutch_id: clutchId,
    position: 1,
    number: 1,
    status: 'belirsiz',
    mother_id: defaultMotherId || '',
    father_id: defaultFatherId || '',
    added_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [birds, setBirds] = useState<Bird[]>([]);
  const [loadingBirds, setLoadingBirds] = useState(true);

  useEffect(() => {
    loadBirds();
    
    if (isEditing && egg) {
      setFormData(egg);
    } else {
      // Otomatik numara atama
      const nextNumber = getNextAvailableNumber();
      const nextPosition = getNextAvailablePosition();
      setFormData(prev => ({ ...prev, number: nextNumber }));
      setFormData(prev => ({ ...prev, position: nextPosition }));
    }
  }, [egg, isEditing, existingEggNumbers]);

  const loadBirds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('birds')
        .select('id, name, ring_number, gender, species')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setBirds(data || []);
    } catch (error) {
      console.error('Error loading birds:', error);
    } finally {
      setLoadingBirds(false);
    }
  };

  const getNextAvailableNumber = (): number => {
    for (let i = 1; i <= 20; i++) {
      if (!existingEggNumbers.includes(i)) {
        return i;
      }
    }
    return existingEggNumbers.length + 1;
  };

  const getNextAvailablePosition = (): number => {
    // Find the first available position that isn't used yet
    let position = 1;
    while (eggs.find(egg => egg.position === position)) {
      position++;
    }
    return position;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.number || formData.number < 1 || formData.number > 20) {
      newErrors.number = 'Yumurta numarası 1-20 arasında olmalıdır';
    }

    if (!isEditing && existingEggNumbers.includes(formData.number)) {
      newErrors.number = `${formData.number} numaralı yumurta zaten mevcut`;
    }

    if (!formData.status) {
      newErrors.status = 'Durum seçimi zorunludur';
    }

    if (!formData.mother_id) {
      newErrors.mother_id = 'Anne kuş seçimi zorunludur';
    }

    if (!formData.father_id) {
      newErrors.father_id = 'Baba kuş seçimi zorunludur';
    }

    if (formData.mother_id && formData.father_id && formData.mother_id === formData.father_id) {
      newErrors.mother_id = 'Anne ve baba farklı olmalıdır';
      newErrors.father_id = 'Anne ve baba farklı olmalıdır';
    }

    if (!formData.added_date) {
      newErrors.added_date = 'Ekleme tarihi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EggData, value: any) => {
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
      const eggData = {
        clutch_id: clutchId,
        number: formData.number,
        position: formData.position,
        status: formData.status,
        mother_id: formData.mother_id || null,
        father_id: formData.father_id || null,
        added_date: formData.added_date,
        notes: formData.notes || null
      };

      let result;
      if (isEditing && egg?.id) {
        result = await supabase
          .from('eggs')
          .update(eggData)
          .eq('id', egg.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('eggs')
          .insert(eggData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onSave(result.data);
      showToast(isEditing ? 'Yumurta güncellendi' : 'Yumurta eklendi', 'success');

    } catch (error: any) {
      console.error('Error saving egg:', error);
      showToast(error.message || 'Bir hata oluştu', 'error');
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

  const statusOptions = [
    { value: 'belirsiz', label: 'Belirsiz', color: 'bg-gray-100 text-gray-700', icon: '❓' },
    { value: 'boş', label: 'Boş', color: 'bg-red-100 text-red-700', icon: '⭕' },
    { value: 'dolu', label: 'Dolu', color: 'bg-blue-100 text-blue-700', icon: '🥚' },
    { value: 'çıktı', label: 'Çıktı', color: 'bg-green-100 text-green-700', icon: '🐣' }
  ];

  const femaleBirds = birds.filter(bird => bird.gender === 'female');
  const maleBirds = birds.filter(bird => bird.gender === 'male');

  const selectedMother = birds.find(bird => bird.id === formData.mother_id);
  const selectedFather = birds.find(bird => bird.id === formData.father_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Egg className="w-6 h-6 text-yellow-600" />
              {isEditing ? 'Yumurta Düzenle' : 'Yeni Yumurta Ekle'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            > 
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Yumurta Numarası ve Durum */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Yumurta Numarası <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="number"
                    min="1" 
                    max="20" 
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', parseInt(e.target.value) || 1)}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 ${
                      errors.number ? 'border-red-300 dark:border-red-700' : 'border-neutral-200 dark:border-neutral-600'
                    }`}
                    placeholder="1"
                  />
                </div>
                {errors.number && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.number}</p>
                )}
                <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Mevcut: {existingEggNumbers.length > 0 ? existingEggNumbers.join(', ') : 'Henüz yumurta yok'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Durum <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2"> 
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('status', option.value)}
                      className={`p-3 border-2 rounded-xl transition-all duration-300 ${
                        formData.status === option.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.status && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.status}</p>
                )}
              </div>
              
              {/* Çıktı durumu açıklaması */}
              {formData.status === 'çıktı' && (
                <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Baby className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Yavru Kaydı Oluşturulacak
                    </p>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Bu yumurta "Çıktı" durumunda kaydedildiğinde otomatik olarak bir yavru kaydı oluşturulacak.
                  </p>
                </div>
              )}

              {/* Boş durumu açıklaması */}
              {formData.status === 'boş' && (
                <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Boş Yumurta
                    </p>
                  </div>
                </div>
              )}

              {/* Dolu durumu açıklaması */}
              {formData.status === 'dolu' && (
                <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Egg className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Dolu Yumurta
                    </p>
                  </div>
                </div>
              )}
              
              {/* Belirsiz durumu açıklaması */}
              {formData.status === 'belirsiz' && (
                <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Belirsiz Durum
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Anne ve Baba Seçimi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Anne Kuş <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-500 z-10" />
                  <select
                    value={formData.mother_id}
                    onChange={(e) => handleInputChange('mother_id', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 appearance-none ${
                      errors.mother_id ? 'border-red-300 dark:border-red-700' : 'border-neutral-200 dark:border-neutral-600'
                    }`}
                    disabled={loadingBirds}
                  >
                    <option value="">
                      {loadingBirds ? 'Dişi kuşlar yükleniyor...' : 'Anne kuş seçin'}
                    </option>
                    {femaleBirds.map((bird) => (
                      <option key={bird.id} value={bird.id}>
                        {bird.name} ({bird.ring_number})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.mother_id && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.mother_id}</p>
                )}
                
                {selectedMother && (
                  <div className="mt-3 p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg">
                    <p className="text-sm font-medium text-pink-700 dark:text-pink-300 flex items-center gap-2">
                      ♀ {selectedMother.name}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">{selectedMother.ring_number}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Baba Kuş <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 z-10" />
                  <select
                    value={formData.father_id}
                    onChange={(e) => handleInputChange('father_id', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 appearance-none ${
                      errors.father_id ? 'border-red-300 dark:border-red-700' : 'border-neutral-200 dark:border-neutral-600'
                    }`}
                    disabled={loadingBirds}
                  >
                    <option value="">
                      {loadingBirds ? 'Erkek kuşlar yükleniyor...' : 'Baba kuş seçin'}
                    </option>
                    {maleBirds.map((bird) => (
                      <option key={bird.id} value={bird.id}>
                        {bird.name} ({bird.ring_number})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.father_id && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.father_id}</p>
                )}
                
                {selectedFather && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"> 
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      ♂ {selectedFather.name}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">{selectedFather.ring_number}</p>
                  </div>
                )}
              </div>
              
              {/* Yumurta Numarası Hatırlatma */}
              <div className="mt-2 bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg border border-neutral-200 dark:border-neutral-600">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">Mevcut Yumurtalar:</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {existingEggNumbers.length > 0 ? (
                    existingEggNumbers.sort((a, b) => a - b).map(num => (
                      <span key={num} className="inline-block px-2 py-1 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded text-xs font-medium">
                        #{num}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Henüz yumurta eklenmemiş</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ekleme Tarihi */}
            <div>
              <DatePicker
                label="Ekleme Tarihi *"
                value={formData.added_date}
                onChange={(date) => handleInputChange('added_date', date)}
                required
                error={errors.added_date}
                maxDate={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Notlar */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 resize-none bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                placeholder="Yumurta ile ilgili özel notlar, gözlemler..."
                maxLength={300}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Opsiyonel - özel durumlar, gözlemler vb.
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {(formData.notes || '').length}/300
                </p>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || loadingBirds}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isEditing ? 'Güncelle' : 'Yumurta Ekle'}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-4 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold hover:bg-neutral-200 dark:hover:bg-neutral-600 focus:ring-4 focus:ring-neutral-200 dark:focus:ring-neutral-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};