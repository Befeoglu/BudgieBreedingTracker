import { useState, useEffect } from 'react';
import { backupService } from '../services/backupService';

export const useBackup = () => {
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<Date | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);

  useEffect(() => {
    // Check if backup is running
    const checkBackupStatus = () => {
      setIsBackupRunning(backupService.isBackupRunning());
    };

    // Load backup history
    const loadBackupHistory = async () => {
      const result = await backupService.getBackups();
      if (result.success && result.backups) {
        setBackupHistory(result.backups);
        if (result.backups.length > 0) {
          setLastBackupDate(new Date(result.backups[0].backup_date));
        }
      }
    };

    checkBackupStatus();
    loadBackupHistory();

    // Set up interval to check backup status
    const interval = setInterval(checkBackupStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const createManualBackup = async () => {
    const result = await backupService.createBackup('manual');
    if (result.success) {
      // Reload backup history
      const historyResult = await backupService.getBackups();
      if (historyResult.success && historyResult.backups) {
        setBackupHistory(historyResult.backups);
        setLastBackupDate(new Date());
      }
    }
    return result;
  };

  const startAutoBackup = (intervalHours: number = 24) => {
    backupService.startAutoBackup(intervalHours);
    setAutoBackupEnabled(true);
  };

  const stopAutoBackup = () => {
    backupService.stopAutoBackup();
    setAutoBackupEnabled(false);
  };

  const restoreFromBackup = async (backupId: string, options: {
    conflictResolution: 'local_wins' | 'remote_wins' | 'merge';
    confirmRestore: boolean;
  }) => {
    return await backupService.restoreBackup(backupId, options);
  };

  const exportBackup = async (backupId: string) => {
    return await backupService.exportBackup(backupId);
  };

  return {
    isBackupRunning,
    lastBackupDate,
    autoBackupEnabled,
    backupHistory,
    createManualBackup,
    startAutoBackup,
    stopAutoBackup,
    restoreFromBackup,
    exportBackup
  };
};
