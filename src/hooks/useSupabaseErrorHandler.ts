import { useState, useCallback } from 'react';
import { PostgrestError } from '@supabase/supabase-js';

interface ErrorLog {
  id: string;
  timestamp: string;
  operation: string;
  table?: string;
  error: PostgrestError | Error;
  context?: any;
}

export const useSupabaseErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);

  const logError = useCallback((
    operation: string,
    error: PostgrestError | Error,
    context?: any
  ) => {
    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      operation,
      error,
      context
    };

    // Add to state
    setErrors(prev => [errorLog, ...prev.slice(0, 99)]);

    // Log to console
    console.error(`Supabase ${operation} error:`, error, context);

    // Store in localStorage
    const existingLogs = JSON.parse(localStorage.getItem('supabase_logs') || '[]');
    existingLogs.unshift({
      ...errorLog,
      details: {
        message: error.message,
        code: 'code' in error ? error.code : undefined,
        details: 'details' in error ? error.details : undefined,
        hint: 'hint' in error ? error.hint : undefined,
        context
      }
    });
    localStorage.setItem('supabase_logs', JSON.stringify(existingLogs.slice(0, 100)));

    // Show toast notification
    showErrorToast(error.message);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    localStorage.removeItem('supabase_logs');
  }, []);

  const showErrorToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 animate-slide-up bg-red-500 max-w-md';
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  };

  return {
    errors,
    logError,
    clearErrors
  };
};