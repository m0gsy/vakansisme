-- Add metadata JSONB column to destinations table
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
