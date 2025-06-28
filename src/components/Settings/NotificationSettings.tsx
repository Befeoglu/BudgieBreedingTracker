import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Clock, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { notificationService, NotificationSettings as NotificationSettingsType } from '../../services/notificationService';
import { useTranslation } from '../../hooks/useTranslation';

export const NotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettingsType>({
    daily_summary: true,
    hatch_reminders: true,
    chick_notifications: true,
    feeding_reminders: true,
    health_checks: true,
    custom_reminders: true,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    daily_summary_time: "08:00",
    do_not_disturb: false
  });
  const [loading, setLoading] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
  }, []);

  const loadSettings = async () => {
    try {
      await notificationService.loadSettings();
      setSettings(notificationService.getSettings());
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const checkNotificationPermission = () => {
    if (!('Notification' in window)) {
      setHasNotificationPermission(false);
      return;
    }
    
    setHasNotificationPermission(Notification.permission === 'granted');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Bu tarayıcı bildirimleri desteklemiyor', 'error');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setHasNotificationPermission(permission === 'granted');
      
      if (permission === 'granted') {
        showToast('Bildirim izni verildi', 'success');
      } else {
        showToast('Bildirim izni reddedildi', 'error');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      showToast('Bildirim izni alınırken hata oluştu', 'error');
    }
  };

  const handleSettingChange = async (key: keyof NotificationSettingsType, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    setLoading(true);
    try {
      await notificationService.saveSettings({ [key]: value });
      showToast('Bildirim ayarları kaydedildi', 'success');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showToast('Ayarlar kaydedilemedi', 'error');
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

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 transition-colors duration-300">
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-6 flex items-center gap-2">
        <Bell className="w-5 h-5" />
        {t('settings.notifications')}
      </h3>

      {hasNotificationPermission === false && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <BellRing className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                Bildirim İzni Gerekiyor
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">
                Uygulama bildirimlerini alabilmek için tarayıcı bildirim iznine ihtiyaç vardır.
              </p>
              <button
                onClick={requestNotificationPermission}
                className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
              >
                Bildirim İzni Ver
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Bildirim Türleri */}
        <div>
          <h4 className="text-base font-medium text-neutral-800 dark:text-neutral-200 mb-4">
            Bildirim Türleri
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Günlük Özet</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Her sabah günlük görevleriniz</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('daily_summary', !settings.daily_summary)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.daily_summary ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.daily_summary ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <BellRing className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Kuluçka Hatırlatıcıları</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Çıkım tarihi yaklaştığında</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('hatch_reminders', !settings.hatch_reminders)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.hatch_reminders ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.hatch_reminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Yavru Bildirimleri</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Yumurta çıktığında</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('chick_notifications', !settings.chick_notifications)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.chick_notifications ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.chick_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Besleme Hatırlatıcıları</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Yavru besleme zamanında</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('feeding_reminders', !settings.feeding_reminders)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.feeding_reminders ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.feeding_reminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Sağlık Kontrolleri</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Periyodik sağlık kontrolü</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('health_checks', !settings.health_checks)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.health_checks ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.health_checks ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Özel Hatırlatıcılar</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Manuel eklenen hatırlatmalar</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('custom_reminders', !settings.custom_reminders)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.custom_reminders ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.custom_reminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Zaman Ayarları */}
        <div>
          <h4 className="text-base font-medium text-neutral-800 dark:text-neutral-200 mb-4">
            Zaman Ayarları
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Günlük Özet Saati
              </label>
              <select
                value={settings.daily_summary_time}
                onChange={(e) => handleSettingChange('daily_summary_time', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sessiz Mod */}
        <div>
          <h4 className="text-base font-medium text-neutral-800 dark:text-neutral-200 mb-4">
            Sessiz Mod
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                  {settings.do_not_disturb ? (
                    <VolumeX className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200">Rahatsız Etme</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Sessiz saatlerde bildirim alma</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('do_not_disturb', !settings.do_not_disturb)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.do_not_disturb ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.do_not_disturb ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.do_not_disturb && (
              <div className="ml-13 space-y-4 bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Sessiz Saatlerin Başlangıcı
                  </label>
                  <select
                    value={settings.quiet_hours_start}
                    onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Sessiz Saatlerin Bitişi
                  </label>
                  <select
                    value={settings.quiet_hours_end}
                    onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Bildirimi */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={async () => {
              await notificationService.createNotification({
                type: 'custom_reminder',
                title: 'Test Bildirimi 🔔',
                message: 'Bu bir test bildirimidir. Bildirim ayarlarınız doğru çalışıyor!',
                read: false,
                scheduled_for: new Date().toISOString()
              });
              showToast('Test bildirimi gönderildi', 'success');
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
          >
            <Bell className="w-4 h-4" />
            Test Bildirimi Gönder
          </button>
        </div>
      </div>
    </div>
  );
};