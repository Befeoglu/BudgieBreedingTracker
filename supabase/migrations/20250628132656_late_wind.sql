/*
  # Fix notification policies with unique names

  This migration ensures all notification policies have unique names
  and properly replaces existing ones where needed.
*/

-- First, check if the notifications table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    -- Drop only policies that we know exist with these exact names (avoiding errors)
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
  END IF;
END $$;

-- Create policies for notifications with UNIQUE names
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    -- Only create if the policies don't already exist (avoiding errors)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view notifications uniquename') THEN
      CREATE POLICY "Users can view notifications uniquename"
        ON notifications
        FOR SELECT
        TO authenticated
        USING (user_id = (SELECT auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert notifications uniquename') THEN
      CREATE POLICY "Users can insert notifications uniquename"
        ON notifications
        FOR INSERT
        TO authenticated
        WITH CHECK (user_id = (SELECT auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update notifications uniquename') THEN
      CREATE POLICY "Users can update notifications uniquename"
        ON notifications
        FOR UPDATE
        TO authenticated
        USING (user_id = (SELECT auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can delete notifications uniquename') THEN
      CREATE POLICY "Users can delete notifications uniquename"
        ON notifications
        FOR DELETE
        TO authenticated
        USING (user_id = (SELECT auth.uid()));
    END IF;
  END IF;
END $$;

-- Process notification_settings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_settings') THEN
    -- Drop only policies that might exist (avoiding errors)
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
  END IF;
END $$;

-- Create policies for notification_settings with UNIQUE names
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_settings') THEN
    -- Only create if the policies don't already exist (avoiding errors)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users can view notification_settings uniquename') THEN
      CREATE POLICY "Users can view notification_settings uniquename"
        ON notification_settings
        FOR SELECT
        TO authenticated
        USING (user_id = (SELECT auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users can insert notification_settings uniquename') THEN
      CREATE POLICY "Users can insert notification_settings uniquename"
        ON notification_settings
        FOR INSERT
        TO authenticated
        WITH CHECK (user_id = (SELECT auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'Users can update notification_settings uniquename') THEN
      CREATE POLICY "Users can update notification_settings uniquename"
        ON notification_settings
        FOR UPDATE
        TO authenticated
        USING (user_id = (SELECT auth.uid()));
    END IF;
  END IF;
END $$;