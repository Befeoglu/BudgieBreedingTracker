import React, { useState } from 'react';
import { X, Save, Users } from 'lucide-react';
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

interface PedigreeFormProps {
  childId: string;
  relationType: 'father' | 'mother';
  birds: Bird[];
  existingRelations: PedigreeRelation[];
  onSave: (relation: PedigreeRelation) => void;
  onCancel: () => void;
}

export const PedigreeForm: React.FC<PedigreeFormProps> = ({
  childId,
  relationType,
  birds,
  existingRelations,
  onSave,
  onCancel
}) => {
  const [selectedParentId, setSelectedParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const child = birds.find(b => b.id === childId);
  const requiredGender = relationType === 'father' ? 'male' : 'female';
  
  // Filter available parents
  const availableParents = birds.filter(bird => {
    // Must be correct gender
    if (bird.gender !== requiredGender) return false;
    
    // Cannot be the child itself
    if (bird.id === childId) return false;
    
    // Cannot already be assigned as this relation type
    const existingRelation = existingRelations.find(
      r => r.child_id === childId && r.relation_type === relationType
    );
    if (existingRelation) return false;
    
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedParentId) {
      setError('Lütfen bir ebeveyn seçin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: insertError } = await supabase
        .from('pedigree')
        .insert({
          child_id: childId,
          parent_id: selectedParentId,
          relation_type: relationType
        })
        .select(`
          id,
          child_id,
          parent_id,
          relation_type,
          child:birds!pedigree_child_id_fkey(id, name, ring_number, gender, species),
          parent:birds!pedigree_parent_id_fkey(id, name, ring_number, gender, species)
        `)
        .single();

      if (insertError) throw insertError;

      onSave(data);
      showToast(`${relationType === 'father' ? 'Baba' : 'Anne'} ilişkisi eklendi`, 'success');

    } catch (error: any) {
      console.error('Error saving pedigree relation:', error);
      setError(error.message || 'Bir hata oluştu');
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
            <h2 className="text-xl font-bold text-neutral-800">
              {relationType === 'father' ? 'Baba' : 'Anne'} Ekle
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {child && (
            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-800">{child.name}</p>
                  <p className="text-sm text-neutral-600">{child.ring_number}</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mt-2">
                için {relationType === 'father' ? 'baba' : 'anne'} seçin
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-3">
                {relationType === 'father' ? 'Baba' : 'Anne'} Seçin
              </label>
              
              {availableParents.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Uygun {relationType === 'father' ? 'erkek' : 'dişi'} kuş bulunamadı</p>
                  <p className="text-sm mt-2">
                    Önce {relationType === 'father' ? 'erkek' : 'dişi'} kuş eklemelisiniz
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableParents.map((bird) => (
                    <label
                      key={bird.id}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedParentId === bird.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="parent"
                        value={bird.id}
                        checked={selectedParentId === bird.id}
                        onChange={(e) => setSelectedParentId(e.target.value)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-neutral-800">{bird.name}</p>
                        <p className="text-sm text-neutral-600">{bird.ring_number}</p>
                        {bird.species && (
                          <p className="text-xs text-neutral-500">{bird.species}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bird.gender === 'male' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-pink-100 text-pink-700'
                      }`}>
                        {bird.gender === 'male' ? '♂' : '♀'}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || !selectedParentId || availableParents.length === 0}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Kaydet
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-bold hover:bg-neutral-200 focus:ring-4 focus:ring-neutral-200 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
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