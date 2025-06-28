/*
  # Remove Incubation-related Tables

  1. Tables Dropped
    - `clutches` - Incubation sessions table
    - `eggs` - Individual eggs tracking table
    
  2. Updates
    - Modified chicks table to remove egg_id reference
    - Removed columns and constraints referencing these tables
    - Updated notification types to remove incubation-specific types
*/

-- 1. First remove foreign key constraints to eggs table
ALTER TABLE IF EXISTS chicks
DROP CONSTRAINT IF EXISTS chicks_egg_id_fkey;

-- 2. Drop eggs table
DROP TABLE IF EXISTS eggs;

-- 3. Drop clutches table
DROP TABLE IF EXISTS clutches;

-- 4. Update chicks table to remove egg_id column
ALTER TABLE IF EXISTS chicks
DROP COLUMN IF EXISTS egg_id;

-- 5. Update notification constraints to remove incubation notification types
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'notifications' AND constraint_name = 'notifications_type_check' AND table_schema = 'public'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    
    -- Add new constraint without incubation-specific types
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
      CHECK (type IN ('daily_summary', 'hatch_occurred', 'custom_reminder', 'feeding_reminder', 'health_check'));
  END IF;
END $$;