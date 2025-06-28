/*
  # Rename health_notes column to notes

  1. Column Rename
    - Rename `health_notes` column to `notes` in birds table
    - This is a safe operation that preserves all existing data
    - No data loss or type changes involved

  2. Safety
    - Uses IF EXISTS pattern to prevent errors if column doesn't exist
    - Wrapped in transaction for safety
*/

-- Start transaction for safety
BEGIN;

-- Check if health_notes column exists and rename it to notes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'birds' 
    AND column_name = 'health_notes'
  ) THEN
    ALTER TABLE public.birds RENAME COLUMN health_notes TO notes;
    RAISE NOTICE 'Column health_notes renamed to notes successfully';
  ELSE
    RAISE NOTICE 'Column health_notes does not exist, skipping rename';
  END IF;
END $$;

-- Commit the transaction
COMMIT;