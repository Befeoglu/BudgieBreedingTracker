import { useTranslation as useI18nTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, getSupportedLanguages } from '../lib/i18n';

interface UseTranslationReturn {
  t: (key: string, options?: any) => string;
  tPlural: (key: string, count: number, options?: any) => string;
  currentLanguage: string;
  supportedLanguages: Array<{ code: string; name: string; nativeName: string }>;
  switchLanguage: (language: string) => Promise<void>;
  formatDate: (date: Date | string, format?: 'short' | 'long' | 'full') => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatRelativeTime: (date: Date | string) => string;
  isRTL: boolean;
  i18n: any;
}

export const useTranslation = (): UseTranslationReturn => {
  const { t, i18n } = useI18nTranslation();

  const currentLanguage = getCurrentLanguage();
  const supportedLanguages = getSupportedLanguages();

  const switchLanguage = async (language: string) => {
    await changeLanguage(language);
  };

  // Helper function for interpolation
  const translate = (key: string, options?: any) => {
    return t(key, options);
  };

  // Helper for pluralization
  const translatePlural = (key: string, count: number, options?: any) => {
    return t(key, { count, ...options });
  };

  // Helper for date formatting based on language
  const formatDate = (date: Date | string, format: 'short' | 'long' | 'full' = 'short') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const locale = currentLanguage === 'tr' ? 'tr-TR' : 'en-US';
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    };

    return new Intl.DateTimeFormat(locale, formatOptions[format]).format(dateObj);
  };

  // Helper for number formatting
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    const locale = currentLanguage === 'tr' ? 'tr-TR' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(number);
  };

  // Helper for currency formatting
  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    const locale = currentLanguage === 'tr' ? 'tr-TR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Helper for relative time formatting
  const formatRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t('common.justNow', 'Az önce');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('common.minutesAgo', '{{count}} dakika önce', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('common.hoursAgo', '{{count}} saat önce', { count: hours });
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return t('common.daysAgo', '{{count}} gün önce', { count: days });
    }
  };

  return {
    t: translate,
    tPlural: translatePlural,
    currentLanguage,
    supportedLanguages,
    switchLanguage,
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    isRTL: false, // Neither Turkish nor English are RTL languages
    i18n
  };
};

export default useTranslation;