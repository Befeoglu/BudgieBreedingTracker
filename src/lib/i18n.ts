import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import trTranslations from '../locales/tr.json';
import enTranslations from '../locales/en.json';

const resources = {
  tr: {
    translation: trTranslations
  },
  en: {
    translation: enTranslations
  }
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'tr',
    debug: false,
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app_language',
    },

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],

    // React specific options
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper functions for language management
export const getCurrentLanguage = (): string => {
  return i18n.language || 'tr';
};

export const changeLanguage = async (language: string): Promise<void> => {
  await i18n.changeLanguage(language);
  localStorage.setItem('app_language', language);
  document.documentElement.lang = language;
};

export const getSupportedLanguages = (): { code: string; name: string; nativeName: string }[] => {
  return [
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'en', name: 'English', nativeName: 'English' }
  ];
};

// Language persistence helper
export const persistLanguagePreference = (language: string): void => {
  localStorage.setItem('app_language', language);
  document.documentElement.lang = language;
};

// Get browser language with fallback
export const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0];
  const supportedLangs = ['tr', 'en'];
  return supportedLangs.includes(browserLang) ? browserLang : 'tr';
};

// Initialize language on app start
export const initializeLanguage = (): void => {
  const savedLanguage = localStorage.getItem('app_language');
  const browserLanguage = getBrowserLanguage();
  const initialLanguage = savedLanguage || browserLanguage;
  
  if (i18n.language !== initialLanguage) {
    changeLanguage(initialLanguage);
  }
  
  document.documentElement.lang = initialLanguage;
};