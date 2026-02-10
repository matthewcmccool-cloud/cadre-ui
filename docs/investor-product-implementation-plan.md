# Cadre — Implementation Plan

**Date:** February 2026
**Status:** Active — this is the canonical plan
**Owner:** Matt (@matthewcmccool-cloud)
**Supersedes:** `investor-product-draft.md` (ideation doc, still useful for context)
**Incorporates:** Model council findings on UI/UX audit (consumer + investor dashboard design spec) + technical audit (backend performance, Airtable schema, infrastructure)

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
| Vercel plan | Pro ($20/mo) — required for ToS compliance (Hobby is non-commercial only), raises timeout 10s→300s |
| Rate limiting | `p-limit(4)` on all Airtable fetches (4 req/sec, not 5 — avoids 30s penalty on 429) |
| Caching | ISR with `revalidate = 3600` on all pages. Background regen reads from Supabase (fast), not Airtable (slow). |
| Deferred | Featured listings, Slack integration, CVHI index, LinkedIn content strategy |
| Focus | Product > marketing. Matt sources leads through his network. |
| Chart library | Tremor (React + Tailwind + Recharts, native dark theme) |
| Dashboard pattern | Sidebar + top bar shell (Linear/Vercel pattern) |
| Dashboard default sort | Week-over-week change descending (movement, not static counts) |
| Alert model | Three tiers: inline table badges + notification bell + dedicated alerts page — one underlying data model |

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
│                                                           │
│  Next.js App Router (ISR, revalidate=3600)               │
│  Homepage/listing: reads from Supabase (fast, <100ms)    │
│  Detail pages: filterByFormula on Airtable Slug fields   │
│  Job seekers browse, filter, apply                        │
│  This side generates the data + SEO + candidate flow      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   INVESTOR PRODUCT                        │
│              (new, built on Supabase)                      │
│                                                           │
│  Supabase Postgres ← incremental sync from Airtable      │
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
                              Incremental sync (Last Modified Time cursor)
                              Only changed records, ~1-5 API pages/night
                                       ↓
                                  Supabase Postgres
                                 /                \
                    Consumer board ISR          Investor dashboard
                    (reads pre-computed         (reads real-time
                     data, <100ms)              queries + snapshots)
                                       ↓
                              Daily snapshot pipeline
                              (captures state per company)
                                       ↓
                              Alert engine → Loops.so digest
```

**Why this architecture:**
- Consumer board reads from Supabase via ISR — eliminates the 36-41 Airtable API calls per homepage load
- Detail pages use Airtable Slug formula fields + `filterByFormula` — 1 API call instead of 14+
- `p-limit(4)` on all remaining Airtable calls prevents rate limit race conditions
- Incremental sync (not full dump) respects Airtable limits: ~1-5 pages/night vs. 160+
- Supabase handles analytical queries Airtable can't (aggregations, time-series, joins)
- Clean separation — future engineer inherits a clear boundary between products
- Vercel Pro ($20/mo) + Supabase Pro ($25/mo) = $45/mo total infrastructure

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

### Phase 0A — Consumer Quick Wins (Week 1, ~5 hours)
> These ship before design partner demos. The investor dashboard shares the same app shell — polish here benefits both products.

**Navigation fix (15 min):**
- [ ] Move `<Header />` into root `app/layout.tsx` so every page gets navigation
- [ ] Remove manual `<Header />` imports from individual pages
- [ ] Replace "← Back to jobs" links on detail pages with breadcrumbs (`Jobs → Sequoia Capital`)

**Loading / Error / Not Found states (2-3 hrs):**
- [ ] Add `app/loading.tsx` — skeleton loader (dark pulse animation on #0e0e0f)
- [ ] Add `app/error.tsx` — error boundary with retry button
- [ ] Add `app/not-found.tsx` — branded 404 page
- [ ] Add `app/dashboard/loading.tsx` (for investor dashboard, preemptively)
- [ ] Add route-segment loading states for `/jobs/[id]`, `/companies/[slug]`, `/investors/[slug]`, `/industry/[slug]`

**Consolidate /jobs → / (1 hr):**
- [ ] Remove `app/jobs/page.tsx` (the duplicate listing page with #262626 background)
- [ ] Add 301 redirect: `/jobs` → `/` in `next.config.js` rewrites
- [ ] Keep `/jobs/[id]` job detail routes untouched

**Clerk dark theme (5 min):**
- [ ] Add `appearance` prop to `<ClerkProvider>` in `app/layout.tsx`:
  ```tsx
  appearance={{ variables: { colorBackground: '#0e0e0f', colorText: '#e8e8e8', colorPrimary: '#5e6ad2' } }}
  ```

**Contrast fix (30 min):**
- [ ] Replace `#666` → `#999` across all components (WCAG AA compliance: ~5.1:1 ratio on #1a1a1b)
- [ ] Replace `#555` → `#888` where used as body text (not as ultra-subtle decorative text)

**Favicon fallback (30 min):**
- [ ] Wire `CompanyLogo.tsx` letter-avatar fallback into `JobTable.tsx` (component already exists, just not used in the table)
- [ ] Show colored circle with company initial instead of `display:none` on error

### Phase 0B — Backend Quick Wins (Week 1, ~2.5 hours)
> These fix the performance crisis and set up the foundation for everything else.

**Vercel Pro upgrade (5 min):**
- [ ] Upgrade to Vercel Pro ($20/mo) — raises timeout 10s→300s, resolves ToS (Hobby = non-commercial only)

**Airtable Slug fields (30 min):**
- [ ] Add `Slug` formula field to Companies table: `LOWER(SUBSTITUTE(SUBSTITUTE({Company}, " ", "-"), "&", "and"))`
- [ ] Add `Slug` formula field to Investors table: `LOWER(SUBSTITUTE(SUBSTITUTE({Company}, " ", "-"), "&", "and"))`
- [ ] Update `getCompanyBySlug()` in `lib/airtable.ts`: replace "fetch all + .find()" with `filterByFormula={Slug}="${slug}"` + `maxRecords: 1`
- [ ] Update `getInvestorBySlug()` the same way
- [ ] Detail pages go from 14+ API calls → 1

**Rate limiter (30 min):**
- [ ] `npm install p-limit`
- [ ] Add to `lib/airtable.ts`: `const limit = pLimit(4)` — wrap all `fetchAirtable` and `fetchAllAirtable` calls
- [ ] Eliminates race condition between `getJobs()` and `getFilterOptions()` both paginating simultaneously
- [ ] 4 req/sec (not 5) gives 20% headroom to avoid Airtable's 30-second penalty on 429 errors

**ISR caching (15 min):**
- [ ] Remove `export const dynamic = 'force-dynamic'` from `app/page.tsx`
- [ ] Remove `cache: 'no-store'` from `fetchAirtable()` — or make it configurable
- [ ] Add `export const revalidate = 3600` to homepage and listing pages
- [ ] Note: ISR background regen still hits Airtable until Supabase read path is built (Phase 1). This is OK on Pro plan (300s timeout) as a stopgap.

**Airtable schema additions (30 min — done in Airtable UI):**
- [ ] Jobs table: add `Last Seen At` (date) field
- [ ] Jobs table: add `Removed At` (date) field
- [ ] Jobs table: add `Is Active` (checkbox, default true) field
- [ ] All tables: add `Last Modified Time` auto-field (enables incremental sync)
- [ ] Companies table: add `Enrichment Status` (single select: pending / enriched / failed) field
- [ ] Rename Investors.`Company` → `Firm Name` (fixes confusing name collision)
  - Update all references in `lib/airtable.ts` and API routes

**Enable swcMinify (5 min):**
- [ ] Set `swcMinify: true` in `next.config.js` (stable since Next.js 13, reduces bundle size)

**Extract shared helpers (2 hrs):**
- [ ] Extract `parseLocation()` from 5 duplicated copies in `airtable.ts` → `lib/parsers/location.ts`
- [ ] Extract `mapJobRecord()` from 5 duplicated record-mapping blocks → `lib/mappers/job.ts`
- [ ] Extract `buildLookupMaps()` (company/investor/industry/function maps) → `lib/mappers/lookup.ts`
- [ ] Verify all pages still work after refactor
- [ ] This must happen before building the Supabase sync (Phase 1) so the sync can reuse these helpers

### Phase 0C — Stale Job Cleanup (Week 1)
> "If a talent partner sees 48 open roles but 20 are stale, trust is destroyed instantly."

This is prerequisite to the investor product. Data quality is the product.

- [ ] Update sync pipeline (`/api/sync-jobs`): on each sync run, update `Last Seen At` for every job returned by ATS API
- [ ] Add removal detection: after sync, find jobs for that company where `Last Seen At` < today → set `Is Active` = false, set `Removed At` = today
- [ ] Add expiration rule: jobs not seen for 14+ days are flagged as stale, 30+ days are hidden from consumer board
- [ ] Update `getJobs()` to filter out inactive jobs (where `Is Active` = false)
- [ ] Verify on preview URL that stale jobs no longer appear
- [ ] Increase `enrich-ats-urls` batch size from 15 → 50 and add to GitHub Actions cron (speeds up ATS discovery for investor onboarding)

### Phase 1 — Supabase Foundation (Weeks 1-2)

- [ ] Set up Supabase Pro project ($25/mo)
- [ ] Create schema (tables in schema section above)
- [ ] **Initial full sync** (run locally, not on Vercel — no timeout constraint):
  - One-time: fetch all records from all Airtable tables
  - Map Airtable record IDs → Supabase UUIDs
  - Populate: companies, investors, investor_companies edges, jobs, industries
  - Verify: spot-check 10 companies, 50 jobs between Airtable and Supabase
- [ ] **Incremental nightly sync** (GitHub Actions cron, after daily ATS sync):
  - Uses `Last Modified Time` field as cursor (added in Phase 0B)
  - `filterByFormula: IS_AFTER({Last Modified Time}, '${lastSyncTimestamp}')`
  - Fetches only changed records (~50-200 records/night = 1-5 API pages)
  - Upserts into Supabase (ON CONFLICT on airtable_id)
  - Stores last sync timestamp in Supabase `sync_metadata` table
  - Handles deleted records: weekly full reconciliation (fetch all IDs, diff against Supabase, soft-delete missing)
- [ ] **Daily snapshot pipeline** (runs after sync):
  - For each company: count active jobs, group by department/location/seniority
  - Compare to previous day's snapshot: compute delta, new roles, removed roles
  - Insert into `company_snapshots`
  - Refresh `portfolio_summaries` materialized view
- [ ] **Consumer board read path** (switches homepage from Airtable → Supabase):
  - New `lib/supabase.ts` with `getJobsFromSupabase()` — single SQL query with JOINs replaces 36+ Airtable calls
  - Homepage `getJobs()` reads from Supabase instead of Airtable
  - ISR `revalidate = 3600` now regenerates in <100ms (Supabase query) instead of 36+ seconds (Airtable pagination)
  - Detail pages can remain on Airtable (Slug-based filterByFormula is fast enough)

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

#### 3.0 — Dashboard Shell & Foundations

- [ ] Install Tremor: `npm install @tremor/react`
- [ ] Configure Tremor dark theme tokens in `tailwind.config.ts`:
  ```
  Area fill: 10-15% opacity of accent (#5e6ad2)
  Grid lines: #2a2a2b
  Tooltip background: #262626
  Tooltip text: #e8e8e8
  Axis labels: #888
  ```
- [ ] Build dashboard layout (`app/dashboard/layout.tsx`):
  - **Sidebar** (left, 240px, collapsible on mobile):
    - Cadre logo (top)
    - Nav items: Portfolio, Alerts, Compare, Settings
    - Active state: accent left border + bg highlight
    - Firm name + user avatar at bottom
    - Collapse to icon-only on mobile (hamburger toggle)
  - **Top bar** (right of sidebar):
    - Breadcrumb trail (Dashboard → Company Name)
    - Data status indicator: "Coverage: 42/50 companies | Last sync: 2h ago"
    - Notification bell (alert count badge)
    - User menu (settings, billing, sign out)
  - **Main content area:** scrollable, max-w-6xl centered
- [ ] Investor auth flow (Clerk, gated behind login — redirect to /dashboard after sign-in)
- [ ] Add `app/dashboard/loading.tsx` skeleton (sidebar + KPI placeholders + table shimmer)

#### 3.1 — Portfolio Overview (`/dashboard`)

**Above the fold — KPI strip (4-5 metric cards):**
- [ ] Total Open Roles (number + sparkline mini trend)
- [ ] WoW Net Change (number + green/red arrow + percentage)
- [ ] Companies Actively Hiring (count out of total tracked)
- [ ] Active Alerts (count, colored by severity — clicking navigates to /dashboard/alerts)
- [ ] Hiring Velocity (new roles/week, rolling 4-week average)

**Portfolio table:**
- [ ] Columns:
  | Company | Stage | Open Roles | WoW Change | Top Department | Velocity | Sync Status |
  - Company: logo + name (linked to deep-dive)
  - Stage: pill badge (Seed, A, B, C, D+)
  - Open Roles: number
  - WoW Change: number with arrow + color (green positive, red negative, gray zero)
  - Top Department: name + percentage of total
  - Velocity: roles/week (4-week rolling average)
  - Sync Status: "Active" (green dot), "Pending" (amber dot + "est. 48h"), "No ATS" (gray dot), "Sync failing" (red dot)
- [ ] **Default sort: WoW Change descending** (biggest movers first)
- [ ] Sortable by clicking any column header (ascending/descending toggle)
- [ ] Filter bar above table: stage multi-select, industry multi-select, search by company name
- [ ] **Inline alert badges:** on company rows with active alerts:
  - Red dot: hiring freeze detected
  - Amber dot: significant change (>25% WoW)
  - Blue dot: new department or executive hire
- [ ] **Unmatched companies shown as grayed-out rows** at the bottom of the table:
  - All metric columns show `—`
  - Status column shows "Pending — est. 48h" or "No ATS detected"
  - NOT counted in KPI strip totals
- [ ] Pagination: 50 companies per page (most portfolios fit on one page)
- [ ] Empty state: "Add your portfolio companies to get started" with CTA button

#### 3.2 — Company Deep-Dive (`/dashboard/company/[slug]`)

**Header section:**
- [ ] Company name, logo, stage badge, industry badge, HQ location
- [ ] Sync status indicator + "Last synced: X hours ago"
- [ ] Quick stats row: Total Open Roles | WoW Change | Hiring Velocity | Time on Cadre

**Trend chart (primary visualization):**
- [ ] Tremor `<AreaChart>` — open roles over time
- [ ] Line with subtle area fill (10-15% opacity of #5e6ad2)
- [ ] Default range: 8 weeks, weekly aggregation
- [ ] Time range toggle: 4w / 8w / 12w buttons
- [ ] Hover tooltip: date, total roles, net change from previous period
- [ ] Grid lines at #2a2a2b, axis labels at #888

**Department breakdown:**
- [ ] Tremor `<BarList>` — horizontal bars showing roles per department
- [ ] Sorted by count descending
- [ ] Each bar shows: department name, count, percentage of total
- [ ] Color-coded to match consumer product department colors (Engineering blue, Sales orange, etc.)

**Role listing:**
- [ ] Tabbed view: "All Open" | "New This Week" | "Removed This Week"
- [ ] Each tab shows role cards: title, department badge, location, posted date
- [ ] "New This Week" tab: green left border on each card
- [ ] "Removed This Week" tab: red left border, strikethrough title
- [ ] Searchable by role title
- [ ] Pagination: 25 per page

**Alert history for this company:**
- [ ] Compact timeline of past alerts (last 30 days)
- [ ] "Hiring spike detected — +8 roles in 1 week" with date
- [ ] Links to full alert detail

#### 3.3 — Side-by-Side Comparison (`/dashboard/compare`)

- [ ] Company selector: multi-select dropdown, pick 2-5 companies from portfolio
- [ ] **URL state: `?companies=acme-ai,beacon-labs,cortex`** (shareable link)
- [ ] **Comparison table:**
  | Metric | Company A | Company B | Company C |
  - Open Roles
  - WoW Change (colored)
  - Top Department
  - Eng % of Hiring
  - Hiring Velocity (roles/week)
  - Stage
- [ ] **Trend overlay chart:**
  - Tremor `<LineChart>` — multi-line, one per company
  - Each company a different color (accent, green, amber, etc.)
  - NOT area chart (overlapping fills obscure data — council consensus)
  - Legend below chart with company name + color swatch
  - Default: 8 weeks, weekly aggregation
- [ ] **Department comparison:**
  - Grouped horizontal bar chart: departments as rows, bars per company
  - Visual diff: which company is heavier on Engineering vs. Sales

#### 3.4 — Onboarding Flow

- [ ] **Step 1: Welcome screen** after first sign-in
  - "Add your portfolio companies to get started"
  - Textarea: paste company names (one per line)
  - OR: CSV upload (column: company_name)
  - "Add companies" button
- [ ] **Step 2: Matching screen** (instant, client-side fuzzy match + server confirmation)
  - Three-column result:
    - Green check: "Matched — data available now" (count)
    - Amber clock: "Syncing — data available in 24-48h" (count)
    - Gray question: "Under investigation — 2-3 business days" (count)
  - Each section expandable to show individual company names
  - "Continue to dashboard" button
- [ ] **Step 3: Dashboard loads** with matched companies showing real data immediately
  - Banner at top: "15 companies are being added. We'll notify you when they're ready."
  - Unmatched companies visible as grayed-out rows (council consensus: don't hide them)
- [ ] **Matt notification:** Loops.so transactional email with list of unmatched companies for manual ATS discovery
- [ ] **In-dashboard "Add companies" button** in sidebar for ongoing additions (same flow, minus the welcome screen)

### Phase 4 — Alerts & Billing (Weeks 5-7)

#### 4.1 — Alert Data Model & Engine

- [ ] **Supabase `alerts` table:**
  ```sql
  alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_account_id uuid REFERENCES investor_accounts,
    company_id uuid REFERENCES companies,
    alert_type text NOT NULL,        -- hiring_spike, hiring_freeze, new_department, executive_hire, sync_failing
    severity text NOT NULL,          -- info, warning, critical
    title text NOT NULL,             -- "Hiring spike: +12 roles this week"
    body text,                       -- "Beacon Labs added 12 roles, up from avg 3/week. 8 of 12 are Sales & GTM."
    data jsonb,                      -- structured payload (roles added, dept breakdown, etc.)
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
  )
  CREATE INDEX idx_alerts_investor_unread ON alerts(investor_account_id, is_read, created_at DESC);
  ```
- [ ] **Alert engine** (cron job, runs after daily snapshot):
  - Hiring Spike: >25% role increase in 1 week
  - Hiring Freeze: >30% role decrease in 1 week, or 0 new roles for 3+ weeks when prior avg was >2/week
  - New Department: first-ever role in a department for that company
  - Executive Hire: VP/C-suite/Head-of/Director title posted
  - Sync Failing: company's ATS hasn't returned data for 48+ hours (GPT's catch — data health is alert-worthy)

#### 4.2 — Alert UI (Three Tiers)

- [ ] **Tier 1 — Inline table badges** (on Portfolio Overview):
  - Red dot on row: hiring freeze
  - Amber dot: significant change (>25% WoW)
  - Blue dot: new department or executive hire
  - Clicking badge opens popover with alert summary + "View details" link
- [ ] **Tier 2 — Notification bell** (in dashboard top bar):
  - Badge with unread count
  - Dropdown: last 15-20 alerts, compact cards
  - Each card: company logo, alert title, timestamp, severity color stripe
  - "Mark all read" + "View all alerts" links
- [ ] **Tier 3 — Alerts page** (`/dashboard/alerts`):
  - Full feed of all alerts, filterable by type and severity
  - Each alert card: company, type badge, title, body text, timestamp
  - Bulk actions: mark read, dismiss
  - "This week" / "This month" / "All time" time filters
- [ ] **Alert delivery via Loops.so:**
  - Daily digest email (not per-alert) consolidating all alerts from the past 24h
  - Only sent if there are new alerts
  - Links back to specific alerts in dashboard

#### 4.3 — Alert Preferences (`/dashboard/settings/alerts`)

- [ ] Toggle each alert type on/off
- [ ] Email digest: on/off + frequency (daily / weekly)
- [ ] Per-company mute (silence alerts for specific companies)

#### 4.4 — Stripe Billing

- [ ] **Stripe integration**
  - Stripe Checkout for initial signup
  - Metered billing based on active synced companies
  - Monthly invoice with line items
  - Free during pilot period for design partners (manual override flag in `investor_accounts`)
- [ ] **Billing page** (`/dashboard/settings/billing`):
  - Current plan summary: "42 active companies × $20 = $840 + $500 base = $1,340/mo"
  - Company breakdown: which companies are billable (active) vs. free (pending/no_ats)
  - Next invoice estimate
  - Payment method management (Stripe Customer Portal)
  - Invoice history
- [ ] **Billing logic:**
  - Count `portfolio_tracked_companies` where `sync_status = 'active'`
  - Apply formula: $500 + max(0, count - 15) × $20
  - Companies with `sync_status = 'pending'` or `'no_ats'` are excluded

### Phase 5 — Consumer Polish (Weeks 6-8, interleaved with Phase 4)
> Deeper consumer fixes from the UI/UX audit. Lower priority than investor product but improves the platform design partners will also see.

- [ ] **EntityDetailLayout** — unified shared component for investor/company/industry pages:
  - Shared: header section, search + remote toggle, dynamic tags, job list with pagination
  - Dynamic tags derived from actual job data on that page (not hardcoded 15)
  - Multi-select tags (match homepage filter behavior, not single-select)
  - Consistent remote filtering: `isRemoteJob(job)` helper → `remoteFirst === true OR location includes "remote"`
  - Responsive: badges hide on mobile, tags wrap
- [ ] **Mobile bottom sheet filter** (replaces current hidden dropdown):
  - Full-screen sheet sliding up from bottom
  - Accordion sections: Department, Location, Industry, Work Mode, Investor, Posted
  - Sticky footer: "Show N results" button + "Clear all"
  - Quick chips above results (top 2-3 filters: search + department + remote toggle) always visible
- [ ] **Color token centralization:**
  - Move all hardcoded hex strings to Tailwind theme in `tailwind.config.ts`
  - Define: `bg-base`, `bg-surface`, `bg-elevated`, `bg-hover`, `text-primary`, `text-body`, `text-muted`, `text-subtle`, `accent`, `accent-hover`
  - Replace `bg-[#1a1a1b]` → `bg-surface`, `text-[#888]` → `text-muted`, etc. across all components
  - Makes future theme changes (or investor dashboard theming) a single-file edit

### Phase 6 — Dashboard Polish & Scale (Weeks 7-10)

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

- [ ] **Upgrade Vercel to Pro ($20/mo)** — this is urgent (ToS compliance + timeout fix)
- [ ] Upgrade Supabase to Pro plan ($25/mo)
- [ ] Confirm design partner list (5-10 firms from a16z, Collab + Currency, AI/Crypto network)
- [ ] Set up Loops.so account
- [ ] Set up Stripe account (or confirm existing)
- [ ] Add Slug formula fields to Companies and Investors tables in Airtable (see Phase 0B)
- [ ] Add Last Seen At, Removed At, Is Active, Last Modified Time fields to Jobs table in Airtable (see Phase 0B)
- [ ] Add Enrichment Status field to Companies table in Airtable
- [ ] Rename Investors.Company → Firm Name in Airtable
- [ ] Draft initial outreach message to design partners (can use Portfolio Pulse concept as the hook: "Want to get a free weekly hiring pulse across your portfolio? We're piloting this with 5 firms.")

---

---

## Dashboard Design Tokens (Reference for Implementation)

All dashboard charts and UI elements should use these tokens for consistency across the dark theme.

### Color System

```
Background:
  --bg-base:      #0e0e0f   (page background)
  --bg-surface:   #1a1a1b   (cards, table rows)
  --bg-elevated:  #252526   (hover states, dropdowns)
  --bg-hover:     #2a2a2b   (active states)

Text:
  --text-primary: #ffffff   (headings, numbers)
  --text-body:    #e8e8e8   (body text, table cells)
  --text-muted:   #999999   (secondary text — WCAG AA compliant on #1a1a1b)
  --text-subtle:  #888888   (tertiary text, timestamps)

Accent:
  --accent:       #5e6ad2   (interactive elements, links, primary charts)
  --accent-hover: #6e7ae2   (hover on interactive elements)

Severity:
  --green:        #4ade80   (positive change, spikes, new)
  --red:          #f87171   (negative change, freezes, removed)
  --amber:        #fbbf24   (warnings, significant changes)
  --blue:         #60a5fa   (info, new departments, exec hires)

Charts (Tremor overrides):
  --chart-grid:   #2a2a2b   (gridline color)
  --chart-tooltip-bg: #262626
  --chart-tooltip-text: #e8e8e8
  --chart-area-opacity: 0.12  (10-15%)
```

### Alert Badge Colors

| Alert Type | Inline Badge | Severity |
|-----------|-------------|----------|
| Hiring Freeze | Red dot (#f87171) | Critical |
| Significant Change (>25% WoW) | Amber dot (#fbbf24) | Warning |
| New Department | Blue dot (#60a5fa) | Info |
| Executive Hire | Blue dot (#60a5fa) | Info |
| Sync Failing | Red dot (#f87171) | Critical |

### Department Badge Colors (shared between consumer + investor)

```
Engineering:                #3b82f6 (blue)
Sales & GTM:                #f97316 (orange)
Marketing:                  #a855f7 (purple)
AI & Research:              #06b6d4 (cyan)
Product:                    #10b981 (emerald)
Design:                     #ec4899 (pink)
Customer Success & Support: #eab308 (yellow)
People & Talent:            #8b5cf6 (violet)
Finance & Legal:            #6b7280 (gray)
Operations & Admin:         #78716c (stone)
```

### Chart Types by Use Case

| Visualization | Component | Chart Type | Notes |
|--------------|-----------|------------|-------|
| Hiring trend over time | `<AreaChart>` | Line with area fill | 10-15% opacity fill, weekly aggregation default |
| Department breakdown | `<BarList>` | Horizontal bars | Sorted by count desc, color-coded |
| Comparison overlay | `<LineChart>` | Multi-line (no area) | One color per company, max 5 lines |
| KPI sparkline | `<SparkAreaChart>` | Mini trend | Used in KPI cards, last 4 weeks |
| WoW change indicator | Custom | Number + arrow | Green up, red down, gray zero |

---

*This plan is designed for a 1-person team + AI tooling. Each "week" may take 1.5-2 weeks in practice. That's fine. The sequencing matters more than the speed.*
