import React, { useState } from 'react';
import { Moon, Sun, Globe, Bell, Download, Upload, Info, ChevronRight, Database } from 'lucide-react';
import { BackupPanel } from '../Backup/BackupPanel';

export const SettingsPanel: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [notifications, setNotifications] = useState({
    daily: true,
    critical: true,
    reminders: false
  });
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [showBackupPanel, setShowBackupPanel] = useState(false);

  const handleExportData = () => {
    console.log('Exporting data...');
  };

  const handleImportData = () => {
    console.log('Importing data...');
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
      about: 'Hakkında',
      version: 'Sürüm',
      support: 'Destek & İletişim',
      privacy: 'Gizlilik Politikası',
      terms: 'Kullanım Şartları',
      description: 'Kuluçka Takip, kuş yetiştiricileri için geliştirilmiş profesyonel bir takip sistemidir.'
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
      about: 'About',
      version: 'Version',
      support: 'Support & Contact',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      description: 'Kuluçka Takip is a professional tracking system developed for bird breeders.'
    }
  };

  const t = texts[language];

  if (showBackupPanel) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={() => setShowBackupPanel(false)}
            className="mr-4 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-neutral-800">{t.backupRestore}</h2>
        </div>
        <BackupPanel language={language} theme={darkMode ? 'dark' : 'light'} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800 mb-6">{t.title}</h2>
      
      <div className="space-y-6">
        {/* Theme & Language */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">{t.appearance}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-neutral-600" /> : <Sun className="w-5 h-5 text-neutral-600" />}
                <div>
                  <p className="font-medium text-neutral-800">{t.theme}</p>
                  <p className="text-sm text-neutral-600">{t.themeDesc}</p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-neutral-600" />
                <div>
                  <p className="font-medium text-neutral-800">{t.language}</p>
                  <p className="text-sm text-neutral-600">{t.languageDesc}</p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'tr' | 'en')}
                className="bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">{t.notifications}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-neutral-600" />
                <div>
                  <p className="font-medium text-neutral-800">{t.dailyReminders}</p>
                  <p className="text-sm text-neutral-600">{t.dailyDesc}</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, daily: !notifications.daily })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.daily ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.daily ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-800">{t.criticalAlerts}</p>
                <p className="text-sm text-neutral-600">{t.criticalDesc}</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, critical: !notifications.critical })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.critical ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.critical ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-800">{t.hatchReminders}</p>
                <p className="text-sm text-neutral-600">{t.hatchDesc}</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, reminders: !notifications.reminders })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.reminders ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.reminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">{t.backup}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-800">{t.autoBackup}</p>
                <p className="text-sm text-neutral-600">{t.backupDesc}</p>
              </div>
              <button
                onClick={() => setAutoBackup(!autoBackup)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoBackup ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoBackup ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {autoBackup && (
              <div className="ml-8">
                <p className="font-medium text-neutral-800 mb-2">{t.backupFreq}</p>
                <select
                  value={backupFrequency}
                  onChange={(e) => setBackupFrequency(e.target.value)}
                  className="bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="hourly">{t.hourly}</option>
                  <option value="daily">{t.daily}</option>
                  <option value="weekly">{t.weekly}</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t.exportData}
              </button>
              <button
                onClick={handleImportData}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {t.importData}
              </button>
            </div>

            <button
              onClick={() => setShowBackupPanel(true)}
              className="flex items-center justify-between w-full p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">{t.backupRestore}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">{t.about}</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-neutral-600" />
                <div>
                  <p className="font-medium text-neutral-800">{t.version}</p>
                  <p className="text-sm text-neutral-600">1.0.0</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <p className="text-sm text-neutral-600 mb-3">
                {t.description}
              </p>
              <div className="space-y-2">
                <button className="flex items-center justify-between w-full p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                  <span className="text-sm font-medium text-neutral-700">{t.support}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>
                <button className="flex items-center justify-between w-full p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                  <span className="text-sm font-medium text-neutral-700">{t.privacy}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>
                <button className="flex items-center justify-between w-full p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                  <span className="text-sm font-medium text-neutral-700">{t.terms}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
