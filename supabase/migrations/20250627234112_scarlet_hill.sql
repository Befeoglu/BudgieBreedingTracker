/*
  # Kullanıcı Profil Alanları Ekleme

  Bu migrasyon, kullanıcı profil bilgilerini genişletmek için `users` tablosuna yeni sütunlar ekler.

  ## 1. Yeni Sütunlar
  - `full_name`: Kullanıcının tam adı
  - `avatar_url`: Profil fotoğrafı URL'si
  - Mevcut sütunlar korunur ve güncellenir

  ## 2. Güvenlik
  - Mevcut RLS politikaları korunur
  - Kullanıcılar sadece kendi profillerini düzenleyebilir
*/

-- Kullanıcı profil alanlarını ekle
DO $$
BEGIN
  -- full_name sütunu ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN full_name text;
  END IF;

  -- avatar_url sütunu ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url text;
  END IF;
END $$;