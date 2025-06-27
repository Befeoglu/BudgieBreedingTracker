/*
  # Create todos table

  1. New Tables
    - `todos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, required)
      - `description` (text, optional)
      - `priority` (text, enum: low/medium/high)
      - `completed` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `todos` table
    - Add policy for users to manage their own todos

  3. Triggers
    - Add updated_at trigger for automatic timestamp updates
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own todos"
  ON todos
  FOR ALL
  TO public
  USING (user_id = (SELECT uid()))
  WITH CHECK (user_id = (SELECT uid()));

-- Add updated_at trigger
CREATE TRIGGER on_todos_updated
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();