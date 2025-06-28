import React, { useState, useEffect } from 'react';
import { Moon, Sun, Globe, Bell, Download, Upload, Info, ChevronRight, Database, LogOut } from 'lucide-react';
import { BackupPanel } from '../Backup/BackupPanel';
import { signOut } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

interface SettingsState {
  darkMode: boolean;
  language: 'tr' | 'en';
  notifications: {
    daily: boolean;
    critical: boolean;
    reminders: boolean;
  };
  autoBackup: boolean;
  backupFrequency: string;
  syncEnabled: boolean;
}

export const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    darkMode: false,
    language: 'tr',
    notifications: {
      daily: true,
      critical: true,
      reminders: false
    },
    autoBackup: true,
    backupFrequency: 'daily',
    syncEnabled: true
  });

  const [showBackupPanel, setShowBackupPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    setLoading(true);
    try {
      await loadUserSettings();
      await loadAppVersion();
    } catch (error) {
      console.error('Error initializing settings:', error);
      showToast('Settings loading error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('language, theme')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user settings:', error);
        return;
      }

      if (data) {
        const isDarkMode = data.theme === 'dark';
        setSettings(prev => ({
          ...prev,
          language: data.language || 'tr',
          darkMode: isDarkMode
        }));

        // Apply theme immediately
        applyTheme(isDarkMode);
      }

      // Load notification preferences from localStorage
      const notificationSettings = localStorage.getItem('notification_settings');
      if (notificationSettings) {
        const notifications = JSON.parse(notificationSettings);
        setSettings(prev => ({ ...prev, notifications }));
      }

      // Load backup settings from localStorage
      const backupSettings = localStorage.getItem('backup_settings');
      if (backupSettings) {
        const { autoBackup, backupFrequency } = JSON.parse(backupSettings);
        setSettings(prev => ({ ...prev, autoBackup, backupFrequency }));
      }

      // Load sync settings from localStorage
      const syncSettings = localStorage.getItem('sync_settings');
      if (syncSettings) {
        const { syncEnabled } = JSON.parse(syncSettings);
        setSettings(prev => ({ ...prev, syncEnabled }));
      }

    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadAppVersion = async () => {
    try {
      setAppVersion('1.0.0');
    } catch (error) {
      console.error('Error loading app version:', error);
      setAppVersion('1.0.0');
    }
  };

  const applyTheme = (isDark: boolean) => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      root.style.setProperty('--bg-primary', '#1f2937');
      root.style.setProperty('--bg-secondary', '#374151');
      root.style.setProperty('--text-primary', '#f9fafb');
      root.style.setProperty('--text-secondary', '#d1d5db');
      root.style.setProperty('--border-color', '#4b5563');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f9fafb');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--border-color', '#e5e7eb');
    }

    // Update body background
    document.body.style.backgroundColor = isDark ? '#1f2937' : '#f5f5f4';
    
    // Store theme preference
    localStorage.setItem('app_theme', isDark ? 'dark' : 'light');
  };

  // Settings Update Functions
  const updateUserSettings = async (updates: { language?: string; theme?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user settings:', error);
        showToast(settings.language === 'tr' ? 'Ayarlar güncellenirken hata oluştu' : 'Error updating settings', 'error');
      } else {
        showToast(settings.language === 'tr' ? 'Ayarlar başarıyla güncellendi' : 'Settings updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      showToast(settings.language === 'tr' ? 'Ayarlar güncellenirken hata oluştu' : 'Error updating settings', 'error');
    }
  };

  const handleLanguageChange = async (newLanguage: 'tr' | 'en') => {
    setSettings(prev => ({ ...prev, language: newLanguage }));
    await updateUserSettings({ language: newLanguage });
    persistLocale(newLanguage);
  };

  const handleThemeChange = async (isDark: boolean) => {
    setSettings(prev => ({ ...prev, darkMode: isDark }));
    const theme = isDark ? 'dark' : 'light';
    await updateUserSettings({ theme });
    applyTheme(isDark);
  };

  const handleNotificationChange = (type: keyof typeof settings.notifications, value: boolean) => {
    const newNotifications = { ...settings.notifications, [type]: value };
    setSettings(prev => ({ ...prev, notifications: newNotifications }));
    localStorage.setItem('notification_settings', JSON.stringify(newNotifications));
    saveUserSettings({ notificationsEnabled: newNotifications });
  };

  const handleAutoBackupChange = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, autoBackup: enabled }));
    const backupSettings = { autoBackup: enabled, backupFrequency: settings.backupFrequency };
    localStorage.setItem('backup_settings', JSON.stringify(backupSettings));
    
    if (enabled) {
      triggerAutoBackup();
    } else {
      stopAutoBackup();
    }
  };

  const handleBackupFrequencyChange = (frequency: string) => {
    setSettings(prev => ({ ...prev, backupFrequency: frequency }));
    const backupSettings = { autoBackup: settings.autoBackup, backupFrequency: frequency };
    localStorage.setItem('backup_settings', JSON.stringify(backupSettings));
    
    if (settings.autoBackup) {
      triggerAutoBackup();
    }
  };

  const handleSyncChange = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, syncEnabled: enabled }));
    localStorage.setItem('sync_settings', JSON.stringify({ syncEnabled: enabled }));
    
    if (enabled) {
      triggerSync();
    }
  };

  const handleSignOut = async () => {
    const confirmMessage = settings.language === 'tr' 
      ? 'Hesaptan çıkış yapmak istediğinizden emin misiniz?' 
      : 'Are you sure you want to sign out?';
    
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      showToast(settings.language === 'tr' ? 'Çıkış yaparken hata oluştu' : 'Error signing out', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Utility Functions
  const persistLocale = (locale: string) => {
    localStorage.setItem('app_language', locale);
    document.documentElement.lang = locale;
  };

  const saveUserSettings = (settings: any) => {
    localStorage.setItem('user_settings', JSON.stringify(settings));
  };

  const triggerAutoBackup = () => {
    console.log('Auto backup triggered');
    showToast(settings.language === 'tr' ? 'Otomatik yedekleme başlatıldı' : 'Auto backup started', 'info');
  };

  const stopAutoBackup = () => {
    console.log('Auto backup stopped');
    showToast(settings.language === 'tr' ? 'Otomatik yedekleme durduruldu' : 'Auto backup stopped', 'info');
  };

  const triggerSync = () => {
    console.log('Sync triggered');
    showToast(settings.language === 'tr' ? 'Senkronizasyon başlatıldı' : 'Synchronization started', 'info');
  };

  const triggerBackup = () => {
    console.log('Manual backup triggered');
    showToast(settings.language === 'tr' ? 'Manuel yedekleme başlatıldı' : 'Manual backup started', 'info');
  };

  const handleExportData = () => {
    try {
      const exportData = {
        settings: settings,
        exportDate: new Date().toISOString(),
        version: appVersion
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `budgie-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast(settings.language === 'tr' ? 'Veriler başarıyla dışa aktarıldı' : 'Data exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast(settings.language === 'tr' ? 'Dışa aktarma sırasında hata oluştu' : 'Export error occurred', 'error');
    }
  };

  const handleImportData = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = JSON.parse(e.target?.result as string);
              if (data.settings) {
                setSettings(data.settings);
                showToast(settings.language === 'tr' ? 'Veriler başarıyla içe aktarıldı' : 'Data imported successfully', 'success');
              } else {
                showToast(settings.language === 'tr' ? 'Geçersiz dosya formatı' : 'Invalid file format', 'error');
              }
            } catch (error) {
              showToast(settings.language === 'tr' ? 'Dosya okuma hatası' : 'File reading error', 'error');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } catch (error) {
      console.error('Import error:', error);
      showToast(settings.language === 'tr' ? 'İçe aktarma sırasında hata oluştu' : 'Import error occurred', 'error');
    }
  };

  const handleFeedbackSend = () => {
    const subject = encodeURIComponent('BudgieBreedingTracker Feedback');
    const body = encodeURIComponent(
      settings.language === 'tr' 
        ? `Merhaba,\n\nBudgieBreedingTracker uygulaması hakkında geri bildirimim:\n\n[Geri bildiriminizi buraya yazın]\n\nTeşekkürler.`
        : `Hello,\n\nMy feedback about BudgieBreedingTracker app:\n\n[Write your feedback here]\n\nThank you.`
    );
    window.open(`mailto:support@budgietracker.com?subject=${subject}&body=${body}`);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const toast = document.createElement('div');
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500'
    }[type];
    
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 animate-slide-up ${bgColor}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  const texts = {
    tr: {
      title: 'Ayarlar',
      appearance: 'Görünüm & Dil',
      theme: 'Tema',
      themeDesc: 'Karanlık/Aydınlık mod',
      language: 'Dil',
      languageDesc: 'Uygulama dili',
      notifications: 'Bildirimler',
      dailyReminders: 'Günlük Hatırlatmalar',
      dailyDesc: 'Rutin görevler için',
      criticalAlerts: 'Kritik Uyarılar',
      criticalDesc: 'Önemli gelişmeler için',
      hatchReminders: 'Çıkım Hatırlatmaları',
      hatchDesc: 'Tahmini tarihler için',
      backup: 'Yedekleme',
      autoBackup: 'Otomatik Yedekleme',
      backupDesc: 'Verilerinizi güvende tutun',
      backupFreq: 'Yedekleme Sıklığı',
      hourly: 'Saatlik',
      daily: 'Günlük',
      weekly: 'Haftalık',
      exportData: 'Verileri İndir',
      importData: 'Verileri Yükle',
      backupRestore: 'Yedekleme & Geri Yükleme',
      backupNow: 'Şimdi Yedekle',
      sync: 'Senkronizasyon',
      autoSync: 'Otomatik Senkronizasyon',
      syncDesc: 'Cihazlar arası veri senkronizasyonu',
      account: 'Hesap',
      signOut: 'Hesaptan Çıkış Yap',
      signOutDesc: 'Oturumu sonlandır',
      about: 'Hakkında',
      version: 'Sürüm',
      support: 'Destek & İletişim',
      privacy: 'Gizlilik Politikası',
      terms: 'Kullanım Şartları',
      feedback: 'Geri Bildirim Gönder',
      description: 'BudgieBreedingTracker, muhabbet kuşu yetiştiricileri için geliştirilmiş profesyonel bir takip sistemidir.'
    },
    en: {
      title: 'Settings',
      appearance: 'Appearance & Language',
      theme: 'Theme',
      themeDesc: 'Dark/Light mode',
      language: 'Language',
      languageDesc: 'Application language',
      notifications: 'Notifications',
      dailyReminders: 'Daily Reminders',
      dailyDesc: 'For routine tasks',
      criticalAlerts: 'Critical Alerts',
      criticalDesc: 'For important developments',
      hatchReminders: 'Hatch Reminders',
      hatchDesc: 'For estimated dates',
      backup: 'Backup',
      autoBackup: 'Automatic Backup',
      backupDesc: 'Keep your data safe',
      backupFreq: 'Backup Frequency',
      hourly: 'Hourly',
      daily: 'Daily',
      weekly: 'Weekly',
      exportData: 'Export Data',
      importData: 'Import Data',
      backupRestore: 'Backup & Restore',
      backupNow: 'Backup Now',
      sync: 'Synchronization',
      autoSync: 'Auto Synchronization',
      syncDesc: 'Cross-device data synchronization',
      account: 'Account',
      signOut: 'Sign Out',
      signOutDesc: 'End session',
      about: 'About',
      version: 'Version',
      support: 'Support & Contact',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      feedback: 'Send Feedback',
      description: 'BudgieBreedingTracker is a professional tracking system developed for budgerigar breeders.'
    }
  };

  const t = texts[settings.language];

  if (showBackupPanel) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => setShowBackupPanel(false)}
            className="mr-4 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">{t.backupRestore}</h2>
        </div>
        <BackupPanel language={settings.language} theme={settings.darkMode ? 'dark' : 'light'} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-6">{t.title}</h2>
        
        <div className="space-y-6">
          {/* Theme & Language */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{t.appearance}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.darkMode ? <Moon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" /> : <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">{t.theme}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.themeDesc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleThemeChange(!settings.darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.darkMode ? 'bg-primary-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">{t.language}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.languageDesc}</p>
                  </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleLanguageChange(e.target.value as 'tr' | 'en')}
                  className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{t.notifications}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">{t.dailyReminders}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.dailyDesc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationChange('daily', !settings.notifications.daily)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.daily ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.daily ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">{t.criticalAlerts}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.criticalDesc}</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('critical', !settings.notifications.critical)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.critical ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.critical ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">{t.hatchReminders}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.hatchDesc}</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('reminders', !settings.notifications.reminders)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.reminders ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.reminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Backup */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{t.backup}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">{t.autoBackup}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.backupDesc}</p>
                </div>
                <button
                  onClick={() => handleAutoBackupChange(!settings.autoBackup)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoBackup ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.autoBackup && (
                <div className="ml-8">
                  <p className="font-medium text-neutral-800 dark:text-neutral-200 mb-2">{t.backupFreq}</p>
                  <select
                    value={settings.backupFrequency}
                    onChange={(e) => handleBackupFrequencyChange(e.target.value)}
                    className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="hourly">{t.hourly}</option>
                    <option value="daily">{t.daily}</option>
                    <option value="weekly">{t.weekly}</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={triggerBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t.backupNow}
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t.exportData}
                </button>
                <button
                  onClick={handleImportData}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {t.importData}
                </button>
              </div>

              <button
                onClick={() => setShowBackupPanel(true)}
                className="flex items-center justify-between w-full p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.backupRestore}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Synchronization */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{t.sync}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">{t.autoSync}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.syncDesc}</p>
                </div>
                <button
                  onClick={() => handleSyncChange(!settings.syncEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.syncEnabled ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.syncEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{t.account}</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center justify-between w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div className="text-left">
                    <p className="font-medium text-red-800 dark:text-red-300">{t.signOut}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">{t.signOutDesc}</p>
                  </div>
                </div>
                {loading && (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </button>
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{t.about}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">{t.version}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{appVersion}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  {t.description}
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={handleFeedbackSend}
                    className="flex items-center justify-between w-full p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                  >
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.feedback}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  </button>
                  <button className="flex items-center justify-between w-full p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.support}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  </button>
                  <button className="flex items-center justify-between w-full p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.privacy}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  </button>
                  <button className="flex items-center justify-between w-full p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.terms}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};