-- Add description to expeditions
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS description text;

-- New stories now require admin approval before going public
ALTER TABLE stories ALTER COLUMN published SET DEFAULT false;

-- Editorial pipeline state, separate from public-visibility `published` flag.
-- draft     = author saved, not submitted (private)
-- pending   = submitted, awaiting admin review
-- published = approved & live  (published = true)
-- rejected  = admin declined; author can edit + resubmit
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('draft', 'pending', 'published', 'rejected'));

-- Backfill existing rows from the published flag
UPDATE stories SET status = 'published' WHERE published = true;
UPDATE stories SET status = 'draft' WHERE published = false AND status <> 'published';

-- Admin can read all stories (including unpublished/pending)
DROP POLICY IF EXISTS "stories admin read all" ON stories;
CREATE POLICY "stories admin read all"
  ON stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin can update published status (approve)
DROP POLICY IF EXISTS "stories admin update" ON stories;
CREATE POLICY "stories admin update"
  ON stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin can delete stories (reject)
DROP POLICY IF EXISTS "stories admin delete" ON stories;
CREATE POLICY "stories admin delete"
  ON stories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Authors can read their own unpublished stories (drafts + pending)
DROP POLICY IF EXISTS "stories author read own" ON stories;
CREATE POLICY "stories author read own"
  ON stories FOR SELECT
  USING (author_id = auth.uid());
