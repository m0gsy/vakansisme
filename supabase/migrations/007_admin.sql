-- Add moderation status to chaos submissions
ALTER TABLE chaos_submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add admin flag to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- RLS: only approved chaos cards visible to public
-- Drop old public-read policy and replace with status-aware one
DROP POLICY IF EXISTS "chaos public read" ON chaos_submissions;

CREATE POLICY "chaos public read"
  ON chaos_submissions FOR SELECT
  USING (status = 'approved');

-- Admin can read all
CREATE POLICY "chaos admin read"
  ON chaos_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin can update status
CREATE POLICY "chaos admin update"
  ON chaos_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin can delete expeditions
CREATE POLICY "expeditions admin delete"
  ON expeditions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
