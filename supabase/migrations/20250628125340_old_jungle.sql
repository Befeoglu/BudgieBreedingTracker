/*
  # Add notification system and update egg management

  1. New Tables
    - `notifications`
      - For user notification system with various types
    - `notification_settings`
      - For user notification preferences
  
  2. Schema Updates
    - Add bird relationships to clutches
    - Update eggs schema with parent relationships
    - Improve status handling with Turkish options
  
  3. Security
    - Enable RLS on all tables
    - Create appropriate policies
    - Add indexes for better performance
*/

-- First, create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('daily_summary', 'hatch_reminder', 'hatch_occurred', 'empty_nest', 'custom_reminder', 'feeding_reminder', 'health_check')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false NOT NULL,
  scheduled_for timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create notification_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{
    "daily_summary": true,
    "hatch_reminders": true,
    "chick_notifications": true,
    "feeding_reminders": true,
    "health_checks": true,
    "custom_reminders": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "07:00",
    "daily_summary_time": "08:00",
    "do_not_disturb": false
  }'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with UNIQUE names to avoid conflicts
CREATE POLICY "Users can view notifications 2024"
  ON notifications
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert notifications 2024"
  ON notifications
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update notifications 2024"
  ON notifications
  FOR UPDATE
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete notifications 2024"
  ON notifications
  FOR DELETE
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can view notification_settings 2024"
  ON notification_settings
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert notification_settings 2024"
  ON notification_settings
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update notification_settings 2024"
  ON notification_settings
  FOR UPDATE
  TO public
  USING (user_id = auth.uid());

-- Add parent birds to clutches table
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

-- Create indexes for the bird relationship columns
CREATE INDEX IF NOT EXISTS idx_clutches_female_bird_id ON public.clutches(female_bird_id);
CREATE INDEX IF NOT EXISTS idx_clutches_male_bird_id ON public.clutches(male_bird_id);
CREATE INDEX IF NOT EXISTS idx_clutches_status ON public.clutches(user_id, status);

-- Update eggs table
DO $$
BEGIN
  -- First, ensure the eggs table has all required columns
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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eggs' AND column_name = 'number' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD COLUMN number integer;
  END IF;
  
  -- Now update constraints
  
  -- Drop existing status constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_status_check' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs DROP CONSTRAINT eggs_status_check;
  END IF;

  -- Add new constraint with expanded status values
  ALTER TABLE public.eggs ADD CONSTRAINT eggs_status_check 
    CHECK (status IN ('empty', 'uncertain', 'occupied', 'hatched', 'belirsiz', 'boş', 'dolu', 'çıktı'));

  -- Add number constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_number_check' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD CONSTRAINT eggs_number_check 
      CHECK ((number IS NULL) OR ((number > 0) AND (number <= 20)));
  END IF;
  
  -- Add unique constraint for clutch_id and number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'eggs' AND constraint_name = 'eggs_clutch_id_number_key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.eggs ADD CONSTRAINT eggs_clutch_id_number_key 
      UNIQUE (clutch_id, number);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eggs_mother_id ON public.eggs(mother_id);
CREATE INDEX IF NOT EXISTS idx_eggs_father_id ON public.eggs(father_id);
CREATE INDEX IF NOT EXISTS idx_eggs_added_date ON public.eggs(added_date);
CREATE INDEX IF NOT EXISTS idx_eggs_number ON public.eggs(clutch_id, number);

-- Helper function to get next egg number
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

-- Create trigger for updated_at on notification_settings
CREATE OR REPLACE TRIGGER on_notification_settings_updated
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();