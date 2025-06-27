/*
      # `health_notes` Sütununu `notes` Olarak Yeniden Adlandırma

      Bu migrasyon, `birds` tablosundaki `health_notes` sütununu, uygulama genelinde daha tutarlı ve genel amaçlı bir adlandırma olan `notes` olarak değiştirir.

      ## 1. Değişiklikler
      - **`birds` Tablosu**: `health_notes` sütunu `notes` olarak yeniden adlandırıldı. Bu değişiklik, `Bird` arayüzü ve form bileşenleriyle tam uyum sağlar.

      ## 2. Gerekçe
      `health_notes` adı çok spesifik kalıyordu. Sütunu `notes` olarak yeniden adlandırmak, sadece sağlık notlarını değil, kuşla ilgili her türlü genel notu saklamak için daha esnek bir alan sunar.
    */

    ALTER TABLE public.birds
    RENAME COLUMN health_notes TO notes;