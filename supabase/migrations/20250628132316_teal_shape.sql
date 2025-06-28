/*
  # Clean up incubation-related tables and data

  1. Handle existing notifications with incubation-related types
    - Update any 'hatch_reminder' or 'empty_nest' notifications to a valid type before changing the constraint
    
  2. Remove foreign keys and drop tables
    - Remove constraints on chicks table
    - Drop eggs table
    - Drop clutches table
    - Remove egg_id column from chicks table
    
  3. Update notification constraints
    - After updating the data, modify the constraint to exclude incubation types
*/

-- 1. Update existing notifications with deprecated types
UPDATE notifications 
SET type = 'custom_reminder' 
WHERE type IN ('hatch_reminder', 'empty_nest');

-- 2. Remove foreign key constraints to eggs table
ALTER TABLE IF EXISTS chicks
DROP CONSTRAINT IF EXISTS chicks_egg_id_fkey;

-- 3. Drop eggs table
DROP TABLE IF EXISTS eggs;

-- 4. Drop clutches table
DROP TABLE IF EXISTS clutches;

-- 5. Update chicks table to remove egg_id column
ALTER TABLE IF EXISTS chicks
DROP COLUMN IF EXISTS egg_id;

-- 6. Update notification constraints to remove incubation notification types
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