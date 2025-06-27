import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Adım 1: Oturum Bilgilerini Çekme
    // Uygulama ilk yüklendiğinde mevcut oturumu kontrol et.
    // supabase-js v2, oturumu otomatik olarak localStorage'da saklar ve yeniler.
    const getInitialSession = async () => {
      try {
        // `getSession` metodu, local storage'daki oturumu doğrular.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Oturum alınırken hata:", error.message);
          throw new Error("Oturum alınırken bir hata oluştu.");
        }

        if (!session) {
          console.log("Aktif bir oturum bulunamadı. Kullanıcı giriş yapmalı.");
        }
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (e) {
        // Hata durumunda kullanıcı state'ini temizle
        console.error(e);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Adım 4: Auth State Dinleyicisi
    // Oturum durumundaki değişiklikleri (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED vb.) dinle.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log(`Auth state değişikliği: ${_event}`);
        
        // Gelen yeni oturum bilgisiyle state'i güncelle.
        setSession(session);
        setUser(session?.user ?? null);
        
        // Auth state değiştiğinde yükleme durumunu tekrar ayarlamaya gerek yok,
        // çünkü bu genellikle ilk yüklemeden sonra olur.
        setLoading(false);
      }
    );

    // Cleanup: Component DOM'dan kaldırıldığında listener'ı temizle.
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Hook'un döndürdüğü değerler
  return { user, session, loading };
};
