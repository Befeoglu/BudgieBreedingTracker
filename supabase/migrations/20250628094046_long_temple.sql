/*
  # Fix Security Warnings

  1. Security Improvements
    - Fix handle_updated_at function search_path security issue
    - Add proper SECURITY DEFINER and search_path settings
    - Ensure all functions have secure configurations

  2. Function Updates
    - Update handle_updated_at function with security settings
    - Maintain existing functionality while improving security
*/

-- Fix the handle_updated_at function security issue
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO service_role;

-- Ensure all existing functions have proper security settings
-- (The get_first_name and get_last_name functions already have SECURITY DEFINER and SET search_path)

-- Update handle_new_user function to ensure it has proper security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile data
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Update validate_password_strength function to ensure it has proper security settings
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check minimum length
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- Check for at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Check for at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Check for at least one number
  IF password !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO service_role;