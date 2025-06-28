/*
  # Add mother_id and father_id to clutches table

  1. New Columns
     - Add mother_id and father_id to clutches table to track parent birds
     
  2. Foreign Keys
     - Link mother_id and father_id to birds table with appropriate ON DELETE behavior
     
  3. Indexes
     - Create indexes to improve query performance for bird lookups
*/

-- Add bird relationship columns to clutches table
DO $$
BEGIN
  -- Add mother_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clutches' AND column_name = 'female_bird_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.clutches ADD COLUMN female_bird_id uuid REFERENCES public.birds(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added female_bird_id column to clutches table';
  END IF;

  -- Add father_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clutches' AND column_name = 'male_bird_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.clutches ADD COLUMN male_bird_id uuid REFERENCES public.birds(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added male_bird_id column to clutches table';
  END IF;
END $$;

-- Create indexes for the new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_clutches_female_bird_id ON public.clutches(female_bird_id);
CREATE INDEX IF NOT EXISTS idx_clutches_male_bird_id ON public.clutches(male_bird_id);

-- Update RLS policies to account for the new columns
DROP POLICY IF EXISTS "Users can manage their own clutches" ON public.clutches;

CREATE POLICY "Users can manage their own clutches"
  ON public.clutches
  FOR ALL
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());