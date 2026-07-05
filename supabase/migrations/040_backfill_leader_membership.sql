-- Backfill: expeditions whose leader was assigned/reassigned via admin edit
-- (before the PATCH route auto-joined the leader) are missing their
-- expedition_members row, so quota shows 0 even though a leader exists.
INSERT INTO expedition_members (expedition_id, user_id, status)
SELECT e.id, e.leader_id, 'approved'
FROM expeditions e
ON CONFLICT (expedition_id, user_id) DO NOTHING;
