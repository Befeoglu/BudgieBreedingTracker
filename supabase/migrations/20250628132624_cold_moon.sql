/*
  # Fix notification policies for authenticated users
  
  1. Policy Changes
     - Replace existing notification policies with updated ones
     - Add proper authenticated user policies to avoid public access
     - Ensure consistent naming and security across all notification tables
  
  2. Security Improvements
     - Grant policies specifically to authenticated users instead of public
     - Add proper permissions to prevent unauthorized access
*/

-- Drop existing policies which might have incorrect permissions
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view notifications 2023" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications 2023" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications 2023" ON notifications;
DROP POLICY IF EXISTS "Users can delete notifications 2023" ON notifications;
DROP POLICY IF EXISTS "Users can view notifications 2024" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications 2024" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications 2024" ON notifications;
DROP POLICY IF EXISTS "Users can delete notifications 2024" ON notifications;

-- Create policies for notifications with authenticated role
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

-- Drop existing policies for notification settings
DROP POLICY IF EXISTS "Users can view notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can view notification_settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert notification_settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update notification_settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can view notification settings 2023" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert notification settings 2023" ON notification_settings;
DROP POLICY IF EXISTS "Users can update notification settings 2023" ON notification_settings;
DROP POLICY IF EXISTS "Users can view notification_settings 2024" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert notification_settings 2024" ON notification_settings;
DROP POLICY IF EXISTS "Users can update notification_settings 2024" ON notification_settings;

-- Create policies for notification_settings with authenticated role
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