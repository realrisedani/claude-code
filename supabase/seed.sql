-- ─── KPI Dashboard — Seed Data ──────────────────────────────────
-- Run AFTER schema.sql.
-- IMPORTANT: Replace <your-user-id> with your actual auth.users UUID before running.
-- Find your UUID: Dashboard → Authentication → Users → copy the ID column.
--
-- Usage:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Replace the placeholder UUID below with your real user ID
--   3. Run this script

DO $$
DECLARE
  v_user_id  uuid := '<your-user-id>';   -- REPLACE THIS
  v_p1       uuid;
  v_p2       uuid;
  v_p3       uuid;
BEGIN

  -- ─── Partner 1: Max Müller (Sales) ────────────────────────────
  INSERT INTO partners (created_by, name, type, email, note)
  VALUES (v_user_id, 'Max Müller', 'sales', 'max@beispiel.de', 'Instagram DE')
  RETURNING id INTO v_p1;

  INSERT INTO entries (partner_id, period, period_type, reach, clicks, leads, calls_booked, calls_shown, closes, revenue, ad_spend, commission)
  VALUES
    (v_p1, '2026-W21', 'week', 18000, 720,  86,  32, 24,  8,  9600, 600, 0),
    (v_p1, '2026-W22', 'week', 22000, 990,  110, 42, 34, 11, 13200, 720, 0),
    (v_p1, '2026-W23', 'week', 26500, 1190, 138, 51, 41, 14, 16800, 850, 0);

  -- ─── Partner 2: Anna Schmidt (Affiliate) ──────────────────────
  INSERT INTO partners (created_by, name, type, email, note)
  VALUES (v_user_id, 'Anna Schmidt', 'affiliate', 'anna@beispiel.de', 'TikTok AT/CH')
  RETURNING id INTO v_p2;

  INSERT INTO entries (partner_id, period, period_type, reach, clicks, leads, calls_booked, calls_shown, closes, revenue, ad_spend, commission)
  VALUES
    (v_p2, '2026-W21', 'week', 45000, 1800, 162, 0, 0, 24, 7200, 0, 1440),
    (v_p2, '2026-W22', 'week', 52000, 2340, 187, 0, 0, 31, 9300, 0, 1860),
    (v_p2, '2026-W23', 'week', 61000, 2440, 195, 0, 0, 28, 8400, 0, 1680);

  -- ─── Partner 3: Tom Weber (Sales) ─────────────────────────────
  INSERT INTO partners (created_by, name, type, email, note)
  VALUES (v_user_id, 'Tom Weber', 'sales', 'tom@beispiel.de', 'LinkedIn DACH')
  RETURNING id INTO v_p3;

  INSERT INTO entries (partner_id, period, period_type, reach, clicks, leads, calls_booked, calls_shown, closes, revenue, ad_spend, commission)
  VALUES
    (v_p3, '2026-W22', 'week',  9500, 285, 40, 18, 11, 2, 2400, 400, 0),
    (v_p3, '2026-W23', 'week', 11000, 330, 48, 20, 13, 3, 3600, 420, 0),
    (v_p3, '2026-W24', 'week', 13500, 405, 61, 24, 17, 5, 6000, 480, 0);

END $$;
