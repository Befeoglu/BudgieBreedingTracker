import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { signIn, signUp } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

// Animated Bird Logo Component
const AnimatedBirdLogo: React.FC = () => {
  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full animate-bird-float"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bird Body */}
        <ellipse
          cx="50"
          cy="55"
          rx="18"
          ry="25"
          fill="url(#birdGradient)"
          className="animate-bird-body"
        />
        
        {/* Bird Head */}
        <circle
          cx="50"
          cy="30"
          r="15"
          fill="url(#headGradient)"
          className="animate-bird-head"
        />
        
        {/* Beak */}
        <path
          d="M35 28 L28 25 L35 32 Z"
          fill="#FF8C42"
          className="animate-bird-beak"
        />
        
        {/* Eye */}
        <circle cx="45" cy="26" r="3" fill="#2D3748" className="animate-bird-eye" />
        <circle cx="46" cy="25" r="1" fill="white" />
        
        {/* Wing */}
        <ellipse
          cx="58"
          cy="50"
          rx="8"
          ry="18"
          fill="url(#wingGradient)"
          className="animate-bird-wing"
          transform="rotate(15 58 50)"
        />
        
        {/* Tail */}
        <ellipse
          cx="68"
          cy="65"
          rx="4"
          ry="12"
          fill="url(#tailGradient)"
          className="animate-bird-tail"
          transform="rotate(25 68 65)"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="birdGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#68D391" />
            <stop offset="100%" stopColor="#38A169" />
          </linearGradient>
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9AE6B4" />
            <stop offset="100%" stopColor="#68D391" />
          </linearGradient>
          <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FD1C7" />
            <stop offset="100%" stopColor="#319795" />
          </linearGradient>
          <linearGradient id="tailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#63B3ED" />
            <stop offset="100%" stopColor="#3182CE" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Floating particles around bird */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 right-4 w-1 h-1 bg-primary-400 rounded-full animate-particle-1"></div>
        <div className="absolute top-8 left-2 w-1.5 h-1.5 bg-secondary-400 rounded-full animate-particle-2"></div>
        <div className="absolute bottom-4 right-2 w-1 h-1 bg-blue-400 rounded-full animate-particle-3"></div>
      </div>
    </div>
  );
};

export const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('');
      return true;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Geçerli bir e-posta adresi girin');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    validateEmail(newEmail);
    // Clear reset password success when email changes
    setResetPasswordSuccess(false);
  };

  const getErrorMessage = (error: any, isSignUp: boolean) => {
    const errorMessage = error?.message || '';
    
    // Handle specific error cases
    if (errorMessage.includes('Invalid login credentials')) {
      if (isSignUp) {
        return 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.';
      } else {
        return 'E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
      }
    }
    
    if (errorMessage.includes('Password should be at least')) {
      return 'Şifre en az 6 karakter olmalıdır.';
    }
    
    if (errorMessage.includes('User already registered')) {
      return 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.';
    }
    
    if (errorMessage.includes('Email not confirmed')) {
      return 'E-posta adresinizi doğrulamanız gerekiyor. E-posta kutunuzu kontrol edin.';
    }
    
    if (errorMessage.includes('Invalid email')) {
      return 'Geçerli bir e-posta adresi girin.';
    }
    
    if (errorMessage.includes('Signup is disabled')) {
      return 'Yeni kayıt şu anda devre dışı. Lütfen daha sonra tekrar deneyin.';
    }
    
    if (errorMessage.includes('Too many requests')) {
      return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.';
    }
    
    // Default error message
    return isSignUp 
      ? 'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.' 
      : 'Giriş yaparken bir hata oluştu. Lütfen tekrar deneyin.';
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Şifre sıfırlama için lütfen e-posta adresinizi girin.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }

    setResetPasswordLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetPasswordSuccess(true);
    } catch (err: any) {
      if (err.message?.includes('User not found')) {
        setError('Bu e-posta adresi ile kayıtlı bir hesap bulunamadı.');
      } else if (err.message?.includes('Too many requests')) {
        setError('Çok fazla şifre sıfırlama talebi gönderildi. Lütfen birkaç dakika bekleyin.');
      } else {
        setError('Şifre sıfırlama e-postası gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setError(getErrorMessage(err, isSignUp));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 animate-slide-up">
          
          {/* Animated Bird Logo */}
          <AnimatedBirdLogo />
          
          {/* Welcome Text */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 font-poppins leading-tight">
              {isSignUp ? 'Hoş Geldiniz!' : 'Tekrar Hoş Geldiniz!'}
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-medium leading-relaxed">
              {isSignUp 
                ? 'BudgieBreedingTracker\'a katılın' 
                : 'Muhabbet kuşu üretim takibinize devam edin'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 font-poppins">
                E-posta Adresi
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className={`w-full px-4 py-3 sm:py-4 bg-white/70 border-2 rounded-2xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium transform focus:scale-[1.02] text-sm sm:text-base ${
                    emailError ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="ornek@email.com"
                />
                {emailError && (
                  <p className="mt-2 text-sm text-red-600 font-medium animate-shake leading-tight">{emailError}</p>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 font-poppins">
                Şifre {isSignUp && <span className="text-gray-500 text-xs">(en az 6 karakter)</span>}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 sm:py-4 bg-white/70 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300 text-gray-800 placeholder-gray-500 font-medium pr-12 transform focus:scale-[1.02] text-sm sm:text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Success Message for Password Reset */}
            {resetPasswordSuccess && (
              <div className="p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-700 font-medium leading-tight">
                    Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. E-posta kutunuzu kontrol edin.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-2xl animate-shake">
                <p className="text-sm text-red-700 font-medium text-center leading-tight">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!emailError || password.length < 6}
              className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white py-3 sm:py-4 px-6 rounded-2xl font-bold text-base sm:text-lg hover:from-orange-500 hover:to-orange-600 focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl font-poppins"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Yükleniyor...</span>
                </div>
              ) : (
                isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 sm:mt-8 space-y-4">
            {!isSignUp && (
              <div className="text-center">
                <button 
                  onClick={handleForgotPassword}
                  disabled={resetPasswordLoading}
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetPasswordLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Gönderiliyor...</span>
                    </div>
                  ) : (
                    'Şifremi Unuttum'
                  )}
                </button>
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(''); // Clear error when switching modes
                  setResetPasswordSuccess(false); // Clear success message
                }}
                className="text-gray-600 hover:text-gray-800 font-semibold transition-colors text-sm sm:text-base leading-tight"
              >
                {isSignUp 
                  ? 'Zaten hesabınız var mı? Giriş yapın' 
                  : 'Hesabınız yok mu? Kayıt olun'
                }
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-16 h-16 sm:w-20 sm:h-20 bg-primary-200 rounded-full opacity-20 animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-12 h-12 sm:w-16 sm:h-16 bg-orange-200 rounded-full opacity-30 animate-float-delayed"></div>
        <div className="absolute top-1/3 right-20 w-10 h-10 sm:w-12 sm:h-12 bg-blue-200 rounded-full opacity-25 animate-float-fast"></div>
      </div>
    </div>
  );
};