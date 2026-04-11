-- Supabase Database Schema for Dotenv Management
-- Run this in your Supabase SQL Editor

-- Create secret_groups table
CREATE TABLE IF NOT EXISTS secret_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_name)
);

-- Enable Row Level Security on secret_groups
ALTER TABLE secret_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own secret groups" ON secret_groups;
DROP POLICY IF EXISTS "Users can insert their own secret groups" ON secret_groups;
DROP POLICY IF EXISTS "Users can update their own secret groups" ON secret_groups;
DROP POLICY IF EXISTS "Users can delete their own secret groups" ON secret_groups;

-- Create RLS policies for secret_groups
CREATE POLICY "Users can view their own secret groups"
  ON secret_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own secret groups"
  ON secret_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own secret groups"
  ON secret_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own secret groups"
  ON secret_groups FOR DELETE
  USING (auth.uid() = user_id);

-- Create secrets table
CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES secret_groups(id) ON DELETE CASCADE,
  environment TEXT NOT NULL CHECK (environment IN ('dev', 'test', 'prod')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, environment, key)
);

-- Enable Row Level Security on secrets
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view secrets from their groups" ON secrets;
DROP POLICY IF EXISTS "Users can insert secrets to their groups" ON secrets;
DROP POLICY IF EXISTS "Users can update secrets in their groups" ON secrets;
DROP POLICY IF EXISTS "Users can delete secrets from their groups" ON secrets;

-- Create RLS policies for secrets
CREATE POLICY "Users can view secrets from their groups"
  ON secrets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM secret_groups
      WHERE secret_groups.id = secrets.group_id
      AND secret_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert secrets to their groups"
  ON secrets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM secret_groups
      WHERE secret_groups.id = secrets.group_id
      AND secret_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update secrets in their groups"
  ON secrets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM secret_groups
      WHERE secret_groups.id = secrets.group_id
      AND secret_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete secrets from their groups"
  ON secrets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM secret_groups
      WHERE secret_groups.id = secrets.group_id
      AND secret_groups.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_secret_groups_user_id ON secret_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_secrets_group_id ON secrets(group_id);
CREATE INDEX IF NOT EXISTS idx_secrets_environment ON secrets(environment);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_secret_groups_updated_at ON secret_groups;
CREATE TRIGGER update_secret_groups_updated_at
    BEFORE UPDATE ON secret_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_secrets_updated_at ON secrets;
CREATE TRIGGER update_secrets_updated_at
    BEFORE UPDATE ON secrets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view alias 'groups' for backward compatibility
-- This ensures code that references 'groups' table will work
CREATE OR REPLACE VIEW groups AS
SELECT
  id,
  user_id,
  group_name,
  description,
  created_at,
  updated_at
FROM secret_groups;

-- Note: For INSERT/UPDATE/DELETE operations through the view,
-- you'll need to use 'secret_groups' table directly in your API code
-- or create INSTEAD OF triggers (which require more complex setup)
