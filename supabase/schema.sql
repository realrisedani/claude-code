-- ─── KPI Dashboard — Supabase Schema ───────────────────────────
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Enable UUID extension (already available in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─── HELPER: is_admin() ──────────────────────────────────────────────────────
-- Checks if the current user has the admin flag set in their raw_user_meta_data.
-- Set this flag via: Dashboard → Auth → Users → Edit user → Custom Claims
-- or via SQL: UPDATE auth.users SET raw_user_meta_data = '{"is_admin": true}' WHERE id = '<your-user-id>';

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
    false
  );
$$;


-- ─── TABLE: partners ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS partners (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('sales', 'affiliate')),
  email       text,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS partners_created_by_idx ON partners (created_by);
CREATE INDEX IF NOT EXISTS partners_created_at_idx ON partners (created_at DESC);

-- Row Level Security
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Admin: full access to all partners
CREATE POLICY "Admin: full access to partners"
  ON partners
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Owner: can SELECT their own partners
CREATE POLICY "Owner: read own partners"
  ON partners
  FOR SELECT
  USING (created_by = auth.uid());

-- Owner: can INSERT their own partners
CREATE POLICY "Owner: insert own partners"
  ON partners
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Owner: can UPDATE their own partners
CREATE POLICY "Owner: update own partners"
  ON partners
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Owner: can DELETE their own partners
CREATE POLICY "Owner: delete own partners"
  ON partners
  FOR DELETE
  USING (created_by = auth.uid());


-- ─── TABLE: entries ──────────────────────────────────────────────────────────
-- Each entry represents one reporting period for a partner (week / month / day).
-- Field names match the localStorage model in kpi-dashboard.html exactly.

CREATE TABLE IF NOT EXISTS entries (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id    uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  period        text NOT NULL,                        -- e.g. "2026-W23", "2026-06", "2026-06-05"
  period_type   text NOT NULL CHECK (period_type IN ('week', 'month', 'day')),
  reach         integer NOT NULL DEFAULT 0,
  clicks        integer NOT NULL DEFAULT 0,
  leads         integer NOT NULL DEFAULT 0,
  calls_booked  integer NOT NULL DEFAULT 0,
  calls_shown   integer NOT NULL DEFAULT 0,
  closes        integer NOT NULL DEFAULT 0,
  revenue       numeric(12, 2) NOT NULL DEFAULT 0,
  ad_spend      numeric(12, 2) NOT NULL DEFAULT 0,
  commission    numeric(12, 2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS entries_partner_id_idx  ON entries (partner_id);
CREATE INDEX IF NOT EXISTS entries_created_at_idx  ON entries (created_at DESC);
CREATE INDEX IF NOT EXISTS entries_period_idx      ON entries (partner_id, period);

-- Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Admin: full access to all entries
CREATE POLICY "Admin: full access to entries"
  ON entries
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Owner: can SELECT entries belonging to their own partners
CREATE POLICY "Owner: read own entries"
  ON entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.id = entries.partner_id
        AND p.created_by = auth.uid()
    )
  );

-- Owner: can INSERT entries for their own partners
CREATE POLICY "Owner: insert own entries"
  ON entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.id = partner_id
        AND p.created_by = auth.uid()
    )
  );

-- Owner: can UPDATE entries for their own partners
CREATE POLICY "Owner: update own entries"
  ON entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.id = entries.partner_id
        AND p.created_by = auth.uid()
    )
  );

-- Owner: can DELETE entries for their own partners
CREATE POLICY "Owner: delete own entries"
  ON entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.id = entries.partner_id
        AND p.created_by = auth.uid()
    )
  );


-- ─── REALTIME ────────────────────────────────────────────────────────────────
-- Enable realtime for both tables (Supabase Dashboard → Database → Replication
-- or run these statements):

ALTER PUBLICATION supabase_realtime ADD TABLE partners;
ALTER PUBLICATION supabase_realtime ADD TABLE entries;
