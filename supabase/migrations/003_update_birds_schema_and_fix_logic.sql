/*
      # Kuş Şemasını Güncelleme ve RLS Politikalarını İyileştirme

      Bu migrasyon, "Kullanıcı profili bulunamadı" hatasını çözmek ve veritabanı şemasını uygulama mantığıyla uyumlu hale getirmek için kritik değişiklikler içerir.

      ## 1. Değişiklikler
      - **`birds` Tablosu Güncellemesi**: `BirdForm.tsx` bileşeninde kullanılan alanlarla eşleşmesi için `birds` tablosuna yeni sütunlar eklenmiş ve mevcut sütunlar değiştirilmiştir.
        - **Eklenen Sütunlar**: `species`, `gender`, `color_mutation`, `health_notes`, `is_favorite`.
        - **Değiştirilen Sütunlar**: `sex` -> `gender`, `color` -> `color_mutation`, `notes` -> `health_notes`. Bu, kod ile şema arasında tutarlılık sağlar.
      - **`users` Tablosu RLS Politikası**: `users` tablosu için RLS politikası, kullanıcıların yalnızca kendi profillerini yönetebilmesini sağlamak üzere yeniden oluşturulmuştur.
      - **`birds` Tablosu RLS Politikası**: `birds` tablosu için politika, kullanıcıların yalnızca kendi kuşlarını yönetebilmesini garanti altına alacak şekilde `user_id` üzerinden `auth.uid()` kontrolü ile güncellenmiştir.

      ## 2. Hata Çözümü
      Bu şema ve RLS düzeltmeleri, istemci kodunda yapılacak olan değişiklikle birlikte, kuş ekleme sırasında alınan "Kullanıcı profili bulunamadı" hatasını kökünden çözer. Artık kuş eklenirken gereksiz bir profil sorgusu yapılmayacak, bunun yerine RLS politikaları güvenliği sağlayacaktır.
    */

    -- 1. `birds` tablosunu uygulama formuyla uyumlu hale getirme
    DO $$
    BEGIN
      -- Eski sütunları yeniden adlandır (veri kaybını önlemek için)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='birds' AND column_name='sex') THEN
        ALTER TABLE public.birds RENAME COLUMN sex TO gender;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='birds' AND column_name='color') THEN
        ALTER TABLE public.birds RENAME COLUMN color TO color_mutation;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='birds' AND column_name='notes') THEN
        ALTER TABLE public.birds RENAME COLUMN health_notes;
      END IF;

      -- Yeni sütunları ekle
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='birds' AND column_name='species') THEN
        ALTER TABLE public.birds ADD COLUMN species text;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='birds' AND column_name='is_favorite') THEN
        ALTER TABLE public.birds ADD COLUMN is_favorite boolean DEFAULT false;
      END IF;

      -- Sütun tiplerini güncelle
      ALTER TABLE public.birds ALTER COLUMN gender TYPE text;
      ALTER TABLE public.birds ALTER COLUMN color_mutation TYPE text;
      ALTER TABLE public.birds ALTER COLUMN health_notes TYPE text;
    END $$;


    -- 2. `users` tablosu için RLS politikasını doğrulama
    -- Bu politika, kullanıcıların kendi profil verilerini yönetmesine olanak tanır.
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;
    CREATE POLICY "Users can manage their own profile"
      ON public.users
      FOR ALL
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);


    -- 3. `birds` tablosu için RLS politikasını doğrulama
    -- Bu politika, kullanıcıların yalnızca kendi kuş kayıtlarını yönetmesini sağlar.
    ALTER TABLE public.birds ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage their own birds" ON public.birds;
    CREATE POLICY "Users can manage their own birds"
      ON public.birds
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
