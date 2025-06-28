/*
  # Fix eggs table structure and function parameter error

  1. Table Structure
    - Ensure eggs table exists with all necessary columns
    - Add missing columns if they don't exist
    - Add proper constraints and indexes

  2. Security
    - Enable RLS on eggs table
    - Add comprehensive policy for user access

  3. Functions
    - Drop and recreate get_next_egg_number function with correct parameter name
*/

-- Ensure eggs table exists with all necessary columns
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'eggs'
  ) THEN
    CREATE TABLE public.eggs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      clutch_id uuid NOT NULL REFERENCES public.clutches(id) ON DELETE CASCADE,
      position integer NOT NULL,
      status text NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'uncertain', 'occupied', 'hatched', 'belirsiz', 'boş', 'dolu', 'çıktı')),
      laid_date date,
      expected_hatch_date date,
      actual_hatch_date date,
      notes text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      mother_id uuid REFERENCES public.birds(id) ON DELETE SET NULL,
      father_id uuid REFERENCES public.birds(id) ON DELETE SET NULL,
      added_date date DEFAULT CURRENT_DATE,
      number integer
    );
  END IF;

  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'number' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN number integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'mother_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN mother_id uuid REFERENCES public.birds(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'father_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN father_id uuid REFERENCES public.birds(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'added_date' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN added_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add unique constraint for clutch_id and number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_clutch_id_number_key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD CONSTRAINT eggs_clutch_id_number_key UNIQUE (clutch_id, number);
  END IF;

  -- Add check constraint for number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'eggs_number_check' AND constraint_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD CONSTRAINT eggs_number_check CHECK (number IS NULL OR (number > 0 AND number <= 20));
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_eggs_clutch_id ON public.eggs(clutch_id);
CREATE INDEX IF NOT EXISTS idx_eggs_mother_id ON public.eggs(mother_id);
CREATE INDEX IF NOT EXISTS idx_eggs_father_id ON public.eggs(father_id);
CREATE INDEX IF NOT EXISTS idx_eggs_added_date ON public.eggs(added_date);
CREATE INDEX IF NOT EXISTS idx_eggs_number ON public.eggs(clutch_id, number);

-- Enable Row Level Security
ALTER TABLE public.eggs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can manage eggs from their clutches" ON public.eggs;
DROP POLICY IF EXISTS "Users can view eggs from their clutches" ON public.eggs;
DROP POLICY IF EXISTS "Users can insert eggs to their clutches" ON public.eggs;
DROP POLICY IF EXISTS "Users can update eggs from their clutches" ON public.eggs;
DROP POLICY IF EXISTS "Users can delete eggs from their clutches" ON public.eggs;

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

-- Create or replace trigger for updated_at
DROP TRIGGER IF EXISTS on_eggs_updated ON public.eggs;
CREATE TRIGGER on_eggs_updated
  BEFORE UPDATE ON public.eggs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Drop existing function first to avoid parameter name conflict
DROP FUNCTION IF EXISTS get_next_egg_number(uuid);

-- Create function to get next egg number with correct parameter name
CREATE OR REPLACE FUNCTION get_next_egg_number(p_clutch_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1 
  INTO next_num
  FROM eggs 
  WHERE clutch_id = p_clutch_id;
  
  RETURN next_num;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_egg_number(uuid) TO authenticated;

-- Verify table structure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'eggs'
  ) THEN
    RAISE NOTICE 'SUCCESS: eggs table structure updated successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: eggs table was not created properly';
  END IF;
END $$;