import { supabase } from '../lib/supabase';

export interface NotificationData {
  id: string;
  user_id: string;
  type: 'daily_summary' | 'hatch_reminder' | 'hatch_occurred' | 'empty_nest' | 'custom_reminder' | 'feeding_reminder' | 'health_check';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  scheduled_for: string;
  created_at: string;
}

export interface NotificationSettings {
  daily_summary: boolean;
  hatch_reminders: boolean;
  chick_notifications: boolean;
  feeding_reminders: boolean;
  health_checks: boolean;
  custom_reminders: boolean;
  quiet_hours_start: string; // Format: "22:00"
  quiet_hours_end: string; // Format: "07:00"
  daily_summary_time: string; // Format: "08:00"
  do_not_disturb: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationData[] = [];
  private settings: NotificationSettings = {
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
  };

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    await this.loadNotifications();
    await this.loadSettings();
    this.scheduleDailyNotifications();
  }

  async loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      this.notifications = data || [];
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        this.settings = { ...this.settings, ...data.settings };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  async saveSettings(newSettings: Partial<NotificationSettings>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      this.settings = { ...this.settings, ...newSettings };

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          settings: this.settings
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  async createNotification(notification: Omit<NotificationData, 'id' | 'user_id' | 'created_at'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      this.notifications.unshift(data);
      this.showBrowserNotification(notification.title, notification.message);
      
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      this.notifications = this.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  getNotifications(): NotificationData[] {
    return this.notifications.slice(0, 10);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getSettings(): NotificationSettings {
    return this.settings;
  }

  // Kuluçka hatırlatıcıları
  async scheduleHatchReminders(clutchId: string, startDate: string, expectedHatchDate: string) {
    if (!this.settings.hatch_reminders) return;

    const hatchDate = new Date(expectedHatchDate);
    const today = new Date();

    // 2 gün öncesi hatırlatıcı
    const twoDaysBefore = new Date(hatchDate);
    twoDaysBefore.setDate(hatchDate.getDate() - 2);
    
    if (twoDaysBefore > today) {
      await this.createNotification({
        type: 'hatch_reminder',
        title: 'Çıkım Yaklaşıyor! 🥚',
        message: '2 gün sonra yumurtalarınızın çıkması bekleniyor. Kontrol etmeyi unutmayın!',
        data: { clutch_id: clutchId },
        read: false,
        scheduled_for: twoDaysBefore.toISOString()
      });
    }

    // 1 gün öncesi hatırlatıcı
    const oneDayBefore = new Date(hatchDate);
    oneDayBefore.setDate(hatchDate.getDate() - 1);
    
    if (oneDayBefore > today) {
      await this.createNotification({
        type: 'hatch_reminder',
        title: 'Çıkım Zamanı Geldi! 🐣',
        message: 'Yarın yumurtalarınızın çıkması bekleniyor. Hazırlıklarınızı tamamlayın!',
        data: { clutch_id: clutchId },
        read: false,
        scheduled_for: oneDayBefore.toISOString()
      });
    }
  }

  // Günlük özet bildirimi
  async createDailySummary() {
    if (!this.settings.daily_summary) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Aktif kuluçkaları getir
      const { data: clutches } = await supabase
        .from('clutches')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Bugün için görevleri getir
      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false);

      let message = '🌅 Günaydın! Bugünkü görevleriniz:\n\n';
      
      if (clutches && clutches.length > 0) {
        message += `🥚 ${clutches.length} aktif kuluçkanız var\n`;
      }
      
      if (todos && todos.length > 0) {
        message += `📋 ${todos.length} bekleyen göreviniz var\n`;
      }

      message += '\nBaşarılı bir gün geçirmeniz dileğiyle! 🐦';

      await this.createNotification({
        type: 'daily_summary',
        title: 'Günlük Özet 📊',
        message,
        read: false,
        scheduled_for: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating daily summary:', error);
    }
  }

  // Yavru doğumu bildirimi
  async notifyChickHatched(chickName: string, clutchName: string) {
    if (!this.settings.chick_notifications) return;

    await this.createNotification({
      type: 'hatch_occurred',
      title: 'Yeni Yavru Doğdu! 🐣',
      message: `${chickName} başarıyla çıktı! ${clutchName} kuluçkasından güzel haberler.`,
      read: false,
      scheduled_for: new Date().toISOString()
    });
  }

  // Boş yuva uyarısı
  async notifyEmptyNest(clutchName: string) {
    await this.createNotification({
      type: 'empty_nest',
      title: 'Yuva Boşaldı 🏠',
      message: `${clutchName} yuvasındaki tüm yumurtalar çıktı veya kaldırıldı.`,
      read: false,
      scheduled_for: new Date().toISOString()
    });
  }

  // Özel hatırlatıcı
  async createCustomReminder(title: string, message: string, scheduledFor: string) {
    if (!this.settings.custom_reminders) return;

    await this.createNotification({
      type: 'custom_reminder',
      title,
      message,
      read: false,
      scheduled_for: scheduledFor
    });
  }

  // Tarayıcı bildirimi
  private async showBrowserNotification(title: string, body: string) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/vite.svg',
        badge: '/vite.svg'
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/vite.svg',
          badge: '/vite.svg'
        });
      }
    }
  }

  // Günlük bildirimleri zamanla
  private scheduleDailyNotifications() {
    const now = new Date();
    const [hours, minutes] = this.settings.daily_summary_time.split(':');
    const targetTime = new Date();
    targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Eğer hedef saat geçmişse, yarın için planla
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const delay = targetTime.getTime() - now.getTime();

    setTimeout(() => {
      this.createDailySummary();
      // Her 24 saatte bir tekrarla
      setInterval(() => {
        this.createDailySummary();
      }, 24 * 60 * 60 * 1000);
    }, delay);
  }

  // Sessiz saatleri kontrol et
  private isQuietTime(): boolean {
    if (!this.settings.do_not_disturb) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const startTime = this.settings.quiet_hours_start;
    const endTime = this.settings.quiet_hours_end;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }
}

export const notificationService = NotificationService.getInstance();