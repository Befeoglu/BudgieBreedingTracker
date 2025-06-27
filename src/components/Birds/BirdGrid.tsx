import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Heart, Camera, Edit3, Star, Trash2 } from 'lucide-react';
import { BirdForm } from './BirdForm';
import { supabase } from '../../lib/supabase';
import { format, differenceInMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Bird } from '../../types';

interface BirdCardProps extends Bird {
  onEdit: (bird: Bird) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

const BirdCard: React.FC<BirdCardProps> = ({
  id,
  name,
  species,
  gender,
  birth_date,
  ring_number,
  color_mutation,
  photo_url,
  is_favorite,
  onEdit,
  onDelete,
  onToggleFavorite,
  ...bird
}) => {
  const genderColor = gender === 'male' ? 'text-blue-600' : 'text-pink-600';
  const genderSymbol = gender === 'male' ? '♂' : '♀';
  const age = differenceInMonths(new Date(), new Date(birth_date || ''));
  const ageText = age < 12 ? `${age} ay` : `${Math.floor(age / 12)} yaş`;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(id, !is_favorite);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fade-in">
      <div className="relative h-28 sm:h-32 bg-gradient-to-br from-primary-100 to-primary-200">
        {photo_url ? (
          <img src={photo_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
          </div>
        )}
        
        {/* Favorite Star */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 left-2 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          {is_favorite ? (
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
          ) : (
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-400" />
          )}
        </button>

        {/* Edit Button */}
        <button
          onClick={() => onEdit({ id, name, species, gender, birth_date, ring_number, color_mutation, photo_url, is_favorite, ...bird })}
          className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-600" />
        </button>
      </div>
      
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-neutral-800 truncate text-sm sm:text-base pr-2 flex-1">{name}</h3>
          <span className={`text-base sm:text-lg font-bold ${genderColor} flex-shrink-0`}>{genderSymbol}</span>
        </div>
        
        <p className="text-xs sm:text-sm text-neutral-600 mb-3 truncate">{species}</p>
        
        <div className="space-y-1 sm:space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Yaş:</span>
            <span className="text-neutral-700 font-medium">{ageText}</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Ring:</span>
            <span className="text-neutral-700 font-medium truncate ml-2 max-w-[60%]">{ring_number}</span>
          </div>
          
          {color_mutation && (
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Renk:</span>
              <span className="text-neutral-700 font-medium truncate ml-2 max-w-[60%]">{color_mutation}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const BirdGrid: React.FC = () => {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [filteredBirds, setFilteredBirds] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBird, setEditingBird] = useState<Bird | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedBirds, setSelectedBirds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBirds();
  }, []);

  useEffect(() => {
    filterBirds();
  }, [birds, searchTerm, filterGender, filterSpecies, showFavoritesOnly]);

  const loadBirds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('birds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading birds:', error);
        return;
      }

      setBirds(data || []);
    } catch (error) {
      console.error('Error loading birds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBirds = () => {
    let filtered = birds;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(bird =>
        bird.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bird.ring_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bird.species && bird.species.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Gender filter
    if (filterGender !== 'all') {
      filtered = filtered.filter(bird => bird.gender === filterGender);
    }

    // Species filter
    if (filterSpecies !== 'all') {
      filtered = filtered.filter(bird => bird.species === filterSpecies);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(bird => bird.is_favorite);
    }

    setFilteredBirds(filtered);
  };

  const handleSaveBird = (savedBird: Bird) => {
    if (editingBird) {
      setBirds(prev => prev.map(bird => bird.id === savedBird.id ? savedBird : bird));
    } else {
      setBirds(prev => [savedBird, ...prev]);
    }
    setShowForm(false);
    setEditingBird(null);
  };

  const handleEditBird = (bird: Bird) => {
    setEditingBird(bird);
    setShowForm(true);
  };

  const handleDeleteBird = (id: string) => {
    setBirds(prev => prev.filter(bird => bird.id !== id));
    setShowForm(false);
    setEditingBird(null);
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('birds')
        .update({ is_favorite: isFavorite })
        .eq('id', id);

      if (error) throw error;

      setBirds(prev => prev.map(bird => 
        bird.id === id ? { ...bird, is_favorite: isFavorite } : bird
      ));

    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBirds.size === 0) return;

    const confirmed = window.confirm(`${selectedBirds.size} kuşu silmek istediğinizden emin misiniz?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('birds')
        .delete()
        .in('id', Array.from(selectedBirds));

      if (error) throw error;

      setBirds(prev => prev.filter(bird => !selectedBirds.has(bird.id)));
      setSelectedBirds(new Set());
      setBulkSelectMode(false);

      showToast(`${selectedBirds.size} kuş silindi`, 'success');

    } catch (error) {
      console.error('Error bulk deleting birds:', error);
      showToast('Silme işlemi başarısız', 'error');
    }
  };

  const toggleBirdSelection = (id: string) => {
    const newSelected = new Set(selectedBirds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBirds(newSelected);
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

  const uniqueSpecies = Array.from(new Set(birds.map(bird => bird.species).filter(Boolean)));

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 sm:h-8 bg-neutral-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-neutral-200 rounded-xl h-56 sm:h-64"></div>
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
          <h2 className="text-lg sm:text-xl font-bold text-neutral-800 leading-tight">Kuşlarım</h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-tight">
            {filteredBirds.length} kuş {birds.length !== filteredBirds.length && `(${birds.length} toplam)`}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {bulkSelectMode && selectedBirds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Sil ({selectedBirds.size})
            </button>
          )}
          
          <button
            onClick={() => setBulkSelectMode(!bulkSelectMode)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              bulkSelectMode 
                ? 'bg-neutral-200 text-neutral-700' 
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {bulkSelectMode ? 'İptal' : 'Çoklu Seç'}
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Kuş Ekle</span>
            <span className="sm:hidden">Ekle</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-3 sm:p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Kuş adı, ring numarası ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
            />
          </div>

          {/* Gender Filter */}
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
          >
            <option value="all">Tüm Cinsiyetler</option>
            <option value="male">Erkek</option>
            <option value="female">Dişi</option>
          </select>

          {/* Species Filter */}
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
          >
            <option value="all">Tüm Türler</option>
            {uniqueSpecies.map(species => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>

          {/* Favorites Toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              showFavoritesOnly
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Favoriler</span>
            <span className="sm:hidden">♥</span>
          </button>
        </div>
      </div>

      {/* Birds Grid */}
      {filteredBirds.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-neutral-800 mb-2 leading-tight">
            {searchTerm || filterGender !== 'all' || filterSpecies !== 'all' || showFavoritesOnly
              ? 'Arama kriterlerinize uygun kuş bulunamadı'
              : 'Henüz kuş eklenmemiş'
            }
          </h3>
          <p className="text-neutral-600 mb-6 text-sm sm:text-base leading-relaxed px-4">
            {searchTerm || filterGender !== 'all' || filterSpecies !== 'all' || showFavoritesOnly
              ? 'Farklı filtreler deneyebilir veya yeni kuş ekleyebilirsiniz.'
              : 'İlk kuşunuzu ekleyerek başlayın!'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            İlk Kuşumu Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredBirds.map((bird) => (
            <div key={bird.id} className="relative">
              {bulkSelectMode && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedBirds.has(bird.id)}
                    onChange={() => toggleBirdSelection(bird.id)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 bg-white border-2 border-white rounded focus:ring-primary-500"
                  />
                </div>
              )}
              <BirdCard
                {...bird}
                onEdit={handleEditBird}
                onDelete={handleDeleteBird}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bird Form Modal */}
      {showForm && (
        <BirdForm
          bird={editingBird}
          isEditing={!!editingBird}
          onSave={handleSaveBird}
          onCancel={() => {
            setShowForm(false);
            setEditingBird(null);
          }}
          onDelete={handleDeleteBird}
        />
      )}
    </div>
  );
};