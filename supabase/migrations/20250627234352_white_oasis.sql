/*
  # Fix Supabase Linter Warnings

  This migration addresses all the linter warnings:
  1. Auth RLS Initialization Plan - Optimizes RLS policies for better performance
  2. Function Search Path Mutable - Secures functions by setting search_path
  3. Leaked Password Protection - Note about enabling this in Supabase dashboard

  ## 1. Performance Optimizations
  - Updates RLS policies to use `(select auth.uid())` instead of `auth.uid()` for better performance
  - This prevents re-evaluation of auth functions for each row

  ## 2. Security Improvements
  - Updates functions to include `SET search_path = 'public'` to prevent search path hijacking
  - This ensures functions always resolve objects within the public schema

  ## 3. Password Protection
  - The leaked password protection must be enabled in the Supabase dashboard
  - Go to Authentication > Settings > Password Protection and enable it
*/

-- 1. Fix Auth RLS Performance Issues
-- Update users table policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (id = (select auth.uid()));

-- Update todos table policy
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
CREATE POLICY "Users can manage their own todos"
  ON public.todos
  FOR ALL
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Update birds table policy
DROP POLICY IF EXISTS "Users can manage their own birds" ON public.birds;
CREATE POLICY "Users can manage their own birds"
  ON public.birds
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Update clutches table policy
DROP POLICY IF EXISTS "Users can manage their own clutches" ON public.clutches;
CREATE POLICY "Users can manage their own clutches"
  ON public.clutches
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Update eggs table policy
DROP POLICY IF EXISTS "Users can manage eggs in their own clutches" ON public.eggs;
CREATE POLICY "Users can manage eggs in their own clutches"
  ON public.eggs
  FOR ALL
  USING ((SELECT user_id FROM public.clutches WHERE id = clutch_id) = (select auth.uid()))
  WITH CHECK ((SELECT user_id FROM public.clutches WHERE id = clutch_id) = (select auth.uid()));

-- Update chicks table policy
DROP POLICY IF EXISTS "Users can manage their own chicks" ON public.chicks;
CREATE POLICY "Users can manage their own chicks"
  ON public.chicks
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Update pedigree table policy
DROP POLICY IF EXISTS "Users can manage pedigree for their own birds" ON public.pedigree;
CREATE POLICY "Users can manage pedigree for their own birds"
  ON public.pedigree
  FOR ALL
  USING (
    (SELECT user_id FROM public.birds WHERE id = child_id) = (select auth.uid()) AND
    (SELECT user_id FROM public.birds WHERE id = parent_id) = (select auth.uid())
  )
  WITH CHECK (
    (SELECT user_id FROM public.birds WHERE id = child_id) = (select auth.uid()) AND
    (SELECT user_id FROM public.birds WHERE id = parent_id) = (select auth.uid())
  );

-- 2. Fix Function Security Issues
-- Secure handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Secure handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

/*
  ## Manual Action Required: Enable Leaked Password Protection
  
  To fix the "Leaked Password Protection Disabled" warning:
  1. Go to your Supabase dashboard
  2. Navigate to Authentication > Settings
  3. Scroll down to "Password Protection"
  4. Enable "Check for leaked passwords"
  
  This will prevent users from using passwords that have been compromised in data breaches.
*/