import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Baby, Calendar, Scale, Edit3, Trash2 } from 'lucide-react';
import { ChickForm } from './ChickForm';
import { supabase } from '../../lib/supabase';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Chick {
  id: string;
  user_id: string; 
  name?: string;
  hatch_date: string;
  weight?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ChickCardProps extends Chick {
  onEdit: (chick: Chick) => void;
  onDelete: (id: string) => void;
}

const ChickCard: React.FC<ChickCardProps> = ({
  id,
  name,
  hatch_date,
  weight,
  notes,
  onEdit,
  onDelete,
  ...chick
}) => {
  const age = differenceInDays(new Date(), new Date(hatch_date));
  const ageText = age === 0 ? 'Bugün' : age === 1 ? '1 gün' : `${age} gün`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fade-in">
      <div className="relative h-32 bg-gradient-to-br from-yellow-100 to-orange-200">
        <div className="w-full h-full flex items-center justify-center">
          <Baby className="w-8 h-8 text-yellow-600" />
        </div>
        
        {/* Edit Button */}
        <button
          onClick={() => onEdit({ id, name, hatch_date, weight, notes, ...chick })}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <Edit3 className="w-4 h-4 text-neutral-600" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-neutral-800 truncate">{name || 'İsimsiz Yavru'}</h3>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            {ageText}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Çıkım:</span>
            <span className="text-neutral-700 font-medium">
              {format(new Date(hatch_date), 'dd MMM yyyy', { locale: tr })}
            </span>
          </div>
          
          {weight && (
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Ağırlık:</span>
              <span className="text-neutral-700 font-medium">{weight}g</span>
            </div>
          )}
          
          {notes && (
            <div className="text-xs text-neutral-600 truncate">
              <span className="text-neutral-500">Not:</span> {notes}
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-100">
          <button
            onClick={() => onDelete(id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <Trash2 className="w-3 h-3" />
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};

export const ChicksView: React.FC = () => {
  const [chicks, setChicks] = useState<Chick[]>([]);
  const [filteredChicks, setFilteredChicks] = useState<Chick[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChick, setEditingChick] = useState<Chick | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadChicks();
  }, []);

  useEffect(() => {
    filterChicks();
  }, [chicks, searchTerm]);

  const loadChicks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chicks')
        .select('*')
        .eq('user_id', user.id)
        .order('hatch_date', { ascending: false });

      if (error) {
        console.error('Error loading chicks:', error);
        return;
      }

      setChicks(data || []);
    } catch (error) {
      console.error('Error loading chicks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterChicks = useCallback(() => {
    let filtered = chicks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(chick =>
        (chick.name && chick.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (chick.notes && chick.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredChicks(filtered);
  }, [chicks, searchTerm]);

  const handleSaveChick = useCallback((savedChick: Chick) => {
    if (editingChick) {
      setChicks(prev => prev.map(chick => chick.id === savedChick.id ? savedChick : chick));
    } else {
      setChicks(prev => [savedChick, ...prev]);
    }
    setShowForm(false);
    setEditingChick(null);
  }, [editingChick]);

  const handleEditChick = useCallback((chick: Chick) => {
    setEditingChick(chick);
    setShowForm(true);
  }, []);

  const handleDeleteChick = async (id: string) => {
    const confirmed = window.confirm('Bu yavruyu silmek istediğinizden emin misiniz?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('chicks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChicks(prev => prev.filter(chick => chick.id !== id));
      showToast('Yavru silindi', 'success');
    } catch (error: any) {
      console.error('Error deleting chick:', error);
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <h2 className="text-xl font-bold text-neutral-800">Yavrular</h2>
          <p className="text-sm text-neutral-600 mt-1">
            {filteredChicks.length} yavru {chicks.length !== filteredChicks.length && `(${chicks.length} toplam)`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yavru Ekle
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Yavru adı veya notlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Chicks Grid */}
      {filteredChicks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Baby className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            {searchTerm
              ? 'Arama kriterlerinize uygun yavru bulunamadı'
              : 'Henüz yavru eklenmemiş'
            }
          </h3>
          <p className="text-neutral-600 mb-6">
            {searchTerm
              ? 'Farklı arama terimleri deneyebilir veya yeni yavru ekleyebilirsiniz.'
              : 'İlk yavrunuzu ekleyerek başlayın!'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            İlk Yavrumu Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredChicks.map((chick) => (
            <ChickCard
              key={chick.id}
              {...chick}
              onEdit={handleEditChick}
              onDelete={handleDeleteChick}
            />
          ))}
        </div>
      )}

      {/* Chick Form Modal */}
      {showForm && (
        <ChickForm
          chick={editingChick}
          isEditing={!!editingChick}
          onSave={handleSaveChick}
          onCancel={() => {
            setShowForm(false);
            setEditingChick(null);
          }}
          onDelete={handleDeleteChick}
        />
      )}
    </div>
  );
};