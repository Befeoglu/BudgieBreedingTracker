/*
  # Add additional egg status support and fix constraints

  1. Table Improvements
    - Ensure eggs table has correct status options for Turkish and English
    - Add proper constraints for number field
    - Make sure all necessary columns exist
  
  2. Security
    - Fix any issues with policy permissions
*/

-- Ensure eggs table status allows both Turkish and English values
DO $$
BEGIN
  -- Drop existing status constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_status_check' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs DROP CONSTRAINT eggs_status_check;
    RAISE NOTICE 'Dropped existing eggs status constraint';
  END IF;

  -- Add new constraint with expanded status values
  ALTER TABLE public.eggs ADD CONSTRAINT eggs_status_check 
    CHECK (status IN ('empty', 'uncertain', 'occupied', 'hatched', 'belirsiz', 'boş', 'dolu', 'çıktı'));
  RAISE NOTICE 'Added updated eggs status constraint with Turkish support';
END $$;

-- Ensure eggs table has number field with proper constraints
DO $$
BEGIN
  -- Add number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'number' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN number integer;
    RAISE NOTICE 'Added number column to eggs table';
  END IF;

  -- Add check constraint for number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'eggs_number_check' AND constraint_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD CONSTRAINT eggs_number_check CHECK (number IS NULL OR (number > 0 AND number <= 20));
    RAISE NOTICE 'Added number constraint to eggs table';
  END IF;
  
  -- Add unique constraint for clutch_id and number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_clutch_id_number_key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD CONSTRAINT eggs_clutch_id_number_key UNIQUE (clutch_id, number);
    RAISE NOTICE 'Added unique constraint for clutch_id and number to eggs table';
  END IF;
END $$;

-- Add parent bird references to eggs table
DO $$
BEGIN
  -- Add mother_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'mother_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN mother_id uuid REFERENCES public.birds(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added mother_id column to eggs table';
  END IF;

  -- Add father_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'father_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN father_id uuid REFERENCES public.birds(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added father_id column to eggs table';
  END IF;

  -- Add added_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'added_date' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN added_date date DEFAULT CURRENT_DATE;
    RAISE NOTICE 'Added added_date column to eggs table';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eggs_mother_id ON public.eggs(mother_id);
CREATE INDEX IF NOT EXISTS idx_eggs_father_id ON public.eggs(father_id);
CREATE INDEX IF NOT EXISTS idx_eggs_added_date ON public.eggs(added_date);
CREATE INDEX IF NOT EXISTS idx_eggs_number ON public.eggs(clutch_id, number);