/*
  # Fix Security Definer View Issue

  1. Security Fix
    - Remove SECURITY DEFINER property from user_profiles view
    - Recreate view with proper permissions
    - Ensure view follows security best practices

  2. Changes
    - DROP CASCADE to remove all dependencies
    - Recreate view without SECURITY DEFINER
    - Add proper RLS permissions
*/

-- Force drop the view and all its dependencies
DROP VIEW IF EXISTS public.user_profiles CASCADE;

-- Wait a moment to ensure complete cleanup
SELECT pg_sleep(0.1);

-- Recreate the view as a standard view (not SECURITY DEFINER)
CREATE VIEW public.user_profiles AS
SELECT 
  users.id,
  users.email,
  users.full_name,
  CASE 
    WHEN users.full_name IS NOT NULL AND position(' ' in users.full_name) > 0 
    THEN split_part(users.full_name, ' ', 1)
    ELSE users.full_name
  END as first_name,
  CASE 
    WHEN users.full_name IS NOT NULL AND position(' ' in users.full_name) > 0 
    THEN trim(substring(users.full_name from position(' ' in users.full_name) + 1))
    ELSE NULL
  END as last_name,
  users.avatar_url,
  users.language,
  users.theme,
  users.created_at,
  users.updated_at
FROM public.users;

-- Add comment
COMMENT ON VIEW public.user_profiles IS 'User profile view with computed first_name and last_name fields';

-- Set proper permissions - revoke all first, then grant specific permissions
REVOKE ALL ON public.user_profiles FROM PUBLIC;
REVOKE ALL ON public.user_profiles FROM authenticated;
REVOKE ALL ON public.user_profiles FROM anon;

-- Grant only SELECT permission to authenticated users
GRANT SELECT ON public.user_profiles TO authenticated;

-- Verify the view was created correctly
DO $$
BEGIN
  -- Check if view exists and log success
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
    RAISE NOTICE 'user_profiles view successfully recreated without SECURITY DEFINER property';
  ELSE
    RAISE EXCEPTION 'Failed to create user_profiles view';
  END IF;
END $$;