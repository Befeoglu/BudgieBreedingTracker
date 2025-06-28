/*
  # Enhanced Eggs Table for Incubation Tracking

  1. Modifications to existing eggs table
    - Add mother_id and father_id columns for parent tracking
    - Add added_date column for tracking when egg was added
    - Update status values to include new options
    - Add number column for egg numbering within clutch
    - Keep existing clutch_id reference (not incubation_id)
  
  2. Security
    - Update RLS policies for new columns
    - Ensure users can only access eggs from their clutches
  
  3. Functions
    - Add helper function for auto-incrementing egg numbers
*/

-- First, let's check if the eggs table exists and get its structure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'eggs'
  ) THEN
    RAISE NOTICE 'eggs table already exists, will modify existing structure';
  ELSE
    RAISE NOTICE 'eggs table does not exist, will create new table';
  END IF;
END $$;

-- Add new columns to existing eggs table if they don't exist
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

  -- Add number column if it doesn't exist (different from position)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'number' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN number integer;
    RAISE NOTICE 'Added number column to eggs table';
  END IF;
END $$;

-- Update the status column constraint to include new values
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_status_check' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs DROP CONSTRAINT eggs_status_check;
    RAISE NOTICE 'Dropped existing status constraint';
  END IF;

  -- Add new constraint with expanded status values
  ALTER TABLE public.eggs ADD CONSTRAINT eggs_status_check 
    CHECK (status IN ('empty', 'uncertain', 'occupied', 'hatched', 'belirsiz', 'boş', 'dolu', 'çıktı'));
  RAISE NOTICE 'Added new status constraint with expanded values';
END $$;

-- Add constraint for number column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_number_check' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD CONSTRAINT eggs_number_check 
      CHECK (number IS NULL OR (number > 0 AND number <= 20));
    RAISE NOTICE 'Added number constraint';
  END IF;
END $$;

-- Add unique constraint for clutch_id and number combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_clutch_id_number_key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD CONSTRAINT eggs_clutch_id_number_key 
      UNIQUE (clutch_id, number);
    RAISE NOTICE 'Added unique constraint for clutch_id and number';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eggs_mother_id ON public.eggs(mother_id);
CREATE INDEX IF NOT EXISTS idx_eggs_father_id ON public.eggs(father_id);
CREATE INDEX IF NOT EXISTS idx_eggs_added_date ON public.eggs(added_date);
CREATE INDEX IF NOT EXISTS idx_eggs_number ON public.eggs(clutch_id, number);

-- Ensure RLS is enabled
ALTER TABLE public.eggs ENABLE ROW LEVEL SECURITY;

-- Create/update RLS policies (drop existing if they exist)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can manage eggs from their clutches" ON public.eggs;
  DROP POLICY IF EXISTS "Users can view eggs from their clutches" ON public.eggs;
  DROP POLICY IF EXISTS "Users can insert eggs to their clutches" ON public.eggs;
  DROP POLICY IF EXISTS "Users can update eggs from their clutches" ON public.eggs;
  DROP POLICY IF EXISTS "Users can delete eggs from their clutches" ON public.eggs;
  
  RAISE NOTICE 'Dropped existing RLS policies';
END $$;

-- Create comprehensive RLS policy
CREATE POLICY "Users can manage eggs from their clutches"
  ON public.eggs
  FOR ALL
  TO authenticated
  USING (
    clutch_id IN (
      SELECT id FROM public.clutches 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    clutch_id IN (
      SELECT id FROM public.clutches 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Create function to auto-increment egg numbers within a clutch
CREATE OR REPLACE FUNCTION get_next_egg_number(clutch_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  -- Get the next available number for this clutch
  SELECT COALESCE(MAX(number), 0) + 1 
  INTO next_num
  FROM eggs 
  WHERE clutch_id = clutch_uuid;
  
  RETURN next_num;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_egg_number(uuid) TO authenticated;

-- Create function to update egg numbers when they're null
CREATE OR REPLACE FUNCTION update_egg_numbers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  egg_record RECORD;
  next_num integer;
BEGIN
  -- Update eggs that don't have numbers assigned
  FOR egg_record IN 
    SELECT id, clutch_id 
    FROM eggs 
    WHERE number IS NULL
    ORDER BY clutch_id, position, created_at
  LOOP
    -- Get next number for this clutch
    SELECT COALESCE(MAX(number), 0) + 1 
    INTO next_num
    FROM eggs 
    WHERE clutch_id = egg_record.clutch_id 
    AND number IS NOT NULL;
    
    -- Update the egg with the new number
    UPDATE eggs 
    SET number = next_num 
    WHERE id = egg_record.id;
  END LOOP;
  
  RAISE NOTICE 'Updated egg numbers for existing records';
END;
$$;

-- Run the function to update existing eggs
SELECT update_egg_numbers();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_egg_numbers() TO authenticated;

-- Verify the table structure
DO $$
DECLARE
  column_count integer;
BEGIN
  SELECT COUNT(*) 
  INTO column_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'eggs'
  AND column_name IN ('clutch_id', 'mother_id', 'father_id', 'added_date', 'number');
  
  IF column_count = 5 THEN
    RAISE NOTICE 'SUCCESS: eggs table updated with all necessary columns';
  ELSE
    RAISE EXCEPTION 'FAILED: eggs table missing some columns. Found % out of 5 expected columns', column_count;
  END IF;
END $$;