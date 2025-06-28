import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, X, CheckCheck, Clock, Egg, Baby, Calendar, Heart } from 'lucide-react';
import { notificationService, NotificationData } from '../../services/notificationService';
import { useTranslation } from '../../hooks/useTranslation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const NotificationPanel: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    
    // Initialize notification service
    notificationService.initialize();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Set up notification refresh interval
    const interval = setInterval(() => {
      if (!isOpen) { // Only refresh when panel is closed
        loadNotifications(false); // Silent refresh
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadNotifications = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    try {
      await notificationService.loadNotifications();
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());
    }

    // Handle navigation based on notification type
    if (notification.type === 'hatch_reminder' && notification.data?.clutch_id) {
      // TODO: Navigate to clutch detail
      console.log('Navigate to clutch:', notification.data.clutch_id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'hatch_reminder':
      case 'hatch_occurred':
        return Egg;
      case 'daily_summary':
        return Calendar;
      case 'custom_reminder':
        return Clock;
      case 'feeding_reminder':
        return Heart;
      case 'health_check':
        return Baby;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: NotificationData['type']) => {
    switch (type) {
      case 'hatch_reminder':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'hatch_occurred':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'daily_summary':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'custom_reminder':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      case 'feeding_reminder':
        return 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30';
      case 'health_check':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-700';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return t('common.justNow');
    } else if (diffInHours < 24) {
      return t('common.hoursAgo', { count: diffInHours });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return t('common.daysAgo', { count: diffInDays });
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-300 transform hover:scale-110"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 animate-bounce" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 animate-slide-up transition-colors duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
              {t('common.notifications', 'Bildirimler')}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1 text-primary-600 hover:text-primary-700 transition-colors"
                  title="Tümünü okundu işaretle"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Henüz bildirim yok</p>
                <p className="text-sm mt-2">Yeni bildirimleriniz burada görünecek</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClass = getNotificationColor(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                        notification.read 
                          ? 'hover:bg-neutral-50 dark:hover:bg-neutral-700' 
                          : 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm leading-tight mb-1 ${
                          notification.read 
                            ? 'text-neutral-700 dark:text-neutral-300' 
                            : 'text-neutral-800 dark:text-neutral-200'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-xs leading-relaxed mb-2 ${
                          notification.read 
                            ? 'text-neutral-600 dark:text-neutral-400' 
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Tüm bildirimleri görüntüle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};