-- Story series / collections
CREATE TABLE IF NOT EXISTS story_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description text CHECK (description IS NULL OR char_length(description) <= 300),
  cover_image text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE story_series ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "series_read" ON story_series FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "series_own" ON story_series USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Link stories to series
ALTER TABLE stories ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES story_series(id) ON DELETE SET NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS series_order integer DEFAULT 0;

-- Join approval
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false;
DO $$ BEGIN
  ALTER TABLE expedition_members ADD COLUMN status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
UPDATE expedition_members SET status = 'approved' WHERE status IS NULL;

-- Rich packing list
DO $$ BEGIN ALTER TABLE expedition_packing_items ADD COLUMN category text DEFAULT 'general'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE expedition_packing_items ADD COLUMN quantity integer DEFAULT 1; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Per-member packing check-off
CREATE TABLE IF NOT EXISTS packing_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES expedition_packing_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, user_id)
);
ALTER TABLE packing_checks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "packing_checks_read" ON packing_checks FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "packing_checks_own" ON packing_checks USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
