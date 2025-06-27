/*
  # Add user preference columns

  1. New Columns
    - `language` (text) - User's preferred language setting
    - `theme` (text) - User's preferred theme setting

  2. Changes
    - Add language column with default value 'tr'
    - Add theme column with default value 'light'
    - Add check constraints to ensure valid values
*/

-- Add language column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'language'
  ) THEN
    ALTER TABLE users ADD COLUMN language text DEFAULT 'tr';
  END IF;
END $$;

-- Add theme column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'theme'
  ) THEN
    ALTER TABLE users ADD COLUMN theme text DEFAULT 'light';
  END IF;
END $$;

-- Add check constraint for language
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'users_language_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_language_check 
    CHECK (language IN ('tr', 'en'));
  END IF;
END $$;

-- Add check constraint for theme
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'users_theme_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_theme_check 
    CHECK (theme IN ('light', 'dark', 'auto'));
  END IF;
END $$;