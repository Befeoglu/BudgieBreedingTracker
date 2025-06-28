import React from 'react';
import { Calendar, Egg, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface IncubationCardProps {
  id: string;
  startDate: string;
  expectedHatchDate: string;
  eggCount: number;
  successRate: number;
  birdNames: string;
}

const IncubationCard: React.FC<IncubationCardProps> = ({
  startDate,
  expectedHatchDate,
  eggCount,
  successRate,
  birdNames
}) => {
  const start = new Date(startDate);
  const expected = new Date(expectedHatchDate);
  const today = new Date();
  
  const totalDays = differenceInDays(expected, start);
  const daysPassed = differenceInDays(today, start);
  const progress = Math.min((daysPassed / totalDays) * 100, 100);
  
  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-neutral-200 min-w-[260px] sm:min-w-[280px] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-neutral-800 text-sm sm:text-base truncate pr-2 flex-1">{birdNames}</h3>
        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
          Gün {daysPassed}/{totalDays}
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
          <div className="text-xs sm:text-sm font-medium text-neutral-800">{eggCount}</div>
          <div className="text-xs text-neutral-500 leading-tight">Yumurta</div>
        </div>
        <div className="min-w-0">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 mx-auto mb-1" />
          <div className="text-xs sm:text-sm font-medium text-neutral-800">
            {format(expected, 'dd MMM', { locale: tr })}
          </div>
          <div className="text-xs text-neutral-500 leading-tight">Tahmini</div>
        </div>
        <div className="min-w-0">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500 mx-auto mb-1" />
          <div className="text-xs sm:text-sm font-medium text-neutral-800">{successRate}%</div>
          <div className="text-xs text-neutral-500 leading-tight">Başarı</div>
        </div>
      </div>
    </div>
  );
};

export const ActiveIncubations: React.FC = () => {
  // Mock data - will be replaced with real data
  const activeIncubations = [
    {
      id: '1',
      startDate: '2024-01-15',
      expectedHatchDate: '2024-02-04',
      eggCount: 6,
      successRate: 85,
      birdNames: 'Luna & Apollo'
    },
    {
      id: '2',
      startDate: '2024-01-18',
      expectedHatchDate: '2024-02-07',
      eggCount: 4,
      successRate: 75,
      birdNames: 'Bella & Max'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-800 leading-tight">Aktif Kuluçkalar</h3>
        <button className="text-primary-600 hover:text-primary-700 font-medium transition-colors text-sm sm:text-base">
          Tümünü Gör
        </button>
      </div>
      
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {activeIncubations.map((incubation) => (
          <IncubationCard key={incubation.id} {...incubation} />
        ))}
        
        <div className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl p-3 sm:p-4 min-w-[260px] sm:min-w-[280px] flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl sm:text-2xl text-neutral-400">+</span>
            </div>
            <p className="text-neutral-600 font-medium text-sm sm:text-base leading-tight">Yeni Kuluçka</p>
            <p className="text-xs sm:text-sm text-neutral-500 leading-tight">Başlat</p>
          </div>
        </div>
      </div>
    </div>
  );
};