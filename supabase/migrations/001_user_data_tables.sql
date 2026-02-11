-- Cadre PLG User Data Tables
-- Run this in the Supabase SQL Editor to create the user data schema.
-- These tables store user-generated data (follows, preferences, feed events).
-- Company/job/investor data remains in Airtable for now.

-- ============================================================
-- 1. follows — tracks which companies a user follows
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  company_id text NOT NULL,
  source text NOT NULL DEFAULT 'direct',
  portfolio_investor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_user_id ON follows (user_id);
CREATE INDEX IF NOT EXISTS idx_follows_company_id ON follows (company_id);

-- ============================================================
-- 2. alert_preferences — per-user notification settings
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_preferences (
  user_id text PRIMARY KEY,
  weekly_digest boolean NOT NULL DEFAULT true,
  daily_digest boolean NOT NULL DEFAULT false,
  daily_digest_time text NOT NULL DEFAULT '09:00',
  realtime_new_roles boolean NOT NULL DEFAULT true,
  realtime_fundraises boolean NOT NULL DEFAULT true,
  realtime_surges boolean NOT NULL DEFAULT true,
  realtime_stalls boolean NOT NULL DEFAULT true,
  newsletter boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. feed_events — denormalized activity feed (populated by sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS feed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  company_id text NOT NULL,
  company_name text NOT NULL,
  company_logo_url text,
  company_stage text,
  event_data jsonb NOT NULL DEFAULT '{}',
  event_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_events_company_date
  ON feed_events (company_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_feed_events_date
  ON feed_events (event_date DESC);

-- ============================================================
-- 4. company_daily_metrics — daily hiring snapshots for sparklines
-- ============================================================
CREATE TABLE IF NOT EXISTS company_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  date date NOT NULL,
  active_roles integer NOT NULL DEFAULT 0,
  new_roles integer NOT NULL DEFAULT 0,
  closed_roles integer NOT NULL DEFAULT 0,
  roles_by_function jsonb,
  UNIQUE (company_id, date)
);

CREATE INDEX IF NOT EXISTS idx_company_daily_metrics_lookup
  ON company_daily_metrics (company_id, date DESC);
