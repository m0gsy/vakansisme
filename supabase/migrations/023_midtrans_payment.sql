ALTER TABLE expedition_payments
  RENAME COLUMN stripe_session_id TO payment_order_id;
