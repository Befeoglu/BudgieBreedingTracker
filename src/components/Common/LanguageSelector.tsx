import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'toggle' | 'buttons';
  className?: string;
  showLabel?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = '',
  showLabel = true
}) => {
  const { currentLanguage, supportedLanguages, switchLanguage, t } = useTranslation();

  if (variant === 'toggle') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('settings.language')}
            </span>
          </div>
        )}
        <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                currentLanguage === lang.code
                  ? 'bg-white dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              currentLanguage === lang.code
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
            }`}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <select
        value={currentLanguage}
        onChange={(e) => switchLanguage(e.target.value)}
        className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-800 dark:text-neutral-200 appearance-none pr-8"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
      <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500 dark:text-neutral-400 pointer-events-none" />
    </div>
  );
};

export default LanguageSelector;