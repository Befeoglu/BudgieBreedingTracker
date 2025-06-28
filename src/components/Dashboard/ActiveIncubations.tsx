import React, { useState, useEffect } from 'react';
import { Calendar, Egg, TrendingUp, Eye, ChevronRight } from 'lucide-react';
import { format, differenceInDays, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';

interface Incubation {
  id: string;
  nest_name: string;
  start_date: string;
  expected_hatch_date: string;
  status: 'active' | 'completed' | 'failed';
}

interface IncubationWithEggCount extends Incubation {
  eggCount: number;
}

interface IncubationCardProps {
  incubation: IncubationWithEggCount;
  onViewDetails: (id: string) => void;
}

const IncubationCard: React.FC<IncubationCardProps> = ({ incubation, onViewDetails }) => {
  const { t } = useTranslation();
  
  // Güvenli tarih işleme
  const isStartValid = isValid(new Date(incubation.start_date));
  const isExpectedValid = isValid(new Date(incubation.expected_hatch_date));
  
  let start = new Date();
  let expected = new Date();
  let today = new Date();
  let totalDays = 0;
  let daysPassed = 0;
  let progress = 0;
  
  if (isStartValid && isExpectedValid) {
    start = new Date(incubation.start_date);
    expected = new Date(incubation.expected_hatch_date);
    today = new Date();
    
    totalDays = differenceInDays(expected, start);
    daysPassed = differenceInDays(today, start);
    progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
  }
  
  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-neutral-200 min-w-[260px] sm:min-w-[280px] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-neutral-800 text-sm sm:text-base truncate pr-2 flex-1">{incubation.nest_name}</h3>
        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
          {isStartValid && isExpectedValid ? `Gün ${daysPassed}/${totalDays}` : 'Aktif'}
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-xs sm:text-sm text-neutral-600 mb-2">
          <span>İlerleme</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <div className="min-w-0">
          <Egg className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 mx-auto mb-1" />
          <div className="text-xs sm:text-sm font-medium text-neutral-800">{incubation.eggCount}</div>
          <div className="text-xs text-neutral-500 leading-tight">Yumurta</div>
        </div>
        <div className="min-w-0">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 mx-auto mb-1" />
          <div className="text-xs sm:text-sm font-medium text-neutral-800">
            {isExpectedValid ? format(expected, 'dd MMM', { locale: tr }) : '??'}
          </div>
          <div className="text-xs text-neutral-500 leading-tight">Tahmini</div>
        </div>
        <div className="min-w-0">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 mx-auto mb-1" />
          <div className="text-xs sm:text-sm font-medium text-neutral-800">
            {daysPassed > 0 ? '18 gün' : '-'}
          </div>
          <div className="text-xs text-neutral-500 leading-tight">Süreç</div>
        </div>
      </div>
      
      <button 
        onClick={() => onViewDetails(incubation.id)}
        className="w-full mt-3 pt-3 border-t border-neutral-100 flex items-center justify-center text-primary-600 hover:text-primary-700 text-xs font-medium gap-1"
      >
        <Eye className="w-3 h-3" />
        Detayları Görüntüle
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export const ActiveIncubations: React.FC = () => {
  const { t } = useTranslation();
  const [activeIncubations, setActiveIncubations] = useState<IncubationWithEggCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveIncubations();
  }, []);

  const loadActiveIncubations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Aktif kuluçkaları getir
      const { data: clutches, error } = await supabase
        .from('clutches')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(3);

      if (error) throw error;

      // Her kuluçka için yumurta sayılarını getir
      if (clutches && clutches.length > 0) {
        const incubationsWithEggCount: IncubationWithEggCount[] = [];
        
        for (const clutch of clutches) {
          const { count } = await supabase
            .from('eggs')
            .select('*', { count: 'exact', head: false })
            .eq('clutch_id', clutch.id);
          
          incubationsWithEggCount.push({
            ...clutch,
            eggCount: count || 0
          });
        }
        
        setActiveIncubations(incubationsWithEggCount);
      }
      
    } catch (error) {
      console.error('Error loading active incubations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id: string) => {
    // Navigate to incubation details
    window.location.hash = 'incubation';
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-800 leading-tight">Aktif Kuluçkalar</h3>
          <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse"></div>
        </div>
        
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-200 rounded-xl h-40 min-w-[260px] sm:min-w-[280px] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-800 leading-tight">Aktif Kuluçkalar</h3>
        <button 
          onClick={() => window.location.hash = 'incubation'}
          className="text-primary-600 hover:text-primary-700 font-medium transition-colors text-sm sm:text-base"
        >
          Tümünü Gör
        </button>
      </div>
      
      {activeIncubations.length === 0 ? (
        <div className="bg-neutral-50 rounded-xl p-5 text-center border border-neutral-200">
          <Egg className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
          <p className="text-neutral-700 font-medium mb-1">Henüz aktif kuluçka yok</p>
          <p className="text-neutral-500 mb-4 text-sm">Üreme takibinize başlamak için yeni bir kuluçka oluşturun</p>
          <button
            onClick={() => window.location.hash = 'incubation'}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Kuluçka Oluştur
          </button>
        </div>
      ) : (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {activeIncubations.map((incubation) => (
            <IncubationCard 
              key={incubation.id} 
              incubation={incubation}
              onViewDetails={handleViewDetails}
            />
          ))}
          
          <div className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl p-3 sm:p-4 min-w-[260px] sm:min-w-[280px] flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
                onClick={() => window.location.hash = 'incubation'}>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl sm:text-2xl text-neutral-400">+</span>
              </div>
              <p className="text-neutral-600 font-medium text-sm sm:text-base leading-tight">Yeni Kuluçka</p>
              <p className="text-xs sm:text-sm text-neutral-500 leading-tight">Başlat</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};