-- Atomic quota enforcement via DB trigger (eliminates TOCTOU race condition)
CREATE OR REPLACE FUNCTION check_expedition_quota()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_quota INTEGER;
BEGIN
  SELECT quota_max INTO max_quota FROM expeditions WHERE id = NEW.expedition_id;
  SELECT COUNT(*) INTO current_count
    FROM expedition_members
    WHERE expedition_id = NEW.expedition_id
      AND status IN ('approved', 'pending_payment');
  IF current_count >= max_quota THEN
    RAISE EXCEPTION 'expedition_full';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_expedition_quota ON expedition_members;
CREATE TRIGGER enforce_expedition_quota
  BEFORE INSERT ON expedition_members
  FOR EACH ROW
  WHEN (NEW.status IN ('approved', 'pending_payment'))
  EXECUTE FUNCTION check_expedition_quota();

-- Enable RLS on rate_limits (server-only table, no read policy needed)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Harden expedition_members status constraint (defense-in-depth)
ALTER TABLE expedition_members
  DROP CONSTRAINT IF EXISTS expedition_members_status_check;
ALTER TABLE expedition_members
  ADD CONSTRAINT expedition_members_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'pending_payment'));
