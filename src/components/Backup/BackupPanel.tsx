import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  Calendar,
  Database,
  Settings,
  FileText,
  Cloud
} from 'lucide-react';
import { backupService, BackupData } from '../../services/backupService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface BackupPanelProps {
  language: 'tr' | 'en';
  theme: 'light' | 'dark';
}

export const BackupPanel: React.FC<BackupPanelProps> = ({ language, theme }) => {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState(24);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [conflictResolution, setConflictResolution] = useState<'local_wins' | 'remote_wins' | 'merge'>('remote_wins');

  const texts = {
    tr: {
      title: 'Yedekleme & Geri Yükleme',
      manualBackup: 'Manuel Yedekleme',
      autoBackup: 'Otomatik Yedekleme',
      backupNow: 'Şimdi Yedekle',
      restore: 'Geri Yükle',
      export: 'JSON İndir',
      backupHistory: 'Yedekleme Geçmişi',
      noBackups: 'Henüz yedekleme yapılmamış',
      backupType: 'Tür',
      backupDate: 'Tarih',
      recordCount: 'Kayıt Sayısı',
      size: 'Boyut',
      status: 'Durum',
      actions: 'İşlemler',
      automatic: 'Otomatik',
      manual: 'Manuel',
      completed: 'Tamamlandı',
      failed: 'Başarısız',
      pending: 'Bekliyor',
      enableAutoBackup: 'Otomatik yedeklemeyi etkinleştir',
      backupInterval: 'Yedekleme aralığı',
      hourly: 'Saatlik',
      daily: 'Günlük',
      weekly: 'Haftalık',
      backupInProgress: 'Yedekleme devam ediyor...',
      restoreInProgress: 'Geri yükleme devam ediyor...',
      backupSuccess: 'Yedekleme başarıyla tamamlandı',
      backupFailed: 'Yedekleme başarısız oldu',
      restoreSuccess: 'Geri yükleme başarıyla tamamlandı',
      restoreFailed: 'Geri yükleme başarısız oldu',
      confirmRestore: 'Geri Yükleme Onayı',
      restoreWarning: 'Bu işlem mevcut verilerinizi değiştirebilir. Devam etmek istediğinizden emin misiniz?',
      conflictResolution: 'Çakışma Çözümü',
      localWins: 'Yerel Veri Kazansın',
      remoteWins: 'Yedek Veri Kazansın',
      merge: 'Birleştir',
      cancel: 'İptal',
      confirm: 'Onayla',
      backupDetails: 'Yedek Detayları',
      totalRecords: 'Toplam Kayıt',
      users: 'Kullanıcılar',
      birds: 'Kuşlar',
      incubations: 'Kuluçkalar',
      eggs: 'Yumurtalar',
      chicks: 'Yavrular',
      dailyLogs: 'Günlük Kayıtlar'
    },
    en: {
      title: 'Backup & Restore',
      manualBackup: 'Manual Backup',
      autoBackup: 'Automatic Backup',
      backupNow: 'Backup Now',
      restore: 'Restore',
      export: 'Download JSON',
      backupHistory: 'Backup History',
      noBackups: 'No backups created yet',
      backupType: 'Type',
      backupDate: 'Date',
      recordCount: 'Record Count',
      size: 'Size',
      status: 'Status',
      actions: 'Actions',
      automatic: 'Automatic',
      manual: 'Manual',
      completed: 'Completed',
      failed: 'Failed',
      pending: 'Pending',
      enableAutoBackup: 'Enable automatic backup',
      backupInterval: 'Backup interval',
      hourly: 'Hourly',
      daily: 'Daily',
      weekly: 'Weekly',
      backupInProgress: 'Backup in progress...',
      restoreInProgress: 'Restore in progress...',
      backupSuccess: 'Backup completed successfully',
      backupFailed: 'Backup failed',
      restoreSuccess: 'Restore completed successfully',
      restoreFailed: 'Restore failed',
      confirmRestore: 'Confirm Restore',
      restoreWarning: 'This operation may modify your current data. Are you sure you want to continue?',
      conflictResolution: 'Conflict Resolution',
      localWins: 'Local Data Wins',
      remoteWins: 'Backup Data Wins',
      merge: 'Merge',
      cancel: 'Cancel',
      confirm: 'Confirm',
      backupDetails: 'Backup Details',
      totalRecords: 'Total Records',
      users: 'Users',
      birds: 'Birds',
      incubations: 'Incubations',
      eggs: 'Eggs',
      chicks: 'Chicks',
      dailyLogs: 'Daily Logs'
    }
  };

  const t = texts[language];

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    const result = await backupService.getBackups();
    if (result.success && result.backups) {
      setBackups(result.backups);
    }
    setLoading(false);
  };

  const handleManualBackup = async () => {
    setBackupInProgress(true);
    const result = await backupService.createBackup('manual');
    setBackupInProgress(false);
    
    if (result.success) {
      alert(t.backupSuccess);
      loadBackups();
    } else {
      alert(`${t.backupFailed}: ${result.error}`);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    
    setRestoreInProgress(true);
    const result = await backupService.restoreBackup(selectedBackup.id, {
      conflictResolution,
      confirmRestore: true
    });
    setRestoreInProgress(false);
    setShowRestoreConfirm(false);
    setSelectedBackup(null);
    
    if (result.success) {
      alert(t.restoreSuccess);
    } else {
      alert(`${t.restoreFailed}: ${result.error}`);
    }
  };

  const handleExport = async (backupId: string) => {
    const result = await backupService.exportBackup(backupId);
    if (!result.success) {
      alert(`Export failed: ${result.error}`);
    }
  };

  const toggleAutoBackup = () => {
    if (autoBackupEnabled) {
      backupService.stopAutoBackup();
      setAutoBackupEnabled(false);
    } else {
      backupService.startAutoBackup(autoBackupInterval);
      setAutoBackupEnabled(true);
    }
  };

  const handleIntervalChange = (hours: number) => {
    setAutoBackupInterval(hours);
    if (autoBackupEnabled) {
      backupService.stopAutoBackup();
      backupService.startAutoBackup(hours);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-800 text-white border-gray-700' 
    : 'bg-white text-gray-800 border-gray-200';

  return (
    <div className={`rounded-xl shadow-sm border p-6 ${themeClasses}`}>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Database className="w-6 h-6" />
        {t.title}
      </h2>

      {/* Manual Backup Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          {t.manualBackup}
        </h3>
        
        <div className="flex gap-4">
          <button
            onClick={handleManualBackup}
            disabled={backupInProgress}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {backupInProgress ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t.backupInProgress}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t.backupNow}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Automatic Backup Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {t.autoBackup}
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{t.enableAutoBackup}</span>
            <button
              onClick={toggleAutoBackup}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoBackupEnabled ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {autoBackupEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2">{t.backupInterval}</label>
              <select
                value={autoBackupInterval}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
              >
                <option value={1}>{t.hourly}</option>
                <option value={24}>{t.daily}</option>
                <option value={168}>{t.weekly}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Backup History */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t.backupHistory}
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t.noBackups}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-3 px-4 font-medium">{t.backupType}</th>
                  <th className="text-left py-3 px-4 font-medium">{t.backupDate}</th>
                  <th className="text-left py-3 px-4 font-medium">{t.recordCount}</th>
                  <th className="text-left py-3 px-4 font-medium">{t.size}</th>
                  <th className="text-left py-3 px-4 font-medium">{t.status}</th>
                  <th className="text-left py-3 px-4 font-medium">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        backup.backup_type === 'automatic' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.backup_type === 'automatic' ? t.automatic : t.manual}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {format(new Date(backup.backup_date), 'dd MMM yyyy HH:mm', { locale: tr })}
                    </td>
                    <td className="py-3 px-4">
                      {Object.values(backup.record_counts || {}).reduce((sum: number, count: any) => sum + count, 0)}
                    </td>
                    <td className="py-3 px-4">
                      {formatBytes(backup.backup_size || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backup.status)}
                        <span className="text-sm">
                          {backup.status === 'completed' ? t.completed : 
                           backup.status === 'failed' ? t.failed : t.pending}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowRestoreConfirm(true);
                          }}
                          disabled={restoreInProgress}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                          title={t.restore}
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExport(backup.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title={t.export}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl p-6 max-w-md w-full ${themeClasses}`}>
            <h3 className="text-lg font-bold mb-4">{t.confirmRestore}</h3>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">{t.backupDetails}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t.backupDate}:</span>
                  <span>{format(new Date(selectedBackup.backup_date), 'dd MMM yyyy HH:mm', { locale: tr })}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.totalRecords}:</span>
                  <span>{Object.values(selectedBackup.record_counts || {}).reduce((sum: number, count: any) => sum + count, 0)}</span>
                </div>
                {selectedBackup.record_counts && (
                  <div className="mt-2 space-y-1">
                    {selectedBackup.record_counts.birds > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>{t.birds}:</span>
                        <span>{selectedBackup.record_counts.birds}</span>
                      </div>
                    )}
                    {selectedBackup.record_counts.incubations > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>{t.incubations}:</span>
                        <span>{selectedBackup.record_counts.incubations}</span>
                      </div>
                    )}
                    {selectedBackup.record_counts.eggs > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>{t.eggs}:</span>
                        <span>{selectedBackup.record_counts.eggs}</span>
                      </div>
                    )}
                    {selectedBackup.record_counts.chicks > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>{t.chicks}:</span>
                        <span>{selectedBackup.record_counts.chicks}</span>
                      </div>
                    )}
                    {selectedBackup.record_counts.daily_logs > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>{t.dailyLogs}:</span>
                        <span>{selectedBackup.record_counts.daily_logs}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{t.conflictResolution}</label>
              <select
                value={conflictResolution}
                onChange={(e) => setConflictResolution(e.target.value as any)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
              >
                <option value="remote_wins">{t.remoteWins}</option>
                <option value="local_wins">{t.localWins}</option>
                <option value="merge">{t.merge}</option>
              </select>
            </div>

            <p className="text-sm text-yellow-600 mb-6">{t.restoreWarning}</p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setSelectedBackup(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleRestore}
                disabled={restoreInProgress}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {restoreInProgress ? (
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  t.confirm
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
