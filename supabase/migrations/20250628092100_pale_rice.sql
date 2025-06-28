-- Update users table to support first_name and last_name structure
-- The full_name field will store "first_name last_name" format

-- Add comment to clarify the full_name field usage
COMMENT ON COLUMN public.users.full_name IS 'Stores user full name in "first_name last_name" format';

-- Create a function to extract first name from full_name
CREATE OR REPLACE FUNCTION public.get_first_name(full_name_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF full_name_input IS NULL OR trim(full_name_input) = '' THEN
    RETURN '';
  END IF;
  
  RETURN split_part(trim(full_name_input), ' ', 1);
END;
$$;

-- Create a function to extract last name from full_name
CREATE OR REPLACE FUNCTION public.get_last_name(full_name_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  name_parts text[];
  last_name_parts text[];
  i integer;
BEGIN
  IF full_name_input IS NULL OR trim(full_name_input) = '' THEN
    RETURN '';
  END IF;
  
  name_parts := string_to_array(trim(full_name_input), ' ');
  
  -- If only one part, return empty string for last name
  IF array_length(name_parts, 1) <= 1 THEN
    RETURN '';
  END IF;
  
  -- Get all parts except the first one
  FOR i IN 2..array_length(name_parts, 1) LOOP
    last_name_parts := array_append(last_name_parts, name_parts[i]);
  END LOOP;
  
  RETURN array_to_string(last_name_parts, ' ');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_first_name(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_last_name(text) TO authenticated;

-- Create a view for easier name handling (optional)
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  full_name,
  get_first_name(full_name) as first_name,
  get_last_name(full_name) as last_name,
  avatar_url,
  language,
  theme,
  created_at,
  updated_at
FROM public.users;

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.user_profiles SET (security_barrier = true);
CREATE POLICY "Users can view their own profile data"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));