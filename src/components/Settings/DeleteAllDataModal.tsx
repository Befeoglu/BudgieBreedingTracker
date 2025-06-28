import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../lib/auth';
import { useTranslation } from '../../hooks/useTranslation';

interface DeleteAllDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAllDataModal: React.FC<DeleteAllDataModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<'confirm' | 'final'>('confirm');

  const requiredText = 'KALICI OLARAK SİL';

  const handleDeleteAllData = async () => {
    if (confirmText !== requiredText) {
      showToast(t('settings.deleteAllData.confirmTextError'), 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // 1. Delete all user data from Supabase tables
      const tables = [
        'pedigree',
        'chicks', 
        'eggs',
        'clutches',
        'birds',
        'todos',
        'backups',
        'sync_logs'
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error(`Error deleting from ${table}:`, error);
          // Continue with other tables even if one fails
        }
      }

      // 2. Clear all localStorage data
      clearLocalStorage();

      // 3. Show success message
      showToast(t('settings.deleteAllData.success'), 'success');

      // 4. Sign out user and redirect to login
      setTimeout(async () => {
        await signOut();
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Error deleting all data:', error);
      showToast(error.message || t('settings.deleteAllData.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = () => {
    try {
      // Clear all app-specific localStorage items
      const keysToRemove = [
        'app_language',
        'app_theme',
        'user_settings',
        'notification_settings',
        'backup_settings',
        'sync_settings',
        'supabase_logs'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear any user-specific data (pattern: tableName_userId)
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('_') && (
          key.startsWith('birds_') ||
          key.startsWith('clutches_') ||
          key.startsWith('eggs_') ||
          key.startsWith('chicks_') ||
          key.startsWith('todos_') ||
          key.startsWith('pedigree_')
        )) {
          localStorage.removeItem(key);
        }
      });

    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const toast = document.createElement('div');
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500'
    }[type];
    
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 animate-slide-up ${bgColor}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-600" />
              {t('settings.deleteAllData.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'confirm' && (
            <div className="space-y-6">
              {/* Warning */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                      {t('settings.deleteAllData.warningTitle')}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                      {t('settings.deleteAllData.warningMessage')}
                    </p>
                  </div>
                </div>
              </div>

              {/* What will be deleted */}
              <div className="space-y-3">
                <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {t('settings.deleteAllData.whatWillBeDeleted')}
                </h4>
                <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('settings.deleteAllData.allBirds')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('settings.deleteAllData.allIncubations')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('settings.deleteAllData.allChicks')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('settings.deleteAllData.allTodos')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('settings.deleteAllData.allPedigree')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('settings.deleteAllData.allBackups')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {t('settings.deleteAllData.localData')}
                  </li>
                </ul>
              </div>

              {/* Confirmation input */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('settings.deleteAllData.confirmInstruction')}
                  <span className="block font-mono text-red-600 dark:text-red-400 mt-1">
                    {requiredText}
                  </span>
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-xl focus:ring-4 focus:ring-red-200 dark:focus:ring-red-900/50 focus:border-red-400 dark:focus:border-red-600 transition-all duration-300 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                  placeholder={t('settings.deleteAllData.confirmPlaceholder')}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => setStep('final')}
                  disabled={confirmText !== requiredText}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('settings.deleteAllData.continue')}
                </button>
              </div>
            </div>
          )}

          {step === 'final' && (
            <div className="space-y-6">
              {/* Final warning */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                      {t('settings.deleteAllData.finalWarningTitle')}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                      {t('settings.deleteAllData.finalWarningMessage')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Final buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('confirm')}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
                >
                  {t('settings.deleteAllData.goBack')}
                </button>
                <button
                  onClick={handleDeleteAllData}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t('settings.deleteAllData.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {t('settings.deleteAllData.deleteNow')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};