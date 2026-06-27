-- Add approval status to expedition gallery
ALTER TABLE expedition_gallery ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Drop old public read policy, replace with approved-only
DROP POLICY IF EXISTS "expedition_gallery public read" ON expedition_gallery;

CREATE POLICY "expedition_gallery approved read" ON expedition_gallery
  FOR SELECT USING (
    status = 'approved'
    OR auth.uid() = uploader_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin can update status
CREATE POLICY "expedition_gallery admin update" ON expedition_gallery
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
