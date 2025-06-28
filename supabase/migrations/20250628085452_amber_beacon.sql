/*
  # Fix Function Search Path Security Issues

  1. Security Updates
    - Set immutable search_path for handle_updated_at function
    - Set immutable search_path for handle_new_user function
    - This prevents potential SQL injection attacks through search_path manipulation

  2. Function Updates
    - Recreate functions with SECURITY DEFINER and SET search_path
    - Maintain existing functionality while improving security
*/

-- Fix handle_updated_at function with secure search_path
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  RETURN NEW;
END;
$$;

-- Ensure the trigger still exists for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION handle_updated_at() IS 'Updates the updated_at timestamp for any table row. Security: SET search_path = public';
COMMENT ON FUNCTION handle_new_user() IS 'Creates a user profile when a new auth user is created. Security: SET search_path = public, auth';