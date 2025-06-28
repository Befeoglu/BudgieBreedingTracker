/*
  # Fix Todos RLS Policy

  1. Problem
    - "Users can manage their own todos" policy already exists error
    - Need to drop and recreate with proper syntax

  2. Solution
    - Drop existing policy if it exists
    - Create new policy with correct auth.uid() syntax
    - Ensure proper permissions for all CRUD operations
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;

-- Create new policy with proper syntax
CREATE POLICY "Users can manage their own todos"
  ON public.todos
  FOR ALL
  TO public
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Verify the policy was created correctly
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'todos' AND schemaname = 'public';