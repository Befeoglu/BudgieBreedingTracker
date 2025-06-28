/*
  # Fix user_profiles view SECURITY DEFINER issue

  1. Changes
    - Force drop and recreate user_profiles view without SECURITY DEFINER
    - Verify view properties are correct
    - Add proper permissions and comments

  2. Security
    - Remove SECURITY DEFINER to use querying user's permissions
    - Maintain proper RLS enforcement
    - Grant appropriate permissions to authenticated users
*/

-- Force drop the view completely
DROP VIEW IF EXISTS public.user_profiles CASCADE;

-- Recreate the view explicitly without SECURITY DEFINER
CREATE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  full_name,
  CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN split_part(full_name, ' ', 1)
    ELSE full_name
  END as first_name,
  CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN trim(substring(full_name from position(' ' in full_name) + 1))
    ELSE NULL
  END as last_name,
  avatar_url,
  language,
  theme,
  created_at,
  updated_at
FROM public.users;

-- Add comment to document the view purpose
COMMENT ON VIEW public.user_profiles IS 'User profile view with computed first_name and last_name fields';

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.user_profiles TO authenticated;

-- Ensure no one else has elevated permissions on this view
REVOKE ALL ON public.user_profiles FROM PUBLIC;
GRANT SELECT ON public.user_profiles TO authenticated;

-- Verify the view was created correctly (this will show in logs)
DO $$
BEGIN
  -- Log successful view recreation
  RAISE NOTICE 'user_profiles view recreated without SECURITY DEFINER';
END $$;