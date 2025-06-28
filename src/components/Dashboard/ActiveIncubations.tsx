import React from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export const ActiveIncubations: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-800 leading-tight">Bildirimler ve Öneriler</h3>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-800/40">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-lg mb-2">
              Kuluçka Takibi Güncellendi!
            </h4>
            <p className="text-blue-700 dark:text-blue-400 leading-relaxed mb-4">
              Kuluçka takip sistemimiz tamamen yenileniyor. Yakında yeni, daha gelişmiş özellikleriyle kullanıma sunulacaktır.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg flex-1 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h5 className="font-medium text-neutral-800 dark:text-neutral-200">Üretim İstatistikleri</h5>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Detaylı başarı oranları, yumurta performansı ve üreme istatistikleri için İstatistikler sayfasını ziyaret edin.
                </p>
              </div>
              
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg flex-1 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h5 className="font-medium text-neutral-800 dark:text-neutral-200">Yavru Gelişimi</h5>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Yumurtadan çıkan yavrularınızı 'Yavrular' sekmesinden takip edebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};