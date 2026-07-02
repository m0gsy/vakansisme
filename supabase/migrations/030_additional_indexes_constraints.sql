-- Additional indexes for high-frequency query columns
CREATE INDEX IF NOT EXISTS idx_stories_author_published ON stories(author_id, published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_expedition_proposals_status ON expedition_proposals(status);
CREATE INDEX IF NOT EXISTS idx_expedition_proposals_proposer ON expedition_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_story_likes_story_created ON story_likes(story_id, created_at);
CREATE INDEX IF NOT EXISTS idx_expedition_members_combined ON expedition_members(expedition_id, status);

-- Date range constraint: expeditions must have end >= start
ALTER TABLE expeditions
  DROP CONSTRAINT IF EXISTS check_expedition_dates;
ALTER TABLE expeditions
  ADD CONSTRAINT check_expedition_dates CHECK (date_end >= date_start);

-- Same for proposals
ALTER TABLE expedition_proposals
  DROP CONSTRAINT IF EXISTS check_proposal_dates;
ALTER TABLE expedition_proposals
  ADD CONSTRAINT check_proposal_dates CHECK (date_end >= date_start);

-- Harden RLS policies: fix rate_limits by disabling RLS
-- (rate_limits is server-internal: no user data, only accessed via service client)
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;

-- Strengthen stories UPDATE: add WITH CHECK to prevent authors from self-publishing
DROP POLICY IF EXISTS "authors can edit own" ON stories;
CREATE POLICY "authors can edit own" ON stories
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id AND published = false);

-- Admin update policy WITH CHECK (prevent impossible status transitions)
DROP POLICY IF EXISTS "admins can update stories" ON stories;
CREATE POLICY "admins can update stories" ON stories
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
