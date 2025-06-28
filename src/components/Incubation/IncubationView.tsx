import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Egg, TrendingUp, Edit3, Trash2, Eye, Heart } from 'lucide-react';
import { IncubationForm } from './IncubationForm';
import { IncubationDetailView } from './IncubationDetailView';
import { supabase } from '../../lib/supabase';
import { format, differenceInDays, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';

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

interface IncubationCardProps extends Incubation {
  eggCount: number;
  onEdit: (incubation: Incubation) => void;
  onDelete: (id: string) => void;
  onView: (incubation: Incubation) => void;
}

const IncubationCard: React.FC<IncubationCardProps> = ({
  id,
  nest_name,
  start_date,
  expected_hatch_date,
  status,
  eggCount,
  onEdit,
  onDelete,
  onView,
  ...incubation
}) => {
  // Güvenli tarih işleme
  const isStartValid = isValid(new Date(start_date));
  const isExpectedValid = isValid(new Date(expected_hatch_date));
  
  let start = new Date();
  let expected = new Date();
  let today = new Date();
  let totalDays = 0;
  let daysPassed = 0;
  let daysRemaining = 0;
  let progress = 0;
  
  if (isStartValid && isExpectedValid) {
    start = new Date(start_date);
    expected = new Date(expected_hatch_date);
    today = new Date();
    
    totalDays = differenceInDays(expected, start);
    daysPassed = differenceInDays(today, start);
    daysRemaining = differenceInDays(expected, today);
    progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
  }

  const statusColors = {
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200'
  };

  const statusTexts = {
    active: 'Aktif',
    completed: 'Tamamlandı',
    failed: 'Başarısız'
  };

  const getStatusMessage = () => {
    if (status !== 'active') return statusTexts[status];
    
    if (!isStartValid || !isExpectedValid) return 'Tarih Hatası';
    
    if (daysRemaining > 0) {
      return `${daysRemaining} gün kaldı`;
    } else if (daysRemaining === 0) {
      return 'Bugün çıkabilir! 🎉';
    } else {
      return `${Math.abs(daysRemaining)} gün gecikme`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-300 animate-fade-in group">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-neutral-800 text-lg mb-2 truncate flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500 flex-shrink-0" />
              {nest_name}
            </h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusColors[status]}`}>
              {getStatusMessage()}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onView(incubation as Incubation)}
              className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Detayları Görüntüle"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(incubation as Incubation)}
              className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Düzenle"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* İlerleme Çubuğu (sadece aktif kuluçkalar için) */}
        {status === 'active' && isStartValid && isExpectedValid && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-neutral-600 mb-2">
              <span>İlerleme</span>
              <span>{Math.round(progress)}% (Gün {daysPassed}/{totalDays})</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  progress >= 90 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  progress >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-primary-500 to-primary-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Kritik noktalar */}
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Başlangıç</span>
              <span>16. gün</span>
              <span>Çıkım</span>
            </div>
          </div>
        )}

        {/* Tarih ve Yumurta Bilgileri */}
        <div className="grid grid-cols-3 gap-4 text-center border-t border-neutral-100 pt-4">
          <div>
            <Calendar className="w-4 h-4 text-neutral-500 mx-auto mb-1" />
            <div className="text-sm font-medium text-neutral-800">
              {isStartValid ? format(start, 'dd MMM', { locale: tr }) : '??'}
            </div>
            <div className="text-xs text-neutral-500">Başlangıç</div>
          </div>
          <div>
            <Egg className="w-4 h-4 text-neutral-500 mx-auto mb-1" />
            <div className="text-sm font-medium text-neutral-800">{eggCount}</div>
            <div className="text-xs text-neutral-500">Yumurta</div>
          </div>
          <div>
            <TrendingUp className="w-4 h-4 text-neutral-500 mx-auto mb-1" />
            <div className="text-sm font-medium text-neutral-800">
              {isExpectedValid ? format(expected, 'dd MMM', { locale: tr }) : '??'}
            </div>
            <div className="text-xs text-neutral-500">Tahmini</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const IncubationView: React.FC = () => {
  const [incubations, setIncubations] = useState<Incubation[]>([]);
  const [filteredIncubations, setFilteredIncubations] = useState<Incubation[]>([]);
  const [eggCounts, setEggCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncubation, setEditingIncubation] = useState<Incubation | null>(null);
  const [viewingIncubation, setViewingIncubation] = useState<Incubation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  useEffect(() => {
    loadIncubations();
  }, []);

  useEffect(() => {
    filterIncubations();
  }, [incubations, searchTerm, filterStatus]);

  const loadIncubations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('clutches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading incubations:', error);
        return;
      }

      setIncubations(data || []);
      
      // Load egg counts for each incubation using correct column name
      if (data && data.length > 0) {
        const incubationIds = data.map(inc => inc.id);
        const { data: eggData } = await supabase
          .from('eggs')
          .select('clutch_id')
          .in('clutch_id', incubationIds);

        if (eggData) {
          const counts: Record<string, number> = {};
          eggData.forEach(egg => {
            counts[egg.clutch_id] = (counts[egg.clutch_id] || 0) + 1;
          });
          setEggCounts(counts);
        }
      }
    } catch (error) {
      console.error('Error loading incubations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIncubations = () => {
    let filtered = incubations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(incubation =>
        incubation.nest_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(incubation => incubation.status === filterStatus);
    }

    setFilteredIncubations(filtered);
  };

  const handleSaveIncubation = (savedIncubation: Incubation) => {
    if (editingIncubation) {
      setIncubations(prev => prev.map(inc => inc.id === savedIncubation.id ? savedIncubation : inc));
    } else {
      setIncubations(prev => [savedIncubation, ...prev]);
    }
    setShowForm(false);
    setEditingIncubation(null);
  };

  const handleEditIncubation = (incubation: Incubation) => {
    setEditingIncubation(incubation);
    setShowForm(true);
  };

  const handleViewIncubation = (incubation: Incubation) => {
    setViewingIncubation(incubation);
  };

  const handleDeleteIncubation = async (id: string) => {
    // Ensure we have a valid ID before attempting delete
    if (!id) {
      console.error('Cannot delete incubation with undefined ID');
      showToast('Silme işlemi başarısız: Geçersiz ID', 'error');
      return;
    }
    
    const incubation = incubations.find(inc => inc.id === id);
    const confirmed = window.confirm(`"${incubation?.nest_name || 'Bu kuluçkayı'}" silmek istediğinizden emin misiniz?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('clutches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIncubations(prev => prev.filter(inc => inc.id !== id));
      showToast('Kuluçka silindi', 'success');
    } catch (error: any) {
      console.error('Error deleting incubation:', error);
      showToast('Silme işlemi başarısız', 'error');
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

  // İstatistikler
  const activeCount = incubations.filter(inc => inc.status === 'active').length;
  const completedCount = incubations.filter(inc => inc.status === 'completed').length;
  const totalCount = incubations.length;
  const totalEggs = Object.values(eggCounts).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-neutral-200 rounded-xl h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 leading-tight">Kuluçka Takibi</h2>
          <div className="flex items-center gap-4 text-sm text-neutral-600 mt-1">
            <span>{filteredIncubations.length} kuluçka {totalCount !== filteredIncubations.length && `(${totalCount} toplam)`}</span>
            <span>•</span>
            <span className="text-blue-600 font-medium">{activeCount} aktif</span>
            <span>•</span>
            <span className="text-neutral-600 font-medium">{totalEggs} yumurta</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Yeni Kuluçka
        </button>
      </div>

      {/* Quick Stats */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
            <div className="text-sm text-blue-700">Aktif Kuluçka</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-green-700">Tamamlanan</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{totalEggs}</div>
            <div className="text-sm text-yellow-700">Toplam Yumurta</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-neutral-600">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </div>
            <div className="text-sm text-neutral-700">Başarı Oranı</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Kuluçka adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="completed">Tamamlandı</option>
            <option value="failed">Başarısız</option>
          </select>
        </div>
      </div>

      {/* Incubations Grid */}
      {filteredIncubations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            {searchTerm || filterStatus !== 'all'
              ? 'Arama kriterlerinize uygun kuluçka bulunamadı'
              : 'Henüz kuluçka eklenmemiş'
            }
          </h3>
          <p className="text-neutral-600 mb-6">
            {searchTerm || filterStatus !== 'all'
              ? 'Farklı filtreler deneyebilir veya yeni kuluçka ekleyebilirsiniz.'
              : 'İlk kuluçkanızı ekleyerek üreme takibinize başlayın!'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            İlk Kuluçkamı Başlat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncubations.map((incubation) => (
            <IncubationCard
              key={incubation.id}
              {...incubation}
              eggCount={eggCounts[incubation.id] || 0}
              onEdit={handleEditIncubation}
              onDelete={handleDeleteIncubation}
              onView={handleViewIncubation}
            />
          ))}
        </div>
      )}

      {/* Incubation Form Modal */}
      {showForm && (
        <IncubationForm
          incubation={editingIncubation}
          isEditing={!!editingIncubation}
          onSave={handleSaveIncubation}
          onCancel={() => {
            setShowForm(false);
            setEditingIncubation(null);
          }}
          onDelete={handleDeleteIncubation}
        />
      )}

      {/* Incubation Detail View */}
      {viewingIncubation && (
        <IncubationDetailView
          incubation={viewingIncubation}
          onClose={() => setViewingIncubation(null)}
          onUpdate={(updatedIncubation) => {
            setIncubations(prev => prev.map(inc => inc.id === updatedIncubation.id ? updatedIncubation : inc));
            setViewingIncubation(updatedIncubation);
          }}
          onDelete={(id) => {
            handleDeleteIncubation(id);
            setViewingIncubation(null);
          }}
        />
      )}
    </div>
  );
};