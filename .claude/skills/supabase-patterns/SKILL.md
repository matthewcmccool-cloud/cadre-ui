name: cadre-supabase-patterns
description: Use when creating or modifying Supabase tables, indexes, RLS policies, views, or writing queries for CADRE's database. Covers schema conventions, the 16-table structure, naming rules, and security patterns.

# CADRE Supabase Patterns

## Schema Overview

CADRE uses 16 tables in the `public` schema on Supabase (PostgREST). The database is the source of truth for all hiring intelligence data.

### Core Data Tables

- **companies** — VC-backed company profiles (name, slug, stage, ats_platform, status, hq_location, size, about, jobs_api_url, logo_url, website)
- **jobs** — Job postings synced from ATS platforms (title, company_id FK, function_id FK, location, job_url, apply_url, description, date_posted, status)
- **investors** — VC firms and angels (name, slug, bio, type, linkedin, location, logo_url, website)
- **industries** — Industry taxonomy (~17 categories)
- **fundraises** — Funding rounds (company_id FK, round_type, amount BIGINT in USD, valuation BIGINT, announced_date, source, source_url, raw_data JSONB)
- **functions** — Job function categories (seeded with 16 values)

### Junction Tables

- **company_industries** — many-to-many (company_id, industry_id)
- **company_investors** — many-to-many (company_id, investor_id, is_lead BOOLEAN, round_type)
- **fundraise_investors** — many-to-many (fundraise_id, investor_id, lead BOOLEAN)

### User Tables

- **users** — Clerk-authed users
- **user_bookmarks** — saved jobs/companies (user_id scoped)
- **follows** — company follows (user_id scoped)
- **alert_preferences** — notification settings (user_id scoped)
- **user_plans** — subscription tier tracking

### Operational Tables

- **company_daily_metrics** — daily signal snapshots
- **feed_events** — activity feed items
- **job_sync_log** — ATS sync run history

## Naming Conventions

- **Tables:** snake_case, plural nouns (companies, fundraise_investors)
- **Columns:** snake_case (date_posted, ats_platform, round_type)
- **Primary keys:** always `id UUID DEFAULT gen_random_uuid()`
- **Foreign keys:** `{referenced_table_singular}_id` (e.g. company_id, investor_id)
- **Junction table PKs:** composite `PRIMARY KEY (left_id, right_id)`
- **Timestamps:** `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`
- **Indexes:** `idx_{table}_{column}` (e.g. idx_jobs_company_id, idx_companies_stage)

## Column Type Rules

- **IDs:** UUID
- **Money amounts:** BIGINT (USD, no decimals)
- **Dates:** DATE for calendar dates, TIMESTAMPTZ for timestamps
- **Flexible metadata:** JSONB (e.g. raw_data on fundraises)
- **URLs:** TEXT
- **Enums:** stored as TEXT with application-level validation (not Postgres enums)
- **Booleans:** BOOLEAN DEFAULT false

## Updated_at Trigger

All core tables use an auto-update trigger:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply per table:
CREATE TRIGGER trg_{table}_updated
  BEFORE UPDATE ON {table}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## RLS Policies

RLS is enabled on ALL 16 tables. Two patterns:

### Public data (companies, jobs, investors, industries, fundraises, junctions, functions, metrics, feed_events, job_sync_log)

```sql
CREATE POLICY "Public read {table}" ON {table}
FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies — writes go through service role key only
```

### User-scoped data (user_bookmarks, follows, alert_preferences, user_plans)

```sql
CREATE POLICY "Users read own {resource}" ON {table}
  FOR SELECT USING (user_id = requesting_user_id());
CREATE POLICY "Users insert own {resource}" ON {table}
  FOR INSERT WITH CHECK (user_id = requesting_user_id());
CREATE POLICY "Users delete own {resource}" ON {table}
  FOR DELETE USING (user_id = requesting_user_id());
```

`requesting_user_id()` extracts the Clerk user ID from the JWT.

**Important:** Server-side code (OpenClaw, sync scripts, API) uses the `service_role` key which bypasses RLS entirely.

## Computed Views

Pre-joined views serve as lightweight API endpoints via PostgREST:

- **company_stats** — company + aggregated job count, investor count, latest fundraise
- **investor_stats** — investor + portfolio company count, total deployed capital

## Index Strategy

Every FK column gets an index. Additional indexes on:

- `companies(stage)`, `companies(ats_platform)`, `companies(status)`, `companies(slug)`
- `jobs(status)`, `jobs(date_posted DESC)`, `jobs(job_url)`
- `fundraises(announced_date DESC)`, `fundraises(source)`

## When Adding a New Table

1. Use UUID primary key with `gen_random_uuid()`
2. Add `created_at` and `updated_at` timestamps
3. Create the `update_updated_at` trigger
4. Enable RLS immediately
5. Add appropriate policy (public read or user-scoped)
6. Index all FK columns
7. Update relevant views if the new table affects aggregations
