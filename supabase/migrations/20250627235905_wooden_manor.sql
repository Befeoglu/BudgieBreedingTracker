/*
  # Fix User Table and RLS Policies

  1. Add missing updated_at column to users table
  2. Fix RLS policies to use proper auth.uid() syntax
  3. Ensure triggers are properly configured

  This migration fixes the uid() function errors and ensures proper RLS functionality.
*/

-- Add updated_at column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Ensure handle_updated_at function exists with proper security
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_users_updated ON public.users;

CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Fix RLS policies for users table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;

-- Recreate policies with proper auth.uid() syntax
CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  TO public
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  TO public
  USING (id = (SELECT auth.uid()));

-- Fix RLS policies for other tables that might have similar issues
-- Update todos table policies
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;

CREATE POLICY "Users can manage their own todos"
  ON public.todos
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Update birds table policies
DROP POLICY IF EXISTS "Users can manage their own birds" ON public.birds;

CREATE POLICY "Users can manage their own birds"
  ON public.birds
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Update clutches table policies
DROP POLICY IF EXISTS "Users can manage their own clutches" ON public.clutches;

CREATE POLICY "Users can manage their own clutches"
  ON public.clutches
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Update chicks table policies
DROP POLICY IF EXISTS "Users can manage their own chicks" ON public.chicks;

CREATE POLICY "Users can manage their own chicks"
  ON public.chicks
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Update eggs table policies (through clutches relationship)
DROP POLICY IF EXISTS "Users can manage eggs in their own clutches" ON public.eggs;

CREATE POLICY "Users can manage eggs in their own clutches"
  ON public.eggs
  FOR ALL
  TO public
  USING ((
    SELECT clutches.user_id
    FROM public.clutches
    WHERE clutches.id = eggs.clutch_id
  ) = (SELECT auth.uid()))
  WITH CHECK ((
    SELECT clutches.user_id
    FROM public.clutches
    WHERE clutches.id = eggs.clutch_id
  ) = (SELECT auth.uid()));

-- Update pedigree table policies
DROP POLICY IF EXISTS "Users can manage pedigree for their own birds" ON public.pedigree;

CREATE POLICY "Users can manage pedigree for their own birds"
  ON public.pedigree
  FOR ALL
  TO public
  USING ((
    (SELECT birds.user_id FROM public.birds WHERE birds.id = pedigree.child_id) = (SELECT auth.uid())
  ) AND (
    (SELECT birds.user_id FROM public.birds WHERE birds.id = pedigree.parent_id) = (SELECT auth.uid())
  ))
  WITH CHECK ((
    (SELECT birds.user_id FROM public.birds WHERE birds.id = pedigree.child_id) = (SELECT auth.uid())
  ) AND (
    (SELECT birds.user_id FROM public.birds WHERE birds.id = pedigree.parent_id) = (SELECT auth.uid())
  ));