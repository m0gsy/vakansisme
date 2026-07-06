-- expedition_members has SELECT, INSERT (own row), DELETE (own row) policies
-- but NO UPDATE policy. BookingService.updateStatus() silently fails because
-- RLS blocks the UPDATE with zero rows affected and no error.
--
-- 1. Users can update their own membership row
-- 2. Admins can update any membership row (leader auto-join, status management)

DROP POLICY IF EXISTS "users update own membership" ON expedition_members;
CREATE POLICY "users update own membership"
  ON expedition_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins update membership" ON expedition_members;
CREATE POLICY "admins update membership"
  ON expedition_members FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
