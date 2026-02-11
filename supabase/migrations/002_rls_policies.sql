-- ============================================================
-- 002: Row Level Security policies for all user-data tables
-- ============================================================
-- Context:
--   Cadre uses Clerk for auth (user IDs are text strings like "user_2abc...")
--   and accesses Supabase exclusively through the service_role key in
--   Next.js API routes. service_role bypasses RLS, so these policies
--   are a safety net for defense-in-depth and prepare for a future
--   migration to Supabase Auth or direct client-side access.
--
-- Tables covered:
--   1. follows              — user ↔ company follow relationships
--   2. alert_preferences    — per-user notification settings
--   3. feed_events          — activity feed (scoped to followed companies)
--   4. company_daily_metrics — read-only hiring snapshots
-- ============================================================

-- 1. FOLLOWS
-- Users can read, insert, update, and delete only their own follows.
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own follows"
  ON follows FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own follows"
  ON follows FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own follows"
  ON follows FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  USING (auth.uid()::text = user_id);

-- 2. ALERT PREFERENCES
-- Users can read and write only their own row.
ALTER TABLE alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON alert_preferences FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own preferences"
  ON alert_preferences FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own preferences"
  ON alert_preferences FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own preferences"
  ON alert_preferences FOR DELETE
  USING (auth.uid()::text = user_id);

-- 3. FEED EVENTS
-- Users can read events only for companies they follow.
-- No direct insert/update/delete — populated by the sync pipeline via service_role.
ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read feed events for followed companies"
  ON feed_events FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM follows
      WHERE user_id = auth.uid()::text
    )
  );

-- 4. COMPANY DAILY METRICS
-- Read-only for all authenticated users. No client-side writes.
ALTER TABLE company_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read metrics"
  ON company_daily_metrics FOR SELECT
  USING (auth.role() = 'authenticated');
