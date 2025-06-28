import React from 'react';
import { Database, Bug, Settings, ChevronRight } from 'lucide-react';

interface DiagnosticsSettingsProps {
  onOpenDiagnostics: () => void;
}

export const DiagnosticsSettings: React.FC<DiagnosticsSettingsProps> = ({ onOpenDiagnostics }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Sistem Tanılama</h3>
      
      <div className="space-y-3">
        <button
          onClick={onOpenDiagnostics}
          className="flex items-center justify-between w-full p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-neutral-600" />
            <div className="text-left">
              <p className="font-medium text-neutral-800">Supabase Tanılama</p>
              <p className="text-sm text-neutral-600">Veritabanı bağlantısı ve konfigürasyon kontrolü</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </button>

        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Bug className="w-5 h-5 text-neutral-600" />
            <div>
              <p className="font-medium text-neutral-800">Hata Raporlama</p>
              <p className="text-sm text-neutral-600">Otomatik hata loglama</p>
            </div>
          </div>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600 transition-colors">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-neutral-600" />
            <div>
              <p className="font-medium text-neutral-800">Gelişmiş Tanılama</p>
              <p className="text-sm text-neutral-600">Detaylı sistem bilgileri</p>
            </div>
          </div>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-300 transition-colors">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>İpucu:</strong> Herhangi bir sorunla karşılaştığınızda önce tanılama aracını çalıştırın. 
          Bu araç yaygın sorunları otomatik olarak tespit edip çözüm önerileri sunar.
        </p>
      </div>
    </div>
  );
};