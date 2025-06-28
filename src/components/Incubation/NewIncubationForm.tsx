import React, { useState, useEffect } from 'react';
import { X, Save, Heart, User, Calendar, Home, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DatePicker } from '../Common/DatePicker';
import { notificationService } from '../../services/notificationService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Bird {
  id: string;
  name: string;
  ring_number: string;
  gender: 'male' | 'female';
  species?: string;
  is_favorite?: boolean;
}

interface Pair {
  female: Bird;
  male: Bird;
  name: string;
  lastUsed?: string;
}

interface NewIncubationFormProps {
  onSave: (incubation: any) => void;
  onCancel: () => void;
}

export const NewIncubationForm: React.FC<NewIncubationFormProps> = ({
  onSave,
  onCancel
}) => {
  // Form state
  const [formData, setFormData] = useState({
    nest_name: '',
    female_bird_id: '',
    male_bird_id: '',
    start_date: new Date().toISOString().split('T')[0],
    nest_location: '',
    notes: ''
  });
  
  // Helper states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  
  // Data states
  const [maleBirds, setMaleBirds] = useState<Bird[]>([]);
  const [femaleBirds, setFemaleBirds] = useState<Bird[]>([]);
  const [loadingBirds, setLoadingBirds] = useState(true);
  const [previousPairs, setPreviousPairs] = useState<Pair[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Step state (for multi-step form)
  const [currentStep, setCurrentStep] = useState<'pair' | 'details'>('pair');

  useEffect(() => {
    loadBirds();
    loadPreviousPairs();
  }, []);

  // Watch for form changes
  useEffect(() => {
    const hasChanges = formData.nest_name.trim() !== '' || 
                      formData.female_bird_id !== '' || 
                      formData.male_bird_id !== '' ||
                      formData.nest_location.trim() !== '' ||
                      formData.notes.trim() !== '';
    setHasUnsavedChanges(hasChanges);
  }, [formData]);

  // Auto-generate nest name when birds are selected
  useEffect(() => {
    if (formData.female_bird_id && formData.male_bird_id) {
      const female = femaleBirds.find(bird => bird.id === formData.female_bird_id);
      const male = maleBirds.find(bird => bird.id === formData.male_bird_id);
      
      if (female && male) {
        const today = new Date();
        const month = format(today, 'MMMM', { locale: tr });
        const year = today.getFullYear();
        
        const suggestions = [
          `${female.name} & ${male.name}`,
          `${female.name} & ${male.name} - ${month} ${year}`,
          `${month} ${year} Çifti`,
          `${female.name}-${male.name} Kuluçkası`
        ];
        
        setSuggestedNames(suggestions);
        
        if (!formData.nest_name) {
          setFormData(prev => ({ ...prev, nest_name: suggestions[0] }));
        }
      }
    }
  }, [formData.female_bird_id, formData.male_bird_id, femaleBirds, maleBirds]);

  const loadBirds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: birds, error } = await supabase
        .from('birds')
        .select('id, name, ring_number, gender, species, is_favorite')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // Split by gender
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

  const loadPreviousPairs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all previous clutches with their male and female birds
      const { data: clutches, error } = await supabase
        .from('clutches')
        .select(`
          id, 
          nest_name,
          start_date,
          female_bird_id, 
          male_bird_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If there are clutches, load the associated birds
      if (clutches && clutches.length > 0) {
        // Gather all bird IDs
        const birdIds = new Set<string>();
        clutches.forEach(clutch => {
          if (clutch.female_bird_id) birdIds.add(clutch.female_bird_id);
          if (clutch.male_bird_id) birdIds.add(clutch.male_bird_id);
        });

        // Fetch bird details
        if (birdIds.size > 0) {
          const { data: birds, error: birdError } = await supabase
            .from('birds')
            .select('id, name, ring_number, gender, species, is_favorite')
            .in('id', Array.from(birdIds))
            .order('name');

          if (birdError) throw birdError;
          
          if (birds) {
            // Create pairs from clutches
            const pairs: Pair[] = [];
            clutches.forEach(clutch => {
              if (clutch.female_bird_id && clutch.male_bird_id) {
                const female = birds.find(b => b.id === clutch.female_bird_id);
                const male = birds.find(b => b.id === clutch.male_bird_id);
                
                if (female && male) {
                  // Check if this pair already exists in our pairs array
                  const existingPairIndex = pairs.findIndex(
                    p => p.female.id === female.id && p.male.id === male.id
                  );
                  
                  if (existingPairIndex === -1) {
                    // Add new pair
                    pairs.push({
                      female,
                      male,
                      name: clutch.nest_name,
                      lastUsed: clutch.start_date
                    });
                  }
                }
              }
            });
            
            // Sort pairs by lastUsed date (most recent first)
            pairs.sort((a, b) => {
              if (!a.lastUsed) return 1;
              if (!b.lastUsed) return -1;
              return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
            });
            
            setPreviousPairs(pairs);
          }
        }
      }

    } catch (error) {
      console.error('Error loading previous pairs:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nest_name.trim()) {
      newErrors.nest_name = 'Kuluçka adı zorunludur';
    }

    if (!formData.female_bird_id) {
      newErrors.female_bird_id = 'Lütfen bir dişi kuş seçin';
    }

    if (!formData.male_bird_id) {
      newErrors.male_bird_id = 'Lütfen bir erkek kuş seçin';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Başlangıç tarihi zorunludur';
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
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

      const expectedHatchDate = calculateExpectedHatchDate(formData.start_date);

      const clutchData = {
        nest_name: formData.nest_name.trim(),
        start_date: formData.start_date,
        expected_hatch_date: expectedHatchDate,
        notes: formData.notes.trim() || null,
        female_bird_id: formData.female_bird_id || null,
        male_bird_id: formData.male_bird_id || null,
        user_id: user.id,
        status: 'active' as const
      };

      const { data, error } = await supabase
        .from('clutches')
        .insert(clutchData)
        .select()
        .single();

      if (error) throw error;

      // Bildirim zamanlaması
      try {
        await notificationService.scheduleHatchReminders(
          data.id,
          formData.start_date,
          expectedHatchDate
        );
      } catch (notificationError) {
        console.error('Error scheduling notifications:', notificationError);
        // Bildirim hatası ana işlemi etkilemez
      }

      onSave(data);
      setHasUnsavedChanges(false);
      
      showToast('Yeni kuluçka başarıyla eklendi!', 'success');

    } catch (error: any) {
      console.error('Error saving incubation:', error);
      showToast(error.message || 'Bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
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

  const handlePairSelect = (pair: Pair) => {
    setFormData(prev => ({
      ...prev,
      female_bird_id: pair.female.id,
      male_bird_id: pair.male.id,
      nest_name: `${pair.female.name} & ${pair.male.name} - Yeni Kuluçka`
    }));
    
    // Auto-advance to next step
    setCurrentStep('details');
  };

  const handleNestNameSuggestion = (name: string) => {
    setFormData(prev => ({ ...prev, nest_name: name }));
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
              Yeni Kuluçka Ekle
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {currentStep === 'pair' ? (
            // STEP 1: Çift Seçimi
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">Kuluçka Çifti Seçin</h3>
                <div className="bg-blue-100 text-blue-800 text-xs font-medium py-1 px-2 rounded">
                  Adım 1/2
                </div>
              </div>
              
              {/* Önceki Çiftler */}
              {previousPairs.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-base font-medium mb-3 text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Önceki Çiftler
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {previousPairs.slice(0, 4).map((pair, index) => (
                      <button
                        key={`${pair.female.id}-${pair.male.id}`}
                        onClick={() => handlePairSelect(pair)}
                        className="p-3 border-2 rounded-xl transition-all hover:shadow-md hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex flex-col items-center"
                      >
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                            <span className="text-pink-600 dark:text-pink-400 font-bold">♀</span>
                          </div>
                          <Heart className="w-4 h-4 text-red-500" />
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-bold">♂</span>
                          </div>
                        </div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          {pair.female.name} & {pair.male.name}
                        </p>
                        {pair.lastUsed && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            Son kuluçka: {format(new Date(pair.lastUsed), 'd MMMM yyyy', { locale: tr })}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kuş Seçimi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    Dişi Kuş Seçimi <span className="text-red-500">*</span>
                  </label>
                  
                  {loadingBirds ? (
                    <div className="h-40 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-xl animate-pulse">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : femaleBirds.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                      <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-2">
                        <User className="w-5 h-5 text-pink-500" />
                      </div>
                      <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
                        Henüz dişi kuş yok. Önce dişi kuş eklemelisiniz.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      {femaleBirds.map(bird => (
                        <div
                          key={bird.id}
                          onClick={() => handleInputChange('female_bird_id', bird.id)}
                          className={`p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-3 cursor-pointer transition-colors ${
                            formData.female_bird_id === bird.id 
                              ? 'bg-pink-50 dark:bg-pink-900/20' 
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            formData.female_bird_id === bird.id 
                              ? 'bg-pink-500' 
                              : 'border-2 border-neutral-300 dark:border-neutral-600'
                          }`}>
                            {formData.female_bird_id === bird.id && (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                              {bird.name} 
                              {bird.is_favorite && <span className="text-yellow-500">★</span>}
                            </p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {bird.ring_number}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full">
                            ♀
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {errors.female_bird_id && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.female_bird_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    Erkek Kuş Seçimi <span className="text-red-500">*</span>
                  </label>
                  
                  {loadingBirds ? (
                    <div className="h-40 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-xl animate-pulse">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : maleBirds.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                        <User className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
                        Henüz erkek kuş yok. Önce erkek kuş eklemelisiniz.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      {maleBirds.map(bird => (
                        <div
                          key={bird.id}
                          onClick={() => handleInputChange('male_bird_id', bird.id)}
                          className={`p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-3 cursor-pointer transition-colors ${
                            formData.male_bird_id === bird.id 
                              ? 'bg-blue-50 dark:bg-blue-900/20' 
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            formData.male_bird_id === bird.id 
                              ? 'bg-blue-500' 
                              : 'border-2 border-neutral-300 dark:border-neutral-600'
                          }`}>
                            {formData.male_bird_id === bird.id && (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                              {bird.name}
                              {bird.is_favorite && <span className="text-yellow-500">★</span>}
                            </p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {bird.ring_number}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            ♂
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {errors.male_bird_id && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.male_bird_id}</p>
                  )}
                </div>
              </div>

              {/* Seçim Özeti ve İleri Butonu */}
              {selectedFemale && selectedMale && (
                <div className="mt-6">
                  <div className="p-4 bg-gradient-to-r from-pink-50 to-blue-50 dark:from-pink-900/20 dark:to-blue-900/20 rounded-xl">
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <div className="text-center">
                        <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-2">
                          <span className="text-pink-600 dark:text-pink-400 font-bold text-xl">♀</span>
                        </div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">{selectedFemale.name}</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <Heart className="w-6 h-6 text-red-500 animate-pulse mb-1" />
                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Çift</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">♂</span>
                        </div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">{selectedMale.name}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => setCurrentStep('details')}
                        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        Çifti Seçip Devam Et
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Butonlar */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            // STEP 2: Kuluçka Detayları
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">Kuluçka Detayları</h3>
                <div className="bg-blue-100 text-blue-800 text-xs font-medium py-1 px-2 rounded">
                  Adım 2/2
                </div>
              </div>

              {/* Çift Özeti */}
              {selectedFemale && selectedMale && (
                <div className="p-3 bg-gradient-to-r from-pink-50 to-blue-50 dark:from-pink-900/20 dark:to-blue-900/20 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                        <span className="text-pink-600 dark:text-pink-400 font-bold">♀</span>
                      </div>
                      <p className="text-xs font-medium mt-1">{selectedFemale.name}</p>
                    </div>
                    <Heart className="w-5 h-5 text-red-500" />
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">♂</span>
                      </div>
                      <p className="text-xs font-medium mt-1">{selectedMale.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('pair')}
                    className="w-full mt-3 text-xs text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Çifti Değiştir
                  </button>
                </div>
              )}
              
              {/* Yuva Adı */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Kuluçka Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nest_name}
                  onChange={(e) => handleInputChange('nest_name', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 ${
                    errors.nest_name ? 'border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900/50 focus:border-red-400 dark:focus:border-red-600' : 'border-neutral-200 dark:border-neutral-600'
                  }`}
                  placeholder="Örn: Luna & Apollo - 1. Kuluçka"
                />
                {errors.nest_name && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-shake">{errors.nest_name}</p>
                )}
                
                {/* İsim Önerileri */}
                {suggestedNames.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                      Öneriler:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedNames.map((name, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleNestNameSuggestion(name)}
                          className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Yuva Konumu */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Yuva Konumu
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={formData.nest_location}
                    onChange={(e) => handleInputChange('nest_location', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                    placeholder="Örn: Balkon, 3. Kafes"
                  />
                </div>
              </div>
              
              {/* Başlangıç Tarihi */}
              <div>
                <DatePicker
                  label="Başlangıç Tarihi *"
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
                  Notlar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900/50 focus:border-primary-400 dark:focus:border-primary-600 transition-all duration-300 resize-none bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                  placeholder="Kuluçka ile ilgili özel notlarınız, gözlemleriniz..."
                  maxLength={500}
                />
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

              {/* Butonlar */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep('pair')}
                  className="px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  Geri
                </button>
                
                <button
                  type="submit"
                  disabled={loading || loadingBirds || femaleBirds.length === 0 || maleBirds.length === 0}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Kuluçkayı Başlat
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Kaydedilmemiş Değişiklikler Modalı */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full animate-slide-up transition-colors duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
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
    </div>
  );
};