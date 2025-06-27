import { createClient } from '@supabase/supabase-js';

// Adım 2: Çevre Değişkenlerini Kontrol Et
// Vite, .env dosyasındaki VITE_ ön ekli değişkenleri otomatik olarak buraya enjekte eder.
// Bu değişkenlerin .env dosyasında doğru şekilde ayarlandığından emin olun.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Değişkenlerin varlığını kontrol et
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL ve Anon Key .env dosyasında eksik. Lütfen .env dosyasını kontrol edin.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Adım 3: Oturum Oluşturma ve Yenileme
// Giriş veya kayıt sonrası `supabase-js` kütüphanesi oturumu tarayıcının
// local storage'ında otomatik olarak yönetir. Gelen session nesnesini manuel olarak
// saklamaya (örn: `setSession` veya eski `setAuth`) gerek yoktur.
// `useAuth` hook'undaki `onAuthStateChange` dinleyicisi bu değişiklikleri yakalayacaktır.
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  // Başarılı kayıt sonrası Supabase bir e-posta onayı gönderebilir (ayarlara bağlı).
  // Oturum, onAuthStateChange tarafından otomatik olarak güncellenir.
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // Başarılı giriş sonrası, oturum bilgisi `onAuthStateChange` tarafından yakalanır.
  return { data, error };
};

export const signOut = async () => {
  // Oturumu sonlandırır ve `onAuthStateChange`'i tetikler.
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Not: `getCurrentUser` fonksiyonu, auth state'i merkezi olarak yöneten
// `useAuth` hook'u lehine kaldırılmıştır. Oturum bilgisi için hook kullanılmalıdır.
