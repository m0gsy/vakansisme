ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS price_amount integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS expedition_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  expedition_id uuid REFERENCES expeditions(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE NOT NULL,
  amount_idr integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, expedition_id)
);

ALTER TABLE expedition_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "payments_own" ON expedition_payments
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
