-- Phase 1: Migrate leader_handle (TEXT @username) → leader_id (UUID FK)
-- Safe migration: add column, populate, verify, set NOT NULL, drop old column

-- Step 1: Add leader_id as nullable UUID FK
ALTER TABLE expeditions
  ADD COLUMN IF NOT EXISTS leader_id uuid REFERENCES profiles(id) ON DELETE RESTRICT;

-- Step 2: Populate leader_id from leader_handle via username lookup
UPDATE expeditions e
SET leader_id = p.id
FROM profiles p
WHERE LOWER(TRIM(REPLACE(e.leader_handle, '@', ''))) = LOWER(p.username)
  AND e.leader_id IS NULL;

-- Step 3: Verify all rows matched (fail if any NULL remains)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM expeditions WHERE leader_id IS NULL) THEN
    RAISE EXCEPTION 'Migration aborted: some expeditions have no matching profile for their leader_handle. Fix data first.';
  END IF;
END $$;

-- Step 4: Make NOT NULL now that all rows are populated
ALTER TABLE expeditions ALTER COLUMN leader_id SET NOT NULL;

-- Step 5: Drop old text column
ALTER TABLE expeditions DROP COLUMN IF EXISTS leader_handle;

-- Step 6: Index for fast leader lookups
CREATE INDEX IF NOT EXISTS idx_expeditions_leader_id ON expeditions(leader_id);

-- Step 7: Update RLS policies on expedition_packing_items (from migration 014)
-- Old policies joined via leader_handle username match — replace with direct UUID compare
DROP POLICY IF EXISTS "packing leader insert" ON expedition_packing_items;
CREATE POLICY "packing leader insert" ON expedition_packing_items
  FOR INSERT WITH CHECK (
    (SELECT leader_id FROM expeditions WHERE id = expedition_packing_items.expedition_id) = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "packing leader delete" ON expedition_packing_items;
CREATE POLICY "packing leader delete" ON expedition_packing_items
  FOR DELETE USING (
    (SELECT leader_id FROM expeditions WHERE id = expedition_packing_items.expedition_id) = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
