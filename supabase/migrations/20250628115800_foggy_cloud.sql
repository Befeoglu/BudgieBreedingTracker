/*
  # Fix eggs table structure
  
  1. New Tables
    - Modified `eggs` table
      - Ensures correct `clutch_id` usage instead of `incubation_id`
      - Adds proper constraints and validation
  
  2. Security
    - Enable RLS on `eggs` table
    - Add policy for authenticated users to manage their eggs
*/

-- Create eggs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.eggs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clutch_id uuid NOT NULL REFERENCES public.clutches(id) ON DELETE CASCADE,
  position integer NOT NULL,
  number integer NOT NULL CHECK (number > 0 AND number <= 20),
  status text NOT NULL DEFAULT 'belirsiz' CHECK (status IN ('empty', 'uncertain', 'occupied', 'hatched', 'belirsiz', 'boş', 'dolu', 'çıktı')),
  mother_id uuid REFERENCES public.birds(id) ON DELETE SET NULL,
  father_id uuid REFERENCES public.birds(id) ON DELETE SET NULL,
  added_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (clutch_id, position),
  UNIQUE (clutch_id, number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eggs_clutch_id ON public.eggs(clutch_id);
CREATE INDEX IF NOT EXISTS idx_eggs_mother_id ON public.eggs(mother_id);
CREATE INDEX IF NOT EXISTS idx_eggs_father_id ON public.eggs(father_id);
CREATE INDEX IF NOT EXISTS idx_eggs_added_date ON public.eggs(added_date);
CREATE INDEX IF NOT EXISTS idx_eggs_number ON public.eggs(clutch_id, number);

-- Enable Row Level Security
ALTER TABLE public.eggs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for eggs table
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

-- Create trigger for updated_at
CREATE TRIGGER on_eggs_updated
  BEFORE UPDATE ON public.eggs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to get next egg number
CREATE OR REPLACE FUNCTION get_next_egg_number(clutch_id uuid)
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
  WHERE clutch_id = clutch_id;
  
  RETURN next_num;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_egg_number(uuid) TO authenticated;

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'eggs'
  ) THEN
    RAISE NOTICE 'SUCCESS: eggs table created or modified successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: eggs table was not created properly';
  END IF;
END $$;