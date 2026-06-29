ALTER TABLE expedition_payments
  DROP CONSTRAINT IF EXISTS expedition_payments_status_check;

ALTER TABLE expedition_payments
  ADD CONSTRAINT expedition_payments_status_check
  CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled'));
