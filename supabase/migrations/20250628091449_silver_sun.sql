/*
  # Fix Function Security Issues

  1. Security Improvements
    - Fix handle_updated_at function search_path security
    - Set proper security definer and search_path

  2. Function Updates
    - Add SECURITY DEFINER to handle_updated_at function
    - Set search_path to prevent injection attacks
*/

-- Drop and recreate the handle_updated_at function with proper security settings
DROP FUNCTION IF EXISTS public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO service_role;