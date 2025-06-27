/*
      # Budgie Tracker: Veritabanı Şeması ve RLS Politikaları

      Bu betik, "BudgieBreedingTracker" uygulaması için belirtilen tüm tablo yapılarını, ilişkileri ve güvenlik kurallarını oluşturur.

      ## 1. Tasarım Notları
      - **Kullanıcı Yönetimi**: İstek üzerine, Supabase'in `auth.users` tablosuyla senkronize bir `public.users` tablosu oluşturulmuştur. `public.users.id` sütunu, `auth.users.id`'ye birincil anahtar (PK) ve yabancı anahtar (FK) olarak bağlanmıştır. Bu, `ON DELETE CASCADE` sayesinde bir kullanıcı silindiğinde tüm ilişkili verilerin otomatik olarak temizlenmesini sağlar.
      - **Otomatik Profil Oluşturma**: Yeni bir kullanıcı kaydolduğunda, bir trigger (`handle_new_user`) otomatik olarak `public.users` tablosuna ilgili kaydı ekler.
      - **Veri Bütünlüğü**: Tablolar arasındaki ilişkileri korumak için Foreign Key kısıtlamaları ve veri bütünlüğünü sağlamak için `ON DELETE` kuralları kullanılmıştır. `UNIQUE` kısıtlamaları, mükerrer kayıtları (örneğin, aynı kullanıcıya ait aynı halka numarasına sahip kuşlar) önler.
      - **Zaman Damgaları**: `handle_updated_at` adlı bir trigger, bir satırda değişiklik yapıldığında `updated_at` sütununu otomatik olarak günceller.
      - **RLS Politikaları**: Tüm tablolarda Satır Seviyesi Güvenlik (RLS) etkinleştirilmiştir. Politikalar, kullanıcıların yalnızca kendi verilerini görmesini ve yönetmesini sağlar.

      ## 2. Tablolar
      - `users`: Genel kullanıcı bilgilerini saklar. `auth.users` ile senkronizedir.
      - `birds`: Kuşların bireysel bilgilerini içerir.
      - `clutches`: Kuluçka dönemlerini temsil eder.
      - `eggs`: Kuluçkadaki yumurtaları takip eder.
      - `chicks`: Yumurtadan çıkan yavruların bilgilerini kaydeder.
      - `pedigree`: Kuşlar arasındaki soy ağacı (ebeveyn-çocuk) ilişkilerini tanımlar.

      ## 3. Özel Tipler ve Fonksiyonlar
      - `egg_status`: 'empty', 'uncertain', 'occupied', 'hatched'
      - `parental_relation`: 'father', 'mother'
      - `handle_new_user()`: `auth.users`'a yeni kullanıcı eklendiğinde `public.users`'a kayıt ekler.
      - `handle_updated_at()`: Kayıt güncellendiğinde `updated_at` alanını günceller.
    */

    -- 1. HELPER FUNCTIONS & CUSTOM TYPES

    -- Function to create a user profile when a new user signs up in auth.users
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.users (id, email)
      VALUES (NEW.id, NEW.email);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger to call handle_new_user on new user creation
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

    -- Function to automatically update `updated_at` timestamps
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Custom ENUM types for structured data
    DO $$ BEGIN
      CREATE TYPE public.egg_status AS ENUM ('empty', 'uncertain', 'occupied', 'hatched');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE public.parental_relation AS ENUM ('father', 'mother');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;


    -- 2. TABLE CREATION

    -- USERS Table
    -- This table stores public user data and is synced with auth.users.
    -- The `id` is a foreign key to `auth.users.id` with `ON DELETE CASCADE`
    -- to ensure data consistency when a user is deleted.
    CREATE TABLE IF NOT EXISTS public.users (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    -- BIRDS Table
    CREATE TABLE IF NOT EXISTS public.birds (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      name text NOT NULL,
      ring_number text NOT NULL,
      sex text,
      birth_date date,
      color text,
      photo_url text,
      notes text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(user_id, ring_number)
    );
    CREATE OR REPLACE TRIGGER on_birds_updated
      BEFORE UPDATE ON public.birds
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();

    -- CLUTCHES Table
    CREATE TABLE IF NOT EXISTS public.clutches (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      nest_name text NOT NULL,
      start_date date NOT NULL,
      expected_hatch_date date NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    CREATE OR REPLACE TRIGGER on_clutches_updated
      BEFORE UPDATE ON public.clutches
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();

    -- EGGS Table
    CREATE TABLE IF NOT EXISTS public.eggs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      clutch_id uuid NOT NULL REFERENCES public.clutches(id) ON DELETE CASCADE,
      position integer NOT NULL,
      status public.egg_status NOT NULL DEFAULT 'uncertain',
      laid_date date NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(clutch_id, position)
    );
    CREATE OR REPLACE TRIGGER on_eggs_updated
      BEFORE UPDATE ON public.eggs
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();

    -- CHICKS Table
    CREATE TABLE IF NOT EXISTS public.chicks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      egg_id uuid REFERENCES public.eggs(id) ON DELETE SET NULL,
      name text,
      hatch_date date NOT NULL,
      weight numeric(5, 2),
      notes text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    CREATE OR REPLACE TRIGGER on_chicks_updated
      BEFORE UPDATE ON public.chicks
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();

    -- PEDIGREE Table
    CREATE TABLE IF NOT EXISTS public.pedigree (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      child_id uuid NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
      parent_id uuid NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
      relation_type public.parental_relation NOT NULL,
      UNIQUE(child_id, parent_id, relation_type)
    );


    -- 3. ROW LEVEL SECURITY (RLS)
    -- Enable RLS for all tables
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.birds ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.clutches ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.eggs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.chicks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.pedigree ENABLE ROW LEVEL SECURITY;

    -- Policies for USERS
    DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
    CREATE POLICY "Users can view their own data"
      ON public.users
      FOR SELECT
      USING (id = (SELECT auth.uid()));

    DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
    CREATE POLICY "Users can update their own data"
      ON public.users
      FOR UPDATE
      USING (id = (SELECT auth.uid()))
      WITH CHECK (id = (SELECT auth.uid()));

    -- Policies for BIRDS
    DROP POLICY IF EXISTS "Users can manage their own birds" ON public.birds;
    CREATE POLICY "Users can manage their own birds"
      ON public.birds
      FOR ALL
      USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));

    -- Policies for CLUTCHES
    DROP POLICY IF EXISTS "Users can manage their own clutches" ON public.clutches;
    CREATE POLICY "Users can manage their own clutches"
      ON public.clutches
      FOR ALL
      USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));

    -- Policies for EGGS (access via clutch ownership)
    DROP POLICY IF EXISTS "Users can manage eggs in their own clutches" ON public.eggs;
    CREATE POLICY "Users can manage eggs in their own clutches"
      ON public.eggs
      FOR ALL
      USING ((SELECT user_id FROM public.clutches WHERE id = clutch_id) = (SELECT auth.uid()))
      WITH CHECK ((SELECT user_id FROM public.clutches WHERE id = clutch_id) = (SELECT auth.uid()));

    -- Policies for CHICKS
    DROP POLICY IF EXISTS "Users can manage their own chicks" ON public.chicks;
    CREATE POLICY "Users can manage their own chicks"
      ON public.chicks
      FOR ALL
      USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));

    -- Policies for PEDIGREE (access if user owns both child and parent birds)
    DROP POLICY IF EXISTS "Users can manage pedigree for their own birds" ON public.pedigree;
    CREATE POLICY "Users can manage pedigree for their own birds"
      ON public.pedigree
      FOR ALL
      USING (
        (SELECT user_id FROM public.birds WHERE id = child_id) = (SELECT auth.uid()) AND
        (SELECT user_id FROM public.birds WHERE id = parent_id) = (SELECT auth.uid())
      )
      WITH CHECK (
        (SELECT user_id FROM public.birds WHERE id = child_id) = (SELECT auth.uid()) AND
        (SELECT user_id FROM public.birds WHERE id = parent_id) = (SELECT auth.uid())
      );

    /*
      -- 4. EXAMPLE TEST QUERIES
      -- (Run these in the Supabase SQL Editor after logging in as a test user)

      -- Check current user
      -- SELECT auth.uid();

      -- After signing up, check if a profile was created in public.users
      -- SELECT * FROM public.users WHERE id = auth.uid();

      -- Create a bird for the current user (should succeed)
      -- INSERT INTO public.birds (user_id, name, ring_number)
      -- VALUES ((SELECT auth.uid()), 'Maviş', 'TR-001');

      -- Select birds (should only return birds owned by the current user)
      -- SELECT * FROM public.birds;
    */
