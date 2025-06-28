/*
  # Optimize RLS Policies for Better Performance

  This migration optimizes Row Level Security (RLS) policies to improve query performance
  by preventing unnecessary re-evaluation of auth.uid() for each row.

  ## Changes Made
  - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
  - This creates a single evaluation per query instead of per row
  - Significantly improves performance at scale

  ## Tables Updated
  - users
  - birds  
  - clutches
  - eggs
  - chicks
  - todos
  - pedigree
  - backups
  - sync_logs
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage their own birds" ON public.birds;
DROP POLICY IF EXISTS "Users can manage their own clutches" ON public.clutches;
DROP POLICY IF EXISTS "Users can manage eggs from their clutches" ON public.eggs;
DROP POLICY IF EXISTS "Users can manage their own chicks" ON public.chicks;
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can manage pedigree for their birds" ON public.pedigree;
DROP POLICY IF EXISTS "Users can manage their own backups" ON public.backups;
DROP POLICY IF EXISTS "Users can view their own sync logs" ON public.sync_logs;

-- Create optimized RLS policies with (select auth.uid())

-- Users table policy
CREATE POLICY "Users can manage their own profile"
  ON public.users
  FOR ALL
  TO public
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Birds table policy
CREATE POLICY "Users can manage their own birds"
  ON public.birds
  FOR ALL
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Clutches table policy
CREATE POLICY "Users can manage their own clutches"
  ON public.clutches
  FOR ALL
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Eggs table policy
CREATE POLICY "Users can manage eggs from their clutches"
  ON public.eggs
  FOR ALL
  TO public
  USING (
    clutch_id IN (
      SELECT id FROM public.clutches WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    clutch_id IN (
      SELECT id FROM public.clutches WHERE user_id = (select auth.uid())
    )
  );

-- Chicks table policy
CREATE POLICY "Users can manage their own chicks"
  ON public.chicks
  FOR ALL
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Todos table policy
CREATE POLICY "Users can manage their own todos"
  ON public.todos
  FOR ALL
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Pedigree table policy
CREATE POLICY "Users can manage pedigree for their birds"
  ON public.pedigree
  FOR ALL
  TO public
  USING (
    child_id IN (SELECT id FROM public.birds WHERE user_id = (select auth.uid())) AND
    parent_id IN (SELECT id FROM public.birds WHERE user_id = (select auth.uid()))
  )
  WITH CHECK (
    child_id IN (SELECT id FROM public.birds WHERE user_id = (select auth.uid())) AND
    parent_id IN (SELECT id FROM public.birds WHERE user_id = (select auth.uid()))
  );

-- Backups table policy
CREATE POLICY "Users can manage their own backups"
  ON public.backups
  FOR ALL
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Sync logs table policy
CREATE POLICY "Users can view their own sync logs"
  ON public.sync_logs
  FOR ALL
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));