-- User blocks
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "blocks_own" ON user_blocks
    USING (auth.uid() = blocker_id)
    WITH CHECK (auth.uid() = blocker_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ban flag on profiles
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN is_banned boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Featured flags on expeditions and stories
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
