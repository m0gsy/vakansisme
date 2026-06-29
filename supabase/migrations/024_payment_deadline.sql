ALTER TABLE expedition_members
  ADD COLUMN IF NOT EXISTS payment_due_at timestamptz;
