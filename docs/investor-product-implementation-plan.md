# Cadre for Investors — Implementation Plan

**Date:** February 2026
**Status:** Active — this is the canonical plan
**Owner:** Matt (@matthewcmccool-cloud)
**Supersedes:** `investor-product-draft.md` (ideation doc, still useful for context)

---

## Strategic Decisions (Locked In)

| Decision | Final Answer |
|----------|-------------|
| Primary revenue engine | Investor B2B product |
| Pricing model | $500/mo base (15 companies included) + $20/company/mo beyond that |
| Pricing visibility | Quote monthly totals in conversations. No pricing page until 10+ customers. |
| Database strategy | Airtable stays for consumer job board. Supabase Postgres for investor product. No risky migration. |
| Email infrastructure | Loops.so |
| Auth | Clerk (already in stack) + Supabase Auth for investor-specific scoping |
| Design partners | a16z, Collab + Currency, and broader AI/Crypto VC network |
| Competitive differentiator vs. Getro | Cadre gives VCs distribution — job seekers use Cadre, which drives candidates to portfolio companies. Getro aggregates listings but has no demand-side audience. |
| Build philosophy | Build clean for handoff. No hacks. Someone will eventually own this codebase. |
| Deferred | Featured listings, Slack integration, CVHI index, LinkedIn content strategy |
| Focus | Product > marketing. Matt sources leads through his network. |

---

## Pricing Formula

```
Monthly price = $500 + max(0, (portfolio_companies - 15)) × $20

Examples:
  15 companies → $500/mo
  30 companies → $800/mo
  50 companies → $1,200/mo
  80 companies → $1,800/mo
  150 companies → $3,200/mo
```

**Important:** Investors only pay for companies that have ATS integrations and active job sync. Companies without ATS URLs are shown but marked as "pending sync" and don't count toward billing.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CONSUMER BOARD                         │
│            (stays on Airtable, no changes)                │
│                                                           │
│  Next.js App Router → lib/airtable.ts → Airtable API     │
│  Job seekers browse, filter, apply                        │
│  This side generates the data + SEO + candidate flow      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   INVESTOR PRODUCT                        │
│              (new, built on Supabase)                      │
│                                                           │
│  Supabase Postgres ← nightly sync from Airtable          │
│  + daily snapshot pipeline (captures hiring state)        │
│  + investor-scoped auth (Clerk)                           │
│  + Loops.so for email (Portfolio Pulse, digests)          │
│  + Stripe for billing                                     │
│                                                           │
│  Investor dashboard (Next.js pages, reads Supabase)       │
└─────────────────────────────────────────────────────────┘

Data flow:
  ATS APIs → GitHub Actions cron → Airtable (source of truth)
                                       ↓
                                  Nightly sync job
                                       ↓
                                  Supabase Postgres
                                       ↓
                              Daily snapshot pipeline
                              (captures state per company)
                                       ↓
                              Investor dashboard + alerts
```

**Why this architecture:**
- Zero risk to the working consumer product (Airtable untouched)
- Supabase handles the analytical queries Airtable can't (aggregations, time-series, joins)
- Clean separation — future engineer inherits a clear boundary between products
- Supabase Pro ($25/mo) handles the scale we need for 12+ months

---

## Supabase Schema (Graph-Aware)

Designed for the investor knowledge graph: Jobs ↔ Companies ↔ Investors ↔ Industries.
Optimized for queries like "show me all hiring across a16z's Series B AI companies."

```sql
-- Core entities (synced nightly from Airtable)
companies (
  id uuid PRIMARY KEY,
  airtable_id text UNIQUE,
  name text NOT NULL,
  slug text UNIQUE,
  website text,
  stage text,              -- Seed, A, B, C, D+
  industry_id uuid REFERENCES industries,
  hq_location text,
  ats_platform text,       -- greenhouse, lever, ashby, null
  jobs_api_url text,
  has_active_sync boolean DEFAULT false,
  created_at timestamptz,
  updated_at timestamptz
)

investors (
  id uuid PRIMARY KEY,
  airtable_id text UNIQUE,
  name text NOT NULL,
  slug text UNIQUE,
  bio text,
  location text,
  website text,
  linkedin_url text,
  created_at timestamptz
)

-- The graph edge: which investors back which companies
investor_companies (
  investor_id uuid REFERENCES investors,
  company_id uuid REFERENCES companies,
  PRIMARY KEY (investor_id, company_id)
)

industries (
  id uuid PRIMARY KEY,
  airtable_id text UNIQUE,
  name text NOT NULL,
  slug text UNIQUE
)

jobs (
  id uuid PRIMARY KEY,
  airtable_id text UNIQUE,
  title text NOT NULL,
  company_id uuid REFERENCES companies,
  function_name text,
  department_name text,     -- 10 analytics segments
  location text,
  remote_first boolean DEFAULT false,
  job_url text,
  apply_url text,
  salary text,
  first_seen_at timestamptz,
  last_seen_at timestamptz,  -- CRITICAL: updated on each sync
  removed_at timestamptz,    -- set when job disappears from ATS
  is_active boolean DEFAULT true,
  created_at timestamptz
)

-- Investor accounts (authenticated users)
investor_accounts (
  id uuid PRIMARY KEY,
  clerk_user_id text UNIQUE,
  investor_id uuid REFERENCES investors,  -- linked to their firm
  name text,
  email text,
  firm_name text,
  created_at timestamptz
)

-- Which companies an investor account is tracking
-- (may include companies not yet in our system)
portfolio_tracked_companies (
  investor_account_id uuid REFERENCES investor_accounts,
  company_id uuid REFERENCES companies NULL,  -- null if not yet in system
  company_name_raw text,                       -- what they submitted
  sync_status text DEFAULT 'pending',          -- pending, syncing, active, no_ats
  requested_at timestamptz,
  activated_at timestamptz,
  PRIMARY KEY (investor_account_id, company_name_raw)
)

-- THE MOAT: daily hiring snapshots per company
company_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies,
  snapshot_date date NOT NULL,
  total_open_roles integer,
  roles_by_department jsonb,   -- {"Engineering": 24, "Sales & GTM": 12}
  roles_by_location jsonb,     -- {"San Francisco": 15, "Remote": 8}
  roles_by_seniority jsonb,    -- {"IC": 30, "Manager": 5, "Director+": 2}
  new_roles_count integer,     -- roles not seen in previous snapshot
  removed_roles_count integer, -- roles seen before but now gone
  net_change integer,
  hiring_velocity float,       -- 7-day rolling avg of new roles/day
  UNIQUE (company_id, snapshot_date)
)

-- Indexes for common investor queries
CREATE INDEX idx_snapshots_company_date ON company_snapshots(company_id, snapshot_date DESC);
CREATE INDEX idx_jobs_company_active ON jobs(company_id) WHERE is_active = true;
CREATE INDEX idx_jobs_last_seen ON jobs(last_seen_at);
CREATE INDEX idx_investor_companies_investor ON investor_companies(investor_id);
CREATE INDEX idx_investor_companies_company ON investor_companies(company_id);
CREATE INDEX idx_companies_stage ON companies(stage);

-- Materialized view: portfolio summary (refreshed after each snapshot)
CREATE MATERIALIZED VIEW portfolio_summaries AS
SELECT
  ic.investor_id,
  COUNT(DISTINCT j.company_id) AS active_companies,
  COUNT(j.id) FILTER (WHERE j.is_active) AS total_open_roles,
  jsonb_object_agg(
    COALESCE(j.department_name, 'Other'),
    COUNT(j.id)
  ) FILTER (WHERE j.is_active) AS roles_by_department
FROM investor_companies ic
JOIN jobs j ON j.company_id = ic.company_id
GROUP BY ic.investor_id;
```

---

## Implementation Phases

### Phase 0 — Stale Job Cleanup (Week 1)
> "If a talent partner sees 48 open roles but 20 are stale, trust is destroyed instantly."

This is prerequisite to everything. The investor product is only as good as the data.

- [ ] Add `lastSeenAt` field to Job Listings in Airtable
- [ ] Update sync pipeline (`/api/sync-jobs`): on each sync run, update `lastSeenAt` for every job returned by ATS API
- [ ] Add removal detection: after sync, find jobs for that company where `lastSeenAt` < today → mark as inactive / set `removedAt`
- [ ] Add expiration rule: jobs not seen for 14+ days are flagged as stale, 30+ days are hidden from consumer board
- [ ] Verify on preview URL that stale jobs no longer appear

### Phase 1 — Supabase Foundation (Weeks 1-2)

- [ ] Set up Supabase Pro project
- [ ] Create schema (tables above)
- [ ] Build nightly Airtable → Supabase sync job
  - Runs after the daily ATS sync completes
  - Syncs: companies, investors, investor_companies edges, jobs, industries
  - Maps Airtable record IDs to Supabase UUIDs
  - Respects Airtable 5 req/sec rate limit
- [ ] Build daily snapshot pipeline
  - Runs after Supabase sync
  - For each company: count active jobs, group by department/location/seniority
  - Compare to previous day's snapshot: compute delta, new roles, removed roles
  - Insert into `company_snapshots`
- [ ] Verify data integrity: spot-check 10 companies between Airtable and Supabase

### Phase 2 — Portfolio Pulse Email (Week 2-3)
> The demand validation play. Ship this before building any dashboard.

- [ ] Set up Loops.so account and API integration
- [ ] Build investor signup flow:
  - Landing page form (name, email, firm, paste portfolio company list)
  - Store in `investor_accounts` + `portfolio_tracked_companies`
  - Match submitted company names against `companies` table (fuzzy match)
  - For unmatched companies: set `sync_status = 'pending'`, display message: "We're adding [X] companies to our tracking. This typically takes 2-3 business days."
- [ ] Build Portfolio Pulse email template (Loops.so):
  - Subject: "Portfolio Pulse — Week of [date]"
  - Aggregate stats: total open roles, week-over-week change, top department
  - Top 3 movers (biggest WoW increase)
  - Flags: any hiring freezes or spikes detected
  - Per-company one-liner: "Acme AI: 48 roles (+6), top dept: Engineering"
  - CTA: "See full dashboard →" (links to dashboard, even if basic)
- [ ] Build Monday morning cron job to generate + send via Loops.so API
- [ ] Manually onboard 3-5 design partners from Matt's network
- [ ] Measure: open rates, click-through, replies

### Phase 3 — Investor Dashboard MVP (Weeks 3-5)

- [ ] Investor auth flow (Clerk, gated behind login)
- [ ] **Portfolio Overview page** (`/dashboard`)
  - Table of all tracked portfolio companies
  - Columns: Company, Stage, Open Roles, WoW Change, Top Department, Sync Status
  - Sortable by any column
  - Filter by stage, industry
  - Visual indicator for spikes (green arrow), freezes (red arrow), pending sync (gray)
- [ ] **Company Deep-Dive page** (`/dashboard/company/[slug]`)
  - Department breakdown (bar chart)
  - Role listing with title, department, location, posted date
  - Trend line: open roles over time (daily snapshots, 4/8/12 week views)
  - "New this week" and "Removed this week" role lists
- [ ] **Side-by-Side Comparison** (`/dashboard/compare`)
  - Select 2-5 companies
  - Metrics: total roles, department mix, WoW change, hiring velocity
  - Overlay trend lines
- [ ] **Onboarding flow for missing companies**
  - In dashboard: "Add companies" button
  - Submit company names → we check for ATS URL
  - If found: auto-start sync, show "syncing, data available within 24 hours"
  - If not found: show "We'll investigate and add this company within 2-3 business days"
  - Matt gets notified (Loops.so transactional email) to manually find ATS URL
  - Company shows in dashboard as "pending" — does NOT count toward billing

### Phase 4 — Alerts & Billing (Weeks 5-7)

- [ ] **Alert engine** (runs after daily snapshot)
  - Hiring Spike: >25% role increase in 1 week
  - Hiring Freeze: >30% role decrease in 1 week, or 0 new roles for 3+ weeks
  - New Department: first-ever role in a department for that company
  - Executive Hire: VP/C-suite/Head-of/Director title posted
  - Delivery: email via Loops.so (consolidate into daily alert digest, not per-alert spam)
- [ ] **Alert preferences** in dashboard settings
  - Toggle each alert type on/off
  - Choose delivery: email only (V1)
- [ ] **Stripe integration**
  - Stripe Checkout for initial signup
  - Metered billing based on active synced companies
  - Monthly invoice with line items
  - Billing page in dashboard showing current plan, company count, next invoice estimate
  - Free during pilot period for design partners (manual override)
- [ ] **Billing logic**
  - Count `portfolio_tracked_companies` where `sync_status = 'active'`
  - Apply formula: $500 + max(0, count - 15) × $20
  - Companies with `sync_status = 'pending'` or `'no_ats'` are excluded from billing

### Phase 5 — Polish & Scale (Weeks 7-10)

- [ ] **PDF export** for board decks / LP reports
  - One-page snapshot: portfolio aggregate stats, top movers, flags, trend chart
  - Branded with investor firm logo (uploaded in settings)
- [ ] **CSV export** of all portfolio job data
- [ ] **Historical depth** — ensure 12+ weeks of snapshots are queryable
- [ ] **Dashboard performance** — ensure portfolio overview loads in <2 seconds for 150-company portfolios
- [ ] **Onboarding refinement** — reduce "pending sync" time from days to hours where possible
- [ ] **Stale data monitoring** — dashboard shows data freshness per company ("last synced 2 hours ago" vs. "last synced 3 days ago — may be stale")

---

## Onboarding Flow: Missing Companies

This is the cold-start solution. When an investor signs up and submits 60 companies but we only track 40:

```
Step 1: Investor submits portfolio list (company names)
Step 2: System fuzzy-matches against companies table
  → 40 matched: shown as "Active" in dashboard
  → 15 have ATS but no sync yet: auto-discover ATS URL, begin sync
  → 5 have no known ATS: shown as "Pending — we're investigating"

Step 3: Investor sees dashboard immediately with 40 companies
  → Banner: "15 companies are being added (ETA: 24-48 hours)"
  → Banner: "5 companies are under investigation (ETA: 2-3 business days)"

Step 4: Matt gets notification with the 20 missing companies
  → Uses Perplexity / manual lookup to find ATS URLs
  → Adds to Airtable → next sync picks them up → Supabase sync follows
  → Company status updates to "Active" in investor's dashboard

Step 5: Companies without any ATS (no Greenhouse/Lever/Ashby/etc.)
  → Shown as "No ATS detected — limited tracking available"
  → NOT counted toward billing
  → Future: career page scraper as fallback
```

---

## What's Deferred (and Why)

| Feature | Why Deferred | Revisit When |
|---------|-------------|--------------|
| Featured job listings | Consumer monetization; investor product is priority | After 10+ paying investor accounts |
| Slack integration | Nice-to-have; email alerts are sufficient for V1 | After investors request it |
| CVHI (Cadre VC Hiring Index) | Needs 30+ days of snapshot data + editorial effort | After 2+ months of snapshots + market traction |
| LinkedIn content strategy | Matt sources leads through network; content is secondary | After design partner feedback validates product |
| Job seeker premium features | Consumer board is working; don't distract | After investor product hits $10K MRR |
| Fundraise predictor | Requires validated time-series + external data | After 6+ months of snapshots |
| Health scores (composite) | Needs calibration against real outcomes | After enough data + investor feedback on what matters |

---

## Success Milestones

| Milestone | Target | Signals |
|-----------|--------|---------|
| First snapshot captured | End of Week 1 | Daily pipeline running, data in Supabase |
| First Portfolio Pulse email sent | End of Week 3 | 3-5 design partners receiving Monday email |
| Design partner says "this is useful" | Week 4-5 | Unprompted positive feedback or feature request |
| Dashboard MVP live | End of Week 5 | 3+ investors logging in weekly |
| First invoice sent | Week 7 | Stripe billing active, at least 1 paying customer |
| 10 paying customers | Week 12+ | ~$7K-15K MRR depending on portfolio sizes |

---

## Open Items for Matt

- [ ] Confirm design partner list (5-10 firms from a16z, Collab + Currency, AI/Crypto network)
- [ ] Set up Loops.so account
- [ ] Set up Stripe account (or confirm existing)
- [ ] Upgrade Supabase to Pro plan ($25/mo)
- [ ] Draft initial outreach message to design partners (can use Portfolio Pulse concept as the hook: "Want to get a free weekly hiring pulse across your portfolio? We're piloting this with 5 firms.")

---

*This plan is designed for a 1-person team + AI tooling. Each "week" may take 1.5-2 weeks in practice. That's fine. The sequencing matters more than the speed.*
