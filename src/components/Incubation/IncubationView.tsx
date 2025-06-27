import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Egg, TrendingUp, Edit3, Trash2, Eye } from 'lucide-react';
import { IncubationForm } from './IncubationForm';
import { supabase } from '../../lib/supabase';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

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

interface IncubationCardProps extends Incubation {
  onEdit: (incubation: Incubation) => void;
  onDelete: (id: string) => void;
  onView: (incubation: Incubation) => void;
}

const IncubationCard: React.FC<IncubationCardProps> = ({
  id,
  nest_name,
  start_date,
  expected_hatch_date,
  egg_count = 0,
  success_rate = 0,
  status,
  onEdit,
  onDelete,
  onView,
  ...incubation
}) => {
  const start = new Date(start_date);
  const expected = new Date(expected_hatch_date);
  const today = new Date();
  
  const totalDays = differenceInDays(expected, start);
  const daysPassed = differenceInDays(today, start);
  const progress = Math.min((daysPassed / totalDays) * 100, 100);

  const statusColors = {
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700'
  };

  const statusTexts = {
    active: 'Aktif',
    completed: 'Tamamlandı',
    failed: 'Başarısız'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-300 animate-fade-in">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-neutral-800 text-lg mb-2 truncate">{nest_name}</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
              {statusTexts[status]}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
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

        {status === 'active' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-neutral-600 mb-2">
              <span>İlerleme</span>
              <span>{Math.round(progress)}% (Gün {daysPassed}/{totalDays})</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <Egg className="w-4 h-4 text-neutral-500 mx-auto mb-1" />
            <div className="text-sm font-medium text-neutral-800">{egg_count}</div>
            <div className="text-xs text-neutral-500">Yumurta</div>
          </div>
          <div>
            <Calendar className="w-4 h-4 text-neutral-500 mx-auto mb-1" />
            <div className="text-sm font-medium text-neutral-800">
              {format(expected, 'dd MMM', { locale: tr })}
            </div>
            <div className="text-xs text-neutral-500">Tahmini</div>
          </div>
          <div>
            <TrendingUp className="w-4 h-4 text-neutral-500 mx-auto mb-1" />
            <div className="text-sm font-medium text-neutral-800">{success_rate}%</div>
            <div className="text-xs text-neutral-500">Başarı</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const IncubationView: React.FC = () => {
  const [incubations, setIncubations] = useState<Incubation[]>([]);
  const [filteredIncubations, setFilteredIncubations] = useState<Incubation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncubation, setEditingIncubation] = useState<Incubation | null>(null);
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

      // Transform clutches data to incubation format
      const transformedData = (data || []).map(clutch => ({
        ...clutch,
        nest_name: clutch.nest_name,
        egg_count: 0, // Will be populated from eggs table
        success_rate: 85, // Mock data
        status: 'active' as const // Mock data
      }));

      setIncubations(transformedData);
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

  const handleDeleteIncubation = async (id: string) => {
    const confirmed = window.confirm('Bu kuluçkayı silmek istediğinizden emin misiniz?');
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

  const handleViewIncubation = (incubation: Incubation) => {
    // Navigate to detailed view - for now just show alert
    alert(`${incubation.nest_name} detayları görüntüleniyor...`);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-800">Kuluçka Takibi</h2>
          <p className="text-sm text-neutral-600 mt-1">
            {filteredIncubations.length} kuluçka {incubations.length !== filteredIncubations.length && `(${incubations.length} toplam)`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Kuluçka Ekle
        </button>
      </div>

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
            <Egg className="w-12 h-12 text-neutral-400" />
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
              : 'İlk kuluçkanızı ekleyerek başlayın!'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            İlk Kuluçkamı Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncubations.map((incubation) => (
            <IncubationCard
              key={incubation.id}
              {...incubation}
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
    </div>
  );
};