import React from 'react';
import { Bird, Users, TrendingUp, Target } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const BirdStats: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-800 leading-tight">Kuşlarım</h3>
        <button 
          onClick={() => window.location.hash = 'birds'}
          className="text-primary-600 hover:text-primary-700 font-medium transition-colors text-sm sm:text-base"
        >
          Tümünü Gör
        </button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Bird className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-800 mb-1">12</h3>
            <p className="text-sm font-medium text-neutral-700 mb-1">Toplam Kuş</p>
            <p className="text-xs text-neutral-500">6 erkek, 6 dişi</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-secondary-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-800 mb-1">3</h3>
            <p className="text-sm font-medium text-neutral-700 mb-1">Aktif Çift</p>
            <p className="text-xs text-neutral-500">Üreme sezonu</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-800 mb-1">8</h3>
            <p className="text-sm font-medium text-neutral-700 mb-1">Bu Ay Doğan</p>
            <p className="text-xs text-neutral-500">Yeni yavrular</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-800 mb-1">87%</h3>
            <p className="text-sm font-medium text-neutral-700 mb-1">Başarı Oranı</p>
            <p className="text-xs text-neutral-500">Son 3 ay</p>
          </div>
        </div>
      </div>
    </div>
  );
};