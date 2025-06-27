/*
      # Create Users Profile Table

      This migration creates a `users` table to store public profile information for authenticated users. It's designed to work with Supabase's built-in authentication.

      ## 1. New Table
      - `public.users`: Stores user-specific data that is not part of the `auth.users` table.
        - `id` (uuid, primary key): Foreign key to `auth.users.id`.
        - `email` (text, unique): User's email, synced from `auth.users`.
        - `full_name` (text): User's full name.
        - `subscription_status` (text): User's subscription plan.
        - `settings` (jsonb): For user-specific settings.
        - `language` (text): User's preferred language.
        - `theme` (text): User's preferred theme.
        - `created_at`, `updated_at`: Timestamps.

      ## 2. Automation (Triggers)
      - `handle_new_user()`: A function that automatically creates a profile in `public.users` when a new user signs up in `auth.users`.
      - `on_auth_user_created`: The trigger that executes the function after an insert on `auth.users`.
      - This removes the need for the client to manually create a user profile after sign-up.

      ## 3. Security (RLS)
      - RLS is enabled on the `users` table.
      - A policy is added to allow users to manage only their own profile.
    */

    -- 1. USERS TABLE for public profile information
    CREATE TABLE IF NOT EXISTS public.users (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      full_name text,
      subscription_status text DEFAULT 'free',
      settings jsonb DEFAULT '{}'::jsonb,
      language text DEFAULT 'tr',
      theme text DEFAULT 'light',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Add trigger for `updated_at` on users table
    CREATE OR REPLACE TRIGGER on_users_updated
      BEFORE UPDATE ON public.users
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_updated_at();

    -- 2. RLS for USERS table
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;
    CREATE POLICY "Users can manage their own profile"
      ON public.users
      FOR ALL
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);

    -- 3. AUTOMATION: Trigger to create a user profile on new user signup
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.users (id, email)
      VALUES (NEW.id, NEW.email);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger to call the function on new user creation in auth.users
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_new_user();
