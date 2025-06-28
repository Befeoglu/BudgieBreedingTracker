/*
  # Fix Security Warnings

  1. Security Issues Fixed
    - Remove SECURITY DEFINER from user_profiles view
    - Fix search_path for handle_updated_at function
    - Add security hardening measures

  2. Changes Made
    - Recreate user_profiles view without SECURITY DEFINER
    - Update handle_updated_at function with fixed search_path
    - Add function security attributes
*/

-- Fix handle_updated_at function with proper search_path
CREATE OR REPLACE FUNCTION handle_updated_at()
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

-- Recreate user_profiles view without SECURITY DEFINER
DROP VIEW IF EXISTS user_profiles;

CREATE VIEW user_profiles AS
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
FROM users;

-- Add comment to document the view purpose
COMMENT ON VIEW user_profiles IS 'User profile view with computed first_name and last_name fields';

-- Ensure proper permissions on the view
GRANT SELECT ON user_profiles TO authenticated;

-- Add additional security hardening for new functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, language, theme)
  VALUES (NEW.id, NEW.email, 'tr', 'light');
  RETURN NEW;
END;
$$;

-- Grant execute permissions only to necessary roles
REVOKE ALL ON FUNCTION handle_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION handle_updated_at() TO authenticated;

REVOKE ALL ON FUNCTION handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;