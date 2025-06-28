/*
  # Complete Database Schema for BudgieBreedingTracker

  1. Tables
    - users (user profiles)
    - birds (bird records)
    - clutches (breeding sessions)
    - eggs (individual eggs)
    - chicks (hatched chicks)
    - todos (user tasks)
    - pedigree (parent-child relationships)
    - backups (backup records)
    - sync_logs (synchronization logs)

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Add updated_at triggers
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. USERS table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'tr' CHECK (language IN ('tr', 'en')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BIRDS table
CREATE TABLE public.birds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ring_number TEXT NOT NULL,
  species TEXT DEFAULT 'Muhabbet Kuşu',
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  color_mutation TEXT,
  photo_url TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ring_number)
);

-- 3. CLUTCHES table
CREATE TABLE public.clutches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nest_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  expected_hatch_date DATE NOT NULL,
  actual_hatch_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. EGGS table
CREATE TABLE public.eggs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clutch_id UUID NOT NULL REFERENCES public.clutches(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'empty' CHECK (status IN ('empty', 'uncertain', 'occupied', 'hatched')),
  laid_date DATE,
  expected_hatch_date DATE,
  actual_hatch_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clutch_id, position)
);

-- 5. CHICKS table
CREATE TABLE public.chicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  egg_id UUID REFERENCES public.eggs(id) ON DELETE SET NULL,
  name TEXT,
  hatch_date DATE NOT NULL,
  weight NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TODOS table
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PEDIGREE table
CREATE TABLE public.pedigree (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('father', 'mother')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, relation_type)
);

-- 8. BACKUPS table
CREATE TABLE public.backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automatic')),
  backup_date TIMESTAMPTZ DEFAULT now(),
  backup_data JSONB NOT NULL,
  backup_size BIGINT,
  record_counts JSONB,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. SYNC_LOGS table
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  conflict_type TEXT,
  resolution TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clutches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eggs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedigree ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can manage their own profile"
  ON public.users
  FOR ALL
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for birds table
CREATE POLICY "Users can manage their own birds"
  ON public.birds
  FOR ALL
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for clutches table
CREATE POLICY "Users can manage their own clutches"
  ON public.clutches
  FOR ALL
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for eggs table
CREATE POLICY "Users can manage eggs from their clutches"
  ON public.eggs
  FOR ALL
  TO public
  USING (
    clutch_id IN (
      SELECT id FROM public.clutches WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    clutch_id IN (
      SELECT id FROM public.clutches WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chicks table
CREATE POLICY "Users can manage their own chicks"
  ON public.chicks
  FOR ALL
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for todos table
CREATE POLICY "Users can manage their own todos"
  ON public.todos
  FOR ALL
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for pedigree table
CREATE POLICY "Users can manage pedigree for their birds"
  ON public.pedigree
  FOR ALL
  TO public
  USING (
    child_id IN (SELECT id FROM public.birds WHERE user_id = auth.uid()) AND
    parent_id IN (SELECT id FROM public.birds WHERE user_id = auth.uid())
  )
  WITH CHECK (
    child_id IN (SELECT id FROM public.birds WHERE user_id = auth.uid()) AND
    parent_id IN (SELECT id FROM public.birds WHERE user_id = auth.uid())
  );

-- RLS Policies for backups table
CREATE POLICY "Users can manage their own backups"
  ON public.backups
  FOR ALL
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for sync_logs table
CREATE POLICY "Users can view their own sync logs"
  ON public.sync_logs
  FOR ALL
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_birds_updated
  BEFORE UPDATE ON public.birds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_clutches_updated
  BEFORE UPDATE ON public.clutches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_eggs_updated
  BEFORE UPDATE ON public.eggs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_chicks_updated
  BEFORE UPDATE ON public.chicks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_todos_updated
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_birds_user_id ON public.birds(user_id);
CREATE INDEX idx_birds_ring_number ON public.birds(user_id, ring_number);
CREATE INDEX idx_clutches_user_id ON public.clutches(user_id);
CREATE INDEX idx_clutches_status ON public.clutches(user_id, status);
CREATE INDEX idx_eggs_clutch_id ON public.eggs(clutch_id);
CREATE INDEX idx_chicks_user_id ON public.chicks(user_id);
CREATE INDEX idx_chicks_hatch_date ON public.chicks(user_id, hatch_date);
CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_completed ON public.todos(user_id, completed);
CREATE INDEX idx_pedigree_child ON public.pedigree(child_id);
CREATE INDEX idx_pedigree_parent ON public.pedigree(parent_id);
CREATE INDEX idx_backups_user_id ON public.backups(user_id);
CREATE INDEX idx_sync_logs_user_id ON public.sync_logs(user_id);