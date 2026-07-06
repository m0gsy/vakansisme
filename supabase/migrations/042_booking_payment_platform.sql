-- ============================================================
-- PHASE 15 — ENTERPRISE BOOKING & PAYMENT PLATFORM
-- ============================================================

-- 1. EXPEDITION PAYMENT POLICIES
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS requires_payment boolean DEFAULT false;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS payment_policy text DEFAULT 'fixed_price' CHECK (payment_policy IN ('free', 'fixed_price', 'donation', 'early_bird', 'custom_price'));
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS payment_deadline_policy text DEFAULT 'hours' CHECK (payment_deadline_policy IN ('no_deadline', 'hours', 'days', 'specific_date'));
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS payment_deadline_value integer DEFAULT 24;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS payment_deadline_date timestamptz;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS seat_reservation_policy text DEFAULT 'immediate' CHECK (seat_reservation_policy IN ('immediate', 'after_payment', 'temporary'));
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS seat_reservation_hours integer DEFAULT 0;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS refund_policy text;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS cancellation_policy text;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS max_reminder_count integer DEFAULT 3;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS payment_instructions text;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS accepted_payment_methods jsonb DEFAULT '["bank_transfer"]'::jsonb;

-- 2. BOOKING STATUS ENUM
CREATE TYPE booking_status AS ENUM (
  'draft',
  'waiting_payment',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'expired',
  'rejected'
);

-- 3. PAYMENT STATUS ENUM
CREATE TYPE payment_status AS ENUM (
  'pending',
  'waiting_verification',
  'paid',
  'rejected',
  'expired',
  'refunded',
  'cancelled'
);

-- 4. UPDATE expedition_members for new booking lifecycle
ALTER TABLE expedition_members
  DROP CONSTRAINT IF EXISTS expedition_members_status_check;

ALTER TABLE expedition_members
  ADD COLUMN IF NOT EXISTS booking_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS booking_status booking_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- Keep old status column for backward compat, map to booking_status
-- booking_status is the source of truth going forward

-- 5. ENHANCED expedition_payments
ALTER TABLE expedition_payments
  DROP CONSTRAINT IF EXISTS expedition_payments_status_check;

ALTER TABLE expedition_payments
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES expedition_members(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'manual_transfer',
  ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS proof_image_url text,
  ADD COLUMN IF NOT EXISTS proof_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_reason text,
  ADD COLUMN IF NOT EXISTS unique_code integer,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 6. PAYMENT PROVIDERS REGISTRY
CREATE TABLE IF NOT EXISTS payment_providers (
  name text PRIMARY KEY,
  display_name text NOT NULL,
  enabled boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "payment_providers_readable" ON payment_providers
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO payment_providers (name, display_name, enabled) VALUES
  ('manual_transfer', 'Manual Bank Transfer', true)
ON CONFLICT (name) DO NOTHING;

-- 7. BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  branch text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bank_accounts_readable" ON bank_accounts
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "bank_accounts_admin" ON bank_accounts
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. EXPEDITION BANK ACCOUNT OVERRIDES
CREATE TABLE IF NOT EXISTS expedition_bank_accounts (
  expedition_id uuid REFERENCES expeditions(id) ON DELETE CASCADE,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (expedition_id, bank_account_id)
);

ALTER TABLE expedition_bank_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "expedition_bank_accounts_readable" ON expedition_bank_accounts
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. PAYMENT SETTINGS (global admin config)
CREATE TABLE IF NOT EXISTS payment_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "payment_settings_readable" ON payment_settings
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "payment_settings_admin" ON payment_settings
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed default payment settings
INSERT INTO payment_settings (key, value) VALUES
  ('business_hours', '{"days": ["monday","tuesday","wednesday","thursday","friday"], "start": "09:00", "end": "17:00", "timezone": "Asia/Jakarta"}'::jsonb),
  ('whatsapp_number', '{"number": "", "label": "Admin"}'),
  ('receipt_footer', '{"text": "Terima kasih telah mempercayai VAKANSISME. Selamat berpetualang!"}'),
  ('reminder_templates', '{"payment_reminder": "Halo {{name}}, kamu masih punya tagihan untuk {{trip}}. Segera lakukan pembayaran sebelum {{deadline}}.", "trip_reminder": "Halo {{name}}, persiapkan dirimu! {{trip}} akan berangkat {{days}} hari lagi."}')
ON CONFLICT (key) DO NOTHING;

-- 10. BOOKING AUDIT LOG
CREATE TABLE IF NOT EXISTS booking_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES expedition_members(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES expedition_payments(id) ON DELETE SET NULL,
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  actor_ip text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "audit_logs_admin" ON booking_audit_logs
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "audit_logs_own" ON booking_audit_logs
    FOR SELECT USING (auth.uid() = actor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 11. QRIS MANAGEMENT
CREATE TABLE IF NOT EXISTS qris_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE qris_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "qris_accounts_readable" ON qris_accounts
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "qris_accounts_admin" ON qris_accounts
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 12. INDEXES
CREATE INDEX IF NOT EXISTS idx_expedition_members_booking_status ON expedition_members(booking_status);
CREATE INDEX IF NOT EXISTS idx_expedition_members_expires_at ON expedition_members(expires_at);
CREATE INDEX IF NOT EXISTS idx_expedition_payments_payment_status ON expedition_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_expedition_payments_provider ON expedition_payments(provider);
CREATE INDEX IF NOT EXISTS idx_booking_audit_logs_booking_id ON booking_audit_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_logs_action ON booking_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_booking_audit_logs_created_at ON booking_audit_logs(created_at DESC);

-- 13. BACKFILL booking_number for existing rows
UPDATE expedition_members
SET booking_number = 'BK-' || UPPER(SUBSTR(MD5(id::text), 1, 8)) || '-' || TO_CHAR(joined_at, 'YYMMDD')
WHERE booking_number IS NULL;

-- 14. FUNCTION: generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS text AS $$
DECLARE
  v_number text;
  v_exists boolean;
BEGIN
  LOOP
    v_number := 'BK-' || UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 8)) || '-' || TO_CHAR(NOW(), 'YYMMDD');
    SELECT EXISTS(SELECT 1 FROM expedition_members WHERE booking_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- 15. FUNCTION: auto-set booking_number on insert
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_booking_number ON expedition_members;
CREATE TRIGGER trg_set_booking_number
  BEFORE INSERT ON expedition_members
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_number();

-- 16. FUNCTION: sync status between old and new columns
CREATE OR REPLACE FUNCTION sync_member_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_status IS DISTINCT FROM OLD.booking_status THEN
    NEW.status := CASE NEW.booking_status
      WHEN 'draft' THEN 'pending'
      WHEN 'waiting_payment' THEN 'pending_payment'
      WHEN 'confirmed' THEN 'approved'
      WHEN 'checked_in' THEN 'approved'
      WHEN 'completed' THEN 'approved'
      WHEN 'cancelled' THEN 'rejected'
      WHEN 'expired' THEN 'rejected'
      WHEN 'rejected' THEN 'rejected'
    END;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.booking_status := CASE NEW.status
      WHEN 'pending' THEN 'draft'
      WHEN 'pending_payment' THEN 'waiting_payment'
      WHEN 'approved' THEN 'confirmed'
      WHEN 'rejected' THEN 'cancelled'
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_member_status ON expedition_members;
CREATE TRIGGER trg_sync_member_status
  BEFORE UPDATE ON expedition_members
  FOR EACH ROW
  WHEN (OLD.booking_status IS DISTINCT FROM NEW.booking_status OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_member_status();

-- 17. AUDIT LOG FUNCTION
CREATE OR REPLACE FUNCTION log_booking_action(
  p_booking_id uuid,
  p_action text,
  p_actor_id uuid DEFAULT auth.uid(),
  p_actor_ip text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO booking_audit_logs (booking_id, action, actor_id, actor_ip, description, metadata)
  VALUES (p_booking_id, p_action, p_actor_id, p_actor_ip, p_description, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. UNIQUE CODE GENERATOR
CREATE OR REPLACE FUNCTION generate_unique_code(amount_idr integer)
RETURNS integer AS $$
BEGIN
  RETURN (amount_idr % 1000) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 19. Update quota trigger to use booking_status instead of status
DROP TRIGGER IF EXISTS enforce_expedition_quota ON expedition_members;
CREATE TRIGGER enforce_expedition_quota
  BEFORE INSERT ON expedition_members
  FOR EACH ROW
  WHEN (NEW.booking_status IN ('waiting_payment', 'confirmed'))
  EXECUTE FUNCTION check_expedition_quota();
