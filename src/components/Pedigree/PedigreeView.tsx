import React, { useState, useEffect } from 'react';
import { Plus, Search, GitBranch, Bird, Users } from 'lucide-react';
import { PedigreeForm } from './PedigreeForm';
import { supabase } from '../../lib/supabase';

interface Bird {
  id: string;
  name: string;
  ring_number: string;
  gender: 'male' | 'female';
  species?: string;
}

interface PedigreeRelation {
  id: string;
  child_id: string;
  parent_id: string;
  relation_type: 'father' | 'mother';
  child: Bird;
  parent: Bird;
}

interface PedigreeTreeProps {
  bird: Bird;
  relations: PedigreeRelation[];
  onAddParent: (childId: string, relationType: 'father' | 'mother') => void;
}

const PedigreeTree: React.FC<PedigreeTreeProps> = ({ bird, relations, onAddParent }) => {
  const father = relations.find(r => r.child_id === bird.id && r.relation_type === 'father')?.parent;
  const mother = relations.find(r => r.child_id === bird.id && r.relation_type === 'mother')?.parent;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">{bird.name}</h3>
        <p className="text-sm text-neutral-600">{bird.ring_number}</p>
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
          bird.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
        }`}>
          {bird.gender === 'male' ? 'Erkek ♂' : 'Dişi ♀'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Father */}
        <div className="text-center">
          <h4 className="text-sm font-medium text-neutral-700 mb-3">Baba</h4>
          {father ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-medium text-blue-800">{father.name}</p>
              <p className="text-xs text-blue-600">{father.ring_number}</p>
            </div>
          ) : (
            <button
              onClick={() => onAddParent(bird.id, 'father')}
              className="w-full bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4 mx-auto mb-1 text-neutral-400" />
              <p className="text-xs text-neutral-500">Baba Ekle</p>
            </button>
          )}
        </div>

        {/* Mother */}
        <div className="text-center">
          <h4 className="text-sm font-medium text-neutral-700 mb-3">Anne</h4>
          {mother ? (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
              <p className="font-medium text-pink-800">{mother.name}</p>
              <p className="text-xs text-pink-600">{mother.ring_number}</p>
            </div>
          ) : (
            <button
              onClick={() => onAddParent(bird.id, 'mother')}
              className="w-full bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-lg p-3 hover:border-pink-300 hover:bg-pink-50 transition-colors"
            >
              <Plus className="w-4 h-4 mx-auto mb-1 text-neutral-400" />
              <p className="text-xs text-neutral-500">Anne Ekle</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const PedigreeView: React.FC = () => {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [relations, setRelations] = useState<PedigreeRelation[]>([]);
  const [filteredBirds, setFilteredBirds] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedRelationType, setSelectedRelationType] = useState<'father' | 'mother'>('father');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterBirds();
  }, [birds, searchTerm]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load birds
      const { data: birdsData, error: birdsError } = await supabase
        .from('birds')
        .select('id, name, ring_number, gender, species')
        .eq('user_id', user.id)
        .order('name');

      if (birdsError) throw birdsError;

      // Load pedigree relations
      const { data: relationsData, error: relationsError } = await supabase
        .from('pedigree')
        .select(`
          id,
          child_id,
          parent_id,
          relation_type,
          child:birds!pedigree_child_id_fkey(id, name, ring_number, gender, species),
          parent:birds!pedigree_parent_id_fkey(id, name, ring_number, gender, species)
        `);

      if (relationsError) throw relationsError;

      setBirds(birdsData || []);
      setRelations(relationsData || []);
    } catch (error) {
      console.error('Error loading pedigree data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBirds = () => {
    let filtered = birds;

    if (searchTerm) {
      filtered = filtered.filter(bird =>
        bird.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bird.ring_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBirds(filtered);
  };

  const handleAddParent = (childId: string, relationType: 'father' | 'mother') => {
    setSelectedChild(childId);
    setSelectedRelationType(relationType);
    setShowForm(true);
  };

  const handleSaveRelation = (relation: PedigreeRelation) => {
    setRelations(prev => [...prev, relation]);
    setShowForm(false);
    setSelectedChild('');
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
          <h2 className="text-xl font-bold text-neutral-800">Soy Ağacı</h2>
          <p className="text-sm text-neutral-600 mt-1">
            {filteredBirds.length} kuş {birds.length !== filteredBirds.length && `(${birds.length} toplam)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Users className="w-4 h-4" />
            <span>{relations.length} ilişki</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Kuş adı veya ring numarası ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Pedigree Trees */}
      {filteredBirds.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-12 h-12 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            {searchTerm
              ? 'Arama kriterlerinize uygun kuş bulunamadı'
              : 'Henüz kuş eklenmemiş'
            }
          </h3>
          <p className="text-neutral-600 mb-6">
            {searchTerm
              ? 'Farklı arama terimleri deneyebilirsiniz.'
              : 'Soy ağacı oluşturmak için önce kuş eklemelisiniz.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBirds.map((bird) => (
            <PedigreeTree
              key={bird.id}
              bird={bird}
              relations={relations}
              onAddParent={handleAddParent}
            />
          ))}
        </div>
      )}

      {/* Pedigree Form Modal */}
      {showForm && (
        <PedigreeForm
          childId={selectedChild}
          relationType={selectedRelationType}
          birds={birds}
          existingRelations={relations}
          onSave={handleSaveRelation}
          onCancel={() => {
            setShowForm(false);
            setSelectedChild('');
          }}
        />
      )}
    </div>
  );
};