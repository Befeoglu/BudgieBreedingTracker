/*
      # Security Update: Function Search Path

      This migration addresses a security warning from the Supabase linter (`function_search_path_mutable`). It secures the `handle_updated_at` and `handle_new_user` functions by explicitly setting their `search_path`.

      ## 1. Changes
      - **`public.handle_updated_at`**: The function is updated to include `SET search_path = 'public'`. This prevents potential search path hijacking attacks by ensuring the function always resolves objects within the `public` schema.
      - **`public.handle_new_user`**: This function is also updated with `SET search_path = 'public'` for the same security reasons.

      ## 2. Security
      - This change directly remediates the `function_search_path_mutable` linter warning, improving the overall security posture of the database.
    */

    -- Secure handle_updated_at function
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path = 'public'
    AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$;

    -- Secure handle_new_user function
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $$
    BEGIN
      INSERT INTO public.users (id, email)
      VALUES (NEW.id, NEW.email);
      RETURN NEW;
    END;
    $$;
