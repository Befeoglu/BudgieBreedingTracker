/*
  # Fix RLS Performance and Policy Optimization

  1. Performance Improvements
    - Optimize auth function calls in RLS policies using subqueries
    - Remove duplicate permissive policies for better performance
    - Consolidate redundant policies into single, efficient policies

  2. Changes Made
    - Replace `auth.uid()` with `(SELECT auth.uid())` for better query planning
    - Merge duplicate policies on users table
    - Optimize todos table RLS policy
    - Maintain same security level with better performance

  3. Security
    - All existing security constraints are preserved
    - Users can only access their own data
    - No changes to permission levels
*/

-- Start transaction for safety
BEGIN;

-- Drop existing policies on users table to recreate optimized versions
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;

-- Create optimized single policy for users table that handles all operations
CREATE POLICY "Users can manage their own data"
  ON public.users
  FOR ALL
  TO public
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Drop and recreate optimized policy for todos table
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;

CREATE POLICY "Users can manage their own todos"
  ON public.todos
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Optimize other table policies with subquery pattern
-- Birds table
DROP POLICY IF EXISTS "Users can manage their own birds" ON public.birds;
CREATE POLICY "Users can manage their own birds"
  ON public.birds
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Clutches table
DROP POLICY IF EXISTS "Users can manage their own clutches" ON public.clutches;
CREATE POLICY "Users can manage their own clutches"
  ON public.clutches
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Eggs table (uses clutch ownership check)
DROP POLICY IF EXISTS "Users can manage eggs in their own clutches" ON public.eggs;
CREATE POLICY "Users can manage eggs in their own clutches"
  ON public.eggs
  FOR ALL
  TO public
  USING ((
    SELECT clutches.user_id
    FROM clutches
    WHERE clutches.id = eggs.clutch_id
  ) = (SELECT auth.uid()))
  WITH CHECK ((
    SELECT clutches.user_id
    FROM clutches
    WHERE clutches.id = eggs.clutch_id
  ) = (SELECT auth.uid()));

-- Chicks table
DROP POLICY IF EXISTS "Users can manage their own chicks" ON public.chicks;
CREATE POLICY "Users can manage their own chicks"
  ON public.chicks
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Pedigree table (uses bird ownership check)
DROP POLICY IF EXISTS "Users can manage pedigree for their own birds" ON public.pedigree;
CREATE POLICY "Users can manage pedigree for their own birds"
  ON public.pedigree
  FOR ALL
  TO public
  USING ((
    (SELECT birds.user_id FROM birds WHERE birds.id = pedigree.child_id) = (SELECT auth.uid())
  ) AND (
    (SELECT birds.user_id FROM birds WHERE birds.id = pedigree.parent_id) = (SELECT auth.uid())
  ))
  WITH CHECK ((
    (SELECT birds.user_id FROM birds WHERE birds.id = pedigree.child_id) = (SELECT auth.uid())
  ) AND (
    (SELECT birds.user_id FROM birds WHERE birds.id = pedigree.parent_id) = (SELECT auth.uid())
  ));

-- Commit the transaction
COMMIT;

-- Add performance analysis comment
COMMENT ON POLICY "Users can manage their own data" ON public.users IS 
'Optimized RLS policy using subquery pattern for better performance. Replaces multiple permissive policies.';

COMMENT ON POLICY "Users can manage their own todos" ON public.todos IS 
'Optimized RLS policy using subquery pattern to prevent auth function re-evaluation per row.';