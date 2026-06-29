CREATE TABLE IF NOT EXISTS expedition_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  proposer_handle text NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  difficulty text NOT NULL,
  price text NOT NULL DEFAULT 'Free',
  date_start date NOT NULL,
  date_end date NOT NULL,
  quota_max integer NOT NULL DEFAULT 10,
  description text,
  image_url text,
  requires_approval boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expedition_proposals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "proposals_own" ON expedition_proposals
    USING (auth.uid() = proposer_id)
    WITH CHECK (auth.uid() = proposer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
