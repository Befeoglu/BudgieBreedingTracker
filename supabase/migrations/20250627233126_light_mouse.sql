/*
  # Add INSERT policy for users table

  1. Security Changes
    - Add policy to allow authenticated users to insert their own user profile
    - This enables the application to create user profiles when they don't exist
    - The policy ensures users can only insert a row with their own auth.uid()

  2. Background
    - The users table currently has SELECT and UPDATE policies but no INSERT policy
    - This causes errors when the application tries to create missing user profiles
    - The new policy maintains security by restricting inserts to the authenticated user's own ID
*/

-- Add INSERT policy for users table
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);