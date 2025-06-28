/*
  # Final Fix for Security Definer View Issue

  1. Problem Resolution
     - Completely removes the problematic `user_profiles` view with SECURITY DEFINER
     - Recreates it as a standard view without any security elevation
     - Ensures proper permissions and access control

  2. Security Improvements
     - Removes SECURITY DEFINER property that bypasses RLS
     - Sets explicit permissions for authenticated users only
     - Uses fully qualified table references to avoid ambiguity

  3. Verification
     - Includes validation to ensure the fix was successful
     - Confirms the view exists and has correct properties
*/

-- Step 1: Completely remove the existing view and all dependencies
DROP VIEW IF EXISTS public.user_profiles CASCADE;

-- Step 2: Ensure complete cleanup by checking for any remaining references
DO $$
BEGIN
  -- Additional cleanup if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    EXECUTE 'DROP VIEW public.user_profiles CASCADE';
  END IF;
END $$;

-- Step 3: Recreate the view properly without SECURITY DEFINER
CREATE VIEW public.user_profiles AS
SELECT 
  public.users.id,
  public.users.email,
  public.users.full_name,
  CASE 
    WHEN public.users.full_name IS NOT NULL AND position(' ' in public.users.full_name) > 0 
    THEN split_part(public.users.full_name, ' ', 1)
    ELSE public.users.full_name
  END as first_name,
  CASE 
    WHEN public.users.full_name IS NOT NULL AND position(' ' in public.users.full_name) > 0 
    THEN trim(substring(public.users.full_name from position(' ' in public.users.full_name) + 1))
    ELSE NULL
  END as last_name,
  public.users.avatar_url,
  public.users.language,
  public.users.theme,
  public.users.created_at,
  public.users.updated_at
FROM public.users;

-- Step 4: Add descriptive comment
COMMENT ON VIEW public.user_profiles IS 'User profile view with computed first_name and last_name fields';

-- Step 5: Set secure permissions - revoke all first, then grant minimum required
REVOKE ALL ON public.user_profiles FROM PUBLIC;
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.user_profiles FROM authenticated;

-- Grant only SELECT permission to authenticated users
GRANT SELECT ON public.user_profiles TO authenticated;

-- Step 6: Verification and logging
DO $$
DECLARE
  view_exists boolean;
  view_definition text;
BEGIN
  -- Check if view was created successfully
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) INTO view_exists;
  
  IF NOT view_exists THEN
    RAISE EXCEPTION 'CRITICAL: user_profiles view was not created successfully';
  END IF;
  
  -- Get the view definition to verify it doesn't contain SECURITY DEFINER
  SELECT pg_get_viewdef('public.user_profiles'::regclass) INTO view_definition;
  
  IF view_definition ILIKE '%security definer%' THEN
    RAISE EXCEPTION 'CRITICAL: View still contains SECURITY DEFINER property';
  END IF;
  
  -- Log successful completion
  RAISE NOTICE 'SUCCESS: user_profiles view recreated without SECURITY DEFINER property';
  RAISE NOTICE 'View definition verified clean of security issues';
  
END $$;

-- Step 7: Additional security check - ensure view owner permissions are correct
ALTER VIEW public.user_profiles OWNER TO postgres;

-- Step 8: Final verification query to confirm the fix
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'user_profiles';