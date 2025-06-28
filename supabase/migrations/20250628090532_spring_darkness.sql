/*
  # Kapsamlı Supabase Veri Modeli - BudgieBreedingTracker

  Bu migration dosyası aşağıdaki tabloları oluşturur:
  1. Users - Kullanıcı profilleri (auth.users ile senkronize)
  2. Birds - Kuş kayıtları
  3. Clutches - Kuluçka/yuva kayıtları
  4. Eggs - Yumurta takibi
  5. Chicks - Yavru kayıtları
  6. Pedigree - Soy ağacı ilişkileri
  7. Daily Logs - Günlük takip kayıtları
  8. Todos - Görev listesi
  9. Backups - Yedekleme kayıtları
  10. Sync Logs - Senkronizasyon logları

  Güvenlik:
  - Tüm tablolarda RLS (Row Level Security) aktif
  - Kullanıcı bazlı erişim politikaları
  - Optimized auth function calls
*/

-- ============================================================================
-- 1. USERS TABLOSU (auth.users ile senkronize profil tablosu)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'tr' CHECK (language IN ('tr', 'en')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. BIRDS TABLOSU (kuş kayıtları)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.birds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ring_number TEXT NOT NULL,
  species TEXT DEFAULT 'Muhabbet Kuşu',
  gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL,
  birth_date DATE,
  color_mutation TEXT,
  photo_url TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: ring_number per user
  CONSTRAINT unique_ring_per_user UNIQUE (user_id, ring_number)
);

-- ============================================================================
-- 3. CLUTCHES TABLOSU (kuluçka/yuva kayıtları)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clutches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nest_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  expected_hatch_date DATE NOT NULL,
  actual_hatch_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure expected_hatch_date is after start_date
  CONSTRAINT valid_hatch_date CHECK (expected_hatch_date > start_date)
);

-- ============================================================================
-- 4. EGGS TABLOSU (yumurta takibi)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.eggs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clutch_id UUID NOT NULL REFERENCES public.clutches(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'empty' CHECK (status IN ('empty', 'uncertain', 'occupied', 'hatched')),
  laid_date DATE,
  expected_hatch_date DATE,
  actual_hatch_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: position per clutch
  CONSTRAINT unique_position_per_clutch UNIQUE (clutch_id, position),
  -- Ensure position is positive
  CONSTRAINT positive_position CHECK (position > 0)
);

-- ============================================================================
-- 5. CHICKS TABLOSU (yavru kayıtları)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  egg_id UUID REFERENCES public.eggs(id) ON DELETE SET NULL,
  name TEXT,
  hatch_date DATE NOT NULL,
  weight NUMERIC(5,2), -- grams with 2 decimal places
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure weight is positive if provided
  CONSTRAINT positive_weight CHECK (weight IS NULL OR weight > 0)
);

-- ============================================================================
-- 6. PEDIGREE TABLOSU (soy ağacı ilişkileri)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pedigree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('father', 'mother')),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one father and one mother per child
  CONSTRAINT unique_parent_relation UNIQUE (child_id, relation_type),
  -- Prevent self-referencing
  CONSTRAINT no_self_parent CHECK (child_id != parent_id)
);

-- ============================================================================
-- 7. DAILY_LOGS TABLOSU (günlük takip kayıtları)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  clutch_id UUID REFERENCES public.clutches(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  temperature NUMERIC(4,1), -- Celsius with 1 decimal place
  humidity NUMERIC(4,1), -- Percentage with 1 decimal place
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one log per clutch per date
  CONSTRAINT unique_log_per_clutch_date UNIQUE (clutch_id, log_date),
  -- Reasonable temperature range
  CONSTRAINT valid_temperature CHECK (temperature IS NULL OR (temperature >= -10 AND temperature <= 50)),
  -- Valid humidity range
  CONSTRAINT valid_humidity CHECK (humidity IS NULL OR (humidity >= 0 AND humidity <= 100))
);

-- ============================================================================
-- 8. TODOS TABLOSU (görev listesi)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 9. BACKUPS TABLOSU (yedekleme kayıtları)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automatic')),
  backup_date TIMESTAMPTZ DEFAULT now(),
  backup_data JSONB NOT NULL,
  backup_size BIGINT,
  record_counts JSONB,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 10. SYNC_LOGS TABLOSU (senkronizasyon logları)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  conflict_type TEXT,
  resolution TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES (performans optimizasyonu)
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Birds table indexes
CREATE INDEX IF NOT EXISTS idx_birds_user_id ON public.birds(user_id);
CREATE INDEX IF NOT EXISTS idx_birds_ring_number ON public.birds(ring_number);
CREATE INDEX IF NOT EXISTS idx_birds_species ON public.birds(species);
CREATE INDEX IF NOT EXISTS idx_birds_gender ON public.birds(gender);
CREATE INDEX IF NOT EXISTS idx_birds_is_favorite ON public.birds(is_favorite);

-- Clutches table indexes
CREATE INDEX IF NOT EXISTS idx_clutches_user_id ON public.clutches(user_id);
CREATE INDEX IF NOT EXISTS idx_clutches_status ON public.clutches(status);
CREATE INDEX IF NOT EXISTS idx_clutches_start_date ON public.clutches(start_date);

-- Eggs table indexes
CREATE INDEX IF NOT EXISTS idx_eggs_clutch_id ON public.eggs(clutch_id);
CREATE INDEX IF NOT EXISTS idx_eggs_status ON public.eggs(status);

-- Chicks table indexes
CREATE INDEX IF NOT EXISTS idx_chicks_user_id ON public.chicks(user_id);
CREATE INDEX IF NOT EXISTS idx_chicks_egg_id ON public.chicks(egg_id);
CREATE INDEX IF NOT EXISTS idx_chicks_hatch_date ON public.chicks(hatch_date);

-- Pedigree table indexes
CREATE INDEX IF NOT EXISTS idx_pedigree_child_id ON public.pedigree(child_id);
CREATE INDEX IF NOT EXISTS idx_pedigree_parent_id ON public.pedigree(parent_id);

-- Daily logs table indexes
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_clutch_id ON public.daily_logs(clutch_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(log_date);

-- Todos table indexes
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);

-- Backups table indexes
CREATE INDEX IF NOT EXISTS idx_backups_user_id ON public.backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_date ON public.backups(backup_date);

-- Sync logs table indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON public.sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_operation ON public.sync_logs(operation);

-- ============================================================================
-- TRIGGERS (otomatik timestamp güncelleme)
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER handle_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_birds
  BEFORE UPDATE ON public.birds
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_clutches
  BEFORE UPDATE ON public.clutches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_eggs
  BEFORE UPDATE ON public.eggs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_chicks
  BEFORE UPDATE ON public.chicks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_daily_logs
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_todos
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- USER PROFILE SYNC FUNCTION
-- ============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clutches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eggs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedigree ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Consolidated users policies with optimized auth calls
CREATE POLICY "Users can manage their own data"
  ON public.users
  FOR ALL
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- ============================================================================
-- BIRDS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can manage their own birds"
  ON public.birds
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- CLUTCHES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can manage their own clutches"
  ON public.clutches
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- EGGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can manage eggs from their clutches"
  ON public.eggs
  FOR ALL
  TO authenticated
  USING (
    clutch_id IN (
      SELECT id FROM public.clutches 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    clutch_id IN (
      SELECT id FROM public.clutches 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- CHICKS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can manage their own chicks"
  ON public.chicks
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PEDIGREE TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can manage pedigree for their birds"
  ON public.pedigree
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.birds 
      WHERE user_id = (SELECT auth.uid())
    )
    AND parent_id IN (
      SELECT id FROM public.birds 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.birds 
      WHERE user_id = (SELECT auth.uid())
    )
    AND parent_id IN (
      SELECT id FROM public.birds 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- DAILY_LOGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can manage their own daily logs"
  ON public.daily_logs
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- TODOS TABLE POLICIES
-- ============================================================================

-- Drop existing policy to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;

CREATE POLICY "Users can manage their own todos"
  ON public.todos
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- BACKUPS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can manage their own backups"
  ON public.backups
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- SYNC_LOGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can manage their own sync logs"
  ON public.sync_logs
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get table columns (for diagnostics)
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT, is_nullable TEXT, column_default TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = get_table_columns.table_name
  ORDER BY c.ordinal_position;
END;
$$;

-- Function to get RLS policies (for diagnostics)
CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS TABLE(
  schemaname TEXT,
  tablename TEXT,
  policyname TEXT,
  permissive TEXT,
  roles TEXT[],
  cmd TEXT,
  qual TEXT,
  with_check TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.schemaname::TEXT,
    p.tablename::TEXT,
    p.policyname::TEXT,
    p.permissive::TEXT,
    p.roles,
    p.cmd::TEXT,
    p.qual::TEXT,
    p.with_check::TEXT
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename, p.policyname;
END;
$$;

-- Function to execute SQL (for diagnostics - read-only)
CREATE OR REPLACE FUNCTION public.execute_sql(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Only allow SELECT queries for security
  IF UPPER(TRIM(query)) NOT LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- This is a placeholder - actual implementation would need dynamic SQL
  -- For security reasons, we'll return a message instead
  RETURN jsonb_build_object(
    'message', 'SQL execution requires manual intervention for security',
    'query', query
  );
END;
$$;