-- Normalize legacy seed difficulty labels ("Level: Pretty Chaotic") to the
-- new difficulty values ("Pretty Chaotic") so the filter pills match.
UPDATE expeditions
  SET difficulty = trim(replace(difficulty, 'Level:', ''))
  WHERE difficulty LIKE 'Level:%';

-- Admins can create expeditions (fixes "new row violates RLS" on insert)
DROP POLICY IF EXISTS "expeditions admin insert" ON expeditions;
CREATE POLICY "expeditions admin insert"
  ON expeditions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can edit expeditions
DROP POLICY IF EXISTS "expeditions admin update" ON expeditions;
CREATE POLICY "expeditions admin update"
  ON expeditions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
