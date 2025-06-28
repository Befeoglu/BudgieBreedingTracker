/*
  # Create notification system tables

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text, notification type)
      - `title` (text, notification title)
      - `message` (text, notification content)
      - `data` (jsonb, optional data payload)
      - `read` (boolean, read status)
      - `scheduled_for` (timestamptz, when notification should be shown)
      - `created_at` (timestamptz, creation time)
    
    - `notification_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users, unique)
      - `settings` (jsonb, user notification preferences)
      - `created_at` (timestamptz, creation time)
      - `updated_at` (timestamptz, last update time)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own notifications and settings

  3. Indexes
    - Add index on user_id for both tables for better query performance
    - Add index on notification type and read status
*/

-- Create notifications table
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

-- Create notification_settings table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for notification_settings table
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger for updated_at on notification_settings
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger if it doesn't already exist
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