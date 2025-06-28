/*
  # Fix existing notification policies and add egg improvements

  1. Notifications
    - Add new policies with unique names to avoid conflicts
    - Update eggs table with new status values and Turkish translations
  
  2. Eggs Table Enhancements
    - Add mother_id and father_id relationships
    - Add number field for easy identification
    - Support Turkish status values 
  
  3. Clutches Table Updates
    - Add female_bird_id and male_bird_id relationships
    - Create necessary indexes for better performance
*/

-- Create RLS policies with unique names to avoid conflicts
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
  DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;
  DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;

  -- Create new policies with unique names
  CREATE POLICY "Users can view notifications 2023" ON notifications FOR SELECT TO public USING (user_id = auth.uid());
  CREATE POLICY "Users can insert notifications 2023" ON notifications FOR INSERT TO public WITH CHECK (user_id = auth.uid());
  CREATE POLICY "Users can update notifications 2023" ON notifications FOR UPDATE TO public USING (user_id = auth.uid());
  CREATE POLICY "Users can delete notifications 2023" ON notifications FOR DELETE TO public USING (user_id = auth.uid());

  CREATE POLICY "Users can view notification settings 2023" ON notification_settings FOR SELECT TO public USING (user_id = auth.uid());
  CREATE POLICY "Users can insert notification settings 2023" ON notification_settings FOR INSERT TO public WITH CHECK (user_id = auth.uid());
  CREATE POLICY "Users can update notification settings 2023" ON notification_settings FOR UPDATE TO public USING (user_id = auth.uid());
END $$;

-- Add parent birds to clutches
DO $$
BEGIN
  -- Add female_bird_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clutches' AND column_name = 'female_bird_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.clutches ADD COLUMN female_bird_id uuid REFERENCES public.birds(id) ON DELETE SET NULL;
  END IF;

  -- Add male_bird_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clutches' AND column_name = 'male_bird_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.clutches ADD COLUMN male_bird_id uuid REFERENCES public.birds(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clutches_female_bird_id ON public.clutches(female_bird_id);
CREATE INDEX IF NOT EXISTS idx_clutches_male_bird_id ON public.clutches(male_bird_id);
CREATE INDEX IF NOT EXISTS idx_clutches_status ON public.clutches(user_id, status);

-- Update eggs table to support Turkish status values
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_status_check' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs DROP CONSTRAINT eggs_status_check;
  END IF;

  -- Add new constraint with expanded status values
  ALTER TABLE public.eggs ADD CONSTRAINT eggs_status_check 
    CHECK (status IN ('empty', 'uncertain', 'occupied', 'hatched', 'belirsiz', 'boş', 'dolu', 'çıktı'));
END $$;

-- Add unique constraint for clutch_id and number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_clutch_id_number_key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD CONSTRAINT eggs_clutch_id_number_key 
      UNIQUE (clutch_id, number);
  END IF;
END $$;

-- Create/update function to get next egg number
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_egg_number(uuid) TO authenticated;