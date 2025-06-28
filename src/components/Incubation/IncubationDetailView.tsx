import React, { useState, useEffect } from 'react';
import { X, Edit3, Plus, Egg, Calendar, Users, FileText, Trash2, Baby } from 'lucide-react';
import { IncubationForm } from './IncubationForm';
import { EggForm } from './EggForm';
import { supabase } from '../../lib/supabase';
import { notificationService } from '../../services/notificationService';
import { format, differenceInDays, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Bird {
  id: string;
  name: string;
  ring_number: string;
  gender: 'male' | 'female';
  species?: string;
}

interface EggData {
  id: string;
  clutch_id: string;
  number: number;
  position?: number; // Eski sistemden gelen yumurtalar için
  status: 'belirsiz' | 'boş' | 'dolu' | 'çıktı';
  mother_id?: string;
  father_id?: string;
  laid_date?: string;
  expected_hatch_date?: string;
  actual_hatch_date?: string;
  added_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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

interface IncubationDetailViewProps {
  incubation: Incubation;
  onClose: () => void;
  onUpdate: (incubation: Incubation) => void;
  onDelete: (id: string) => void;
}

export const IncubationDetailView: React.FC<IncubationDetailViewProps> = ({
  incubation,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEggForm, setShowEggForm] = useState(false);
  const [editingEgg, setEditingEgg] = useState<EggData | null>(null);
  const [eggs, setEggs] = useState<EggData[]>([]);
  const [loading, setLoading] = useState(true);
  const [femaleBird, setFemaleBird] = useState<Bird | null>(null);
  const [maleBird, setMaleBird] = useState<Bird | null>(null);
  const [creatingChick, setCreatingChick] = useState<string | null>(null);

  useEffect(() => {
    // Only load data if incubation and incubation.id are valid
    if (incubation && incubation.id) {
      loadEggs();
      loadBirds();
    } else {
      setLoading(false);
    }
  }, [incubation?.id]);

  const loadEggs = async () => {
    // Guard clause to ensure incubation.id is valid
    if (!incubation || !incubation.id) {
      console.warn('Cannot load eggs: incubation or incubation.id is undefined');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('eggs')
        .select('*')
        .eq('clutch_id', incubation.id)
        .order('number', { ascending: true });

      if (error) throw error;
      setEggs(data || []);
    } catch (error) {
      console.error('Error loading eggs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBirds = async () => {
    // Guard clause to ensure incubation exists
    if (!incubation) {
      console.warn('Cannot load birds: incubation is undefined');
      return;
    }

    try {
      // Only query for birds if the IDs are valid
      if (incubation.female_bird_id) {
        const { data: female, error: femaleError } = await supabase
          .from('birds')
          .select('*')
          .eq('id', incubation.female_bird_id)
          .single();
        
        if (!femaleError && female) {
          setFemaleBird(female);
        }
      }

      if (incubation.male_bird_id) {
        const { data: male, error: maleError } = await supabase
          .from('birds')
          .select('*')
          .eq('id', incubation.male_bird_id)
          .single();
        
        if (!maleError && male) {
          setMaleBird(male);
        }
      }
    } catch (error) {
      console.error('Error loading birds:', error);
    }
  };

  const handleSaveEgg = async (savedEgg: EggData) => {
    if (editingEgg) {
      // Eğer durum "çıktı" olarak değiştirildiyse ve önceki durum "çıktı" değilse
      if (savedEgg.status === 'çıktı' && editingEgg.status !== 'çıktı') {
        // Yeni yavru oluştur
        await createChickFromEgg(savedEgg);
      }
      
      setEggs(prev => prev.map(egg => egg.id === savedEgg.id ? savedEgg : egg));
    } else {
      // Yeni yumurta eklendi, sıralı listede göster
      setEggs(prev => [...prev, savedEgg].sort((a, b) => a.number - b.number));
      
      // Eğer yeni eklenen yumurta "çıktı" durumundaysa
      if (savedEgg.status === 'çıktı') {
        await createChickFromEgg(savedEgg);
      }
    }
    
    setShowEggForm(false);
    setEditingEgg(null);
  };

  const createChickFromEgg = async (egg: EggData) => {
    try {
      setCreatingChick(egg.id);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");
      
      const chickName = `Yavru #${egg.number}`;
      const hatchDate = egg.actual_hatch_date || new Date().toISOString().split('T')[0];
      
      // Yavru oluştur
      const { data: chick, error: chickError } = await supabase
        .from('chicks')
        .insert({
          user_id: user.id,
          egg_id: egg.id,
          name: chickName,
          hatch_date: hatchDate,
          notes: `${incubation.nest_name} kuluçkasından çıkan ${egg.number} numaralı yumurta.`
        })
        .select()
        .single();
        
      if (chickError) throw chickError;
      
      // Bildirim gönder
      await notificationService.notifyChickHatched(
        chickName, 
        incubation.nest_name
      );
      
      showToast(`${chickName} başarıyla oluşturuldu`, 'success');
      
    } catch (error: any) {
      console.error('Error creating chick from egg:', error);
      showToast(`Yavru oluşturma hatası: ${error.message}`, 'error');
    } finally {
      setCreatingChick(null);
    }
  };

  const handleEditEgg = (egg: EggData) => {
    setEditingEgg(egg);
    setShowEggForm(true);
  };

  const handleDeleteEgg = async (eggId: string) => {
    const egg = eggs.find(e => e.id === eggId);
    const confirmed = window.confirm(`${egg?.number} numaralı yumurtayı silmek istediğinizden emin misiniz?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('eggs')
        .delete()
        .eq('id', eggId);

      if (error) throw error;

      setEggs(prev => prev.filter(egg => egg.id !== eggId));
      showToast('Yumurta silindi', 'success');
    } catch (error: any) {
      console.error('Error deleting egg:', error);
      showToast('Silme işlemi başarısız', 'error');
    }
  };

  const handleEggStatusChange = async (eggId: string, newStatus: 'belirsiz' | 'boş' | 'dolu' | 'çıktı') => {
    const egg = eggs.find(e => e.id === eggId);
    if (!egg) return;
    
    try {
      // Eğer durum "çıktı" olarak değiştirildiyse ve önceki durum "çıktı" değilse
      if (newStatus === 'çıktı' && egg.status !== 'çıktı') {
        // Yumurta durumunu güncelle
        const { data: updatedEgg, error } = await supabase
          .from('eggs')
          .update({
            status: newStatus,
            actual_hatch_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', eggId)
          .select()
          .single();
          
        if (error) throw error;
        
        // UI'ı güncelle
        setEggs(prev => prev.map(e => e.id === eggId ? updatedEgg : e));
        
        // Yavru oluştur
        await createChickFromEgg(updatedEgg);
        
        return;
      }
      
      // Diğer durum değişiklikleri için basit güncelleme
      const { data: updatedEgg, error } = await supabase
        .from('eggs')
        .update({ status: newStatus })
        .eq('id', eggId)
        .select()
        .single();
        
      if (error) throw error;
      
      setEggs(prev => prev.map(e => e.id === eggId ? updatedEgg : e));
      showToast(`Yumurta durumu "${newStatus}" olarak güncellendi`, 'success');
      
    } catch (error: any) {
      console.error('Error updating egg status:', error);
      showToast(`Durum güncelleme hatası: ${error.message}`, 'error');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'belirsiz': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'boş': return 'bg-red-100 text-red-700 border-red-200';
      case 'dolu': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'çıktı': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'belirsiz': return '❓';
      case 'boş': return '⭕';
      case 'dolu': return '🥚';
      case 'çıktı': return '🐣';
      default: return '❓';
    }
  };

  // Early return if incubation is not valid
  if (!incubation || !incubation.id) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <X className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              Hata
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Kuluçka bilgileri bulunamadı veya geçersiz.
            </p>
            <button
              onClick={onClose}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // İstatistikler
  const totalEggs = eggs.length;
  const eggStats = {
    belirsiz: eggs.filter(e => e.status === 'belirsiz').length,
    boş: eggs.filter(e => e.status === 'boş').length,
    dolu: eggs.filter(e => e.status === 'dolu').length,
    çıktı: eggs.filter(e => e.status === 'çıktı').length
  };

  const successRate = totalEggs > 0 ? Math.round((eggStats.çıktı / totalEggs) * 100) : 0;
  const existingEggNumbers = eggs.map(egg => egg.number);

  // Tarih doğrulama ve güvenli işlemler
  const start = new Date(incubation.start_date);
  const expected = new Date(incubation.expected_hatch_date);
  const today = new Date();
  
  const isStartDateValid = isValid(start);
  const isExpectedDateValid = isValid(expected);
  
  // İlerleme hesaplama - sadece geçerli tarihlerle
  let totalDays = 0;
  let daysPassed = 0;
  let progress = 0;
  
  if (isStartDateValid && isExpectedDateValid) {
    totalDays = differenceInDays(expected, start);
    daysPassed = differenceInDays(today, start);
    progress = totalDays > 0 ? Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100) : 0;
  }

  const formatDate = (date: Date, fallback: string = 'Tarih Yok') => {
    return isValid(date) ? format(date, 'dd MMM yyyy', { locale: tr }) : fallback;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary-600" />
              {incubation.nest_name}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Kuluçkayı Düzenle"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Kuluçka Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Sol Panel - Temel Bilgiler */}
            <div className="space-y-4">
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Kuluçka Bilgileri
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Başlangıç:</span>
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                      {formatDate(start)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Tahmini Çıkım:</span>
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                      {formatDate(expected)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Geçen Gün:</span>
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                      {isStartDateValid && isExpectedDateValid ? `${daysPassed}/${totalDays} gün` : 'Hesaplanamıyor'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">İlerleme:</span>
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                      {isStartDateValid && isExpectedDateValid ? `${Math.round(progress)}%` : 'Hesaplanamıyor'}
                    </span>
                  </div>
                </div>
                
                {/* İlerleme Çubuğu */}
                <div className="mt-4">
                  <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Ebeveyn Bilgileri */}
              {(femaleBird || maleBird) && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                    Ebeveynler
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {femaleBird && (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-pink-600 dark:text-pink-400 font-bold text-lg">♀</span>
                        </div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{femaleBird.name}</p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{femaleBird.ring_number}</p>
                      </div>
                    )}
                    {maleBird && (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">♂</span>
                        </div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{maleBird.name}</p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{maleBird.ring_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ Panel - İstatistikler */}
            <div className="space-y-4">
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                  <Egg className="w-4 h-4" />
                  Yumurta İstatistikleri
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{totalEggs}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Toplam</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{successRate}%</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Başarı</div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="font-bold">{eggStats.belirsiz}</div>
                    <div>Belirsiz</div>
                  </div>
                  <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
                    <div className="font-bold">{eggStats.boş}</div>
                    <div>Boş</div>
                  </div>
                  <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <div className="font-bold">{eggStats.dolu}</div>
                    <div>Dolu</div>
                  </div>
                  <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
                    <div className="font-bold">{eggStats.çıktı}</div>
                    <div>Çıktı</div>
                  </div>
                </div>
              </div>

              {/* Notlar */}
              {incubation.notes && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notlar
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {incubation.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Yumurta Yönetimi */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <Egg className="w-5 h-5" />
                Yumurtalar ({totalEggs})
              </h3>
              <button
                onClick={() => setShowEggForm(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Yumurta Ekle
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : eggs.length === 0 ? (
              <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <Egg className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">Henüz yumurta eklenmemiş</p>
                <button
                  onClick={() => setShowEggForm(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  İlk Yumurtayı Ekle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {eggs.map((egg) => (
                  <div
                    key={egg.id}
                    className={`border-2 rounded-lg p-4 text-center hover:shadow-md transition-all duration-300 group relative ${getStatusColor(egg.status)}`}
                  >
                    <div className="text-2xl mb-2">{getStatusIcon(egg.status)}</div>
                    <div className="font-bold text-lg mb-1">#{egg.number}</div>
                    <div className="text-xs mb-3 capitalize">{egg.status}</div>
                    
                    {/* Durum Değiştirme Butonları */}
                    <div className="mb-3">
                      <div className="text-xs mb-1 text-neutral-600 dark:text-neutral-400">Durum Değiştir:</div>
                      <div className="flex flex-wrap justify-center gap-1">
                        {egg.status !== 'belirsiz' && (
                          <button
                            onClick={() => handleEggStatusChange(egg.id, 'belirsiz')}
                            title="Belirsiz"
                            className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full text-xs flex items-center justify-center"
                          >
                            ❓
                          </button>
                        )}
                        {egg.status !== 'boş' && (
                          <button
                            onClick={() => handleEggStatusChange(egg.id, 'boş')}
                            title="Boş"
                            className="w-6 h-6 bg-red-200 hover:bg-red-300 rounded-full text-xs flex items-center justify-center"
                          >
                            ⭕
                          </button>
                        )}
                        {egg.status !== 'dolu' && (
                          <button
                            onClick={() => handleEggStatusChange(egg.id, 'dolu')}
                            title="Dolu"
                            className="w-6 h-6 bg-blue-200 hover:bg-blue-300 rounded-full text-xs flex items-center justify-center"
                          >
                            🥚
                          </button>
                        )}
                        {egg.status !== 'çıktı' && (
                          <button
                            onClick={() => handleEggStatusChange(egg.id, 'çıktı')}
                            title="Çıktı"
                            className="w-6 h-6 bg-green-200 hover:bg-green-300 rounded-full text-xs flex items-center justify-center"
                          >
                            🐣
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Çıktı olan yumurta için Yavru Görüntüleme Butonu */}
                    {egg.status === 'çıktı' && (
                      <button
                        onClick={() => alert('Yavru detayına gitmek için buraya tıklayın')}
                        className="w-full px-2 py-1 bg-green-200 hover:bg-green-300 rounded text-xs flex items-center justify-center gap-1 mt-2"
                      >
                        <Baby className="w-3 h-3" />
                        Yavru Gör
                      </button>
                    )}
                    
                    {/* Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-1 mt-2">
                      <button
                        onClick={() => handleEditEgg(egg)}
                        className="p-1 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteEgg(egg.id)}
                        className="p-1 text-red-600 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Yumurta eklenme tarihi */}
                    {egg.added_date && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                        {formatDate(new Date(egg.added_date), 'Tarih Yok')}
                      </div>
                    )}
                    
                    {/* Çıkıyor İşareti */}
                    {creatingChick === egg.id && (
                      <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kuluçka Düzenleme Formu */}
      {showEditForm && (
        <IncubationForm
          incubation={incubation}
          isEditing={true}
          onSave={(updatedIncubation) => {
            onUpdate(updatedIncubation);
            setShowEditForm(false);
          }}
          onCancel={() => setShowEditForm(false)}
          onDelete={onDelete}
        />
      )}

      {/* Yumurta Ekleme/Düzenleme Formu */}
      {showEggForm && (
        <EggForm
          clutchId={incubation.id}
          defaultMotherId={incubation.female_bird_id}
          defaultFatherId={incubation.male_bird_id}
          existingEggNumbers={existingEggNumbers}
          egg={editingEgg}
          isEditing={!!editingEgg}
          onSave={handleSaveEgg}
          onCancel={() => {
            setShowEggForm(false);
            setEditingEgg(null);
          }}
        />
      )}
    </div>
  );
};