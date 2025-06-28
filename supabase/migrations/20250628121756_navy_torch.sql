/*
  # Kuluçka ve Yumurta Sistemi İyileştirmeleri

  1. Yeni Tablolar
    - `notification_settings` tablosu eklendi (kuluçka bildirimleri için)
    - `notifications` tablosu eklendi (bildirim yönetimi için)
    
  2. Değişiklikler
    - `clutches` tablosuna `female_bird_id` ve `male_bird_id` kolonları eklendi
    - `eggs` tablosuna yeni durum değerleri ve `number` kolonu eklendi
    
  3. Güvenlik
    - Row Level Security tüm tablolar için etkinleştirildi
    - Kullanıcıların sadece kendi verilerine erişimi sağlandı
*/

-- Notification tables
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_clutches_female_bird_id ON public.clutches(female_bird_id);
CREATE INDEX IF NOT EXISTS idx_clutches_male_bird_id ON public.clutches(male_bird_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view their own notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_egg_number(uuid) TO authenticated;

-- Create trigger for updated_at on notification_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_notification_settings_updated'
  ) THEN
    CREATE TRIGGER on_notification_settings_updated
      BEFORE UPDATE ON notification_settings
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;