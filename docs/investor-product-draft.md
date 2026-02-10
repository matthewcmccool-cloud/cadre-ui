# Cadre for Investors — Product Draft

**Document purpose:** Long-form product brief for Cadre's paid investor product. Written to be fed into Perplexity's model council for ideation on how to make this maximally valuable to the market.

**Date:** February 2026
**Author:** Matt (via Claude)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Part I — Product Manager Perspective](#part-i--product-manager-perspective)
   - [The Market Problem](#the-market-problem)
   - [Who We're Building For](#who-were-building-for)
   - [Product Vision](#product-vision)
   - [Core Feature Set](#core-feature-set)
   - [Pricing & Packaging](#pricing--packaging)
   - [Go-To-Market](#go-to-market)
   - [Success Metrics](#success-metrics)
   - [Competitive Landscape](#competitive-landscape)
   - [Risks & Open Questions](#risks--open-questions)
3. [Part II — Data Engineering Perspective](#part-ii--data-engineering-perspective)
   - [What We Already Have](#what-we-already-have)
   - [The Time-Series Moat](#the-time-series-moat)
   - [Derivable Signals & Insights](#derivable-signals--insights)
   - [Flags & Alerts Engine](#flags--alerts-engine)
   - [Benchmarking & Cohort Analysis](#benchmarking--cohort-analysis)
   - [Data Pipeline Architecture](#data-pipeline-architecture)
   - [Data Quality & Coverage Gaps](#data-quality--coverage-gaps)
   - [What We'd Need to Build](#what-wed-need-to-build)

---

## Executive Summary

Cadre sits on a unique dataset: real-time, structured hiring data from 1,300+ VC-backed companies, linked to 200+ investors, across 16,000+ open roles — synced daily from Greenhouse, Lever, and Ashby. No one else has this graph wired together.

The free product lets job seekers filter roles by investor portfolio. The paid product flips the lens: it gives *investors* portfolio-level hiring intelligence they currently cobble together manually — or don't have at all.

The core insight: **hiring is the highest-fidelity leading indicator of a company's strategic direction, and VCs have zero systematic access to it across their portfolios.**

This document outlines the product from two angles:
- **PM:** What to build, for whom, why they'll pay, and how to package it.
- **Data Engineer:** What signals we can extract from the data we already have, what new data we'd need, and how to build the pipeline that powers it all.

---

## Part I — Product Manager Perspective

### The Market Problem

Talent partners, platform team leads, and operating partners at VC firms face the same problem: they're responsible for portfolio hiring health but have no systematic way to monitor it.

**What they do today:**
- Manually check career pages of 30–150 portfolio companies, one by one
- Rely on quarterly board decks for headcount numbers (stale by the time they arrive)
- Copy/paste job counts into spreadsheets that go stale within a week
- React to problems (hiring freezes, key departures) instead of detecting them early
- Have no cross-portfolio benchmarks — "Is this company hiring fast or slow for its stage?"

**Why this hurts:**
- A surprise hiring freeze at a Series B company might signal burn-rate problems 3 months before it shows up in board financials
- A company that suddenly opens 10 engineering roles might be pivoting — and the investor doesn't know
- Talent partners can't proactively route candidates to portfolio companies because they don't know who's actually hiring *right now*
- GPs and LPs ask "how is the portfolio hiring?" and the answer is anecdotal

**Market context:**
- There are ~3,800 VC firms in the US alone (NVCA)
- Nearly every firm with >$100M AUM has at least one platform/talent person
- The platform team budget line has grown significantly as VCs compete on "value-add"
- Existing tools (LinkedIn Recruiter, Harmonic, Revealera) focus on sourcing candidates, not portfolio-level analytics

### Who We're Building For

**Primary persona: The Talent Partner / Head of Talent**
- Works at a VC firm with 20–150 portfolio companies
- Responsible for helping portfolio companies hire (executive recruiting, employer branding, referral networks)
- Needs to know: Who is hiring? For what? How urgently? Is anyone struggling?
- Currently tracks this in a spreadsheet or not at all
- Reports to GPs, produces materials for LP meetings
- Title variants: VP of Talent, Platform Lead, Talent Network Manager, Head of Portfolio Talent

**Secondary persona: The Operating Partner / GP**
- Wants a "portfolio pulse" they can glance at weekly
- Cares about: Are my companies executing on their growth plans? Any red flags?
- Doesn't want to log into another tool — wants a digest or a one-pager
- Uses hiring velocity as a proxy for company health

**Tertiary persona: The LP / Fund Analyst**
- Evaluating a fund's portfolio health
- Would love aggregate hiring trends as a signal of fund performance
- Probably not a direct buyer, but a stakeholder who influences the buyer

**Anti-persona:**
- Individual recruiters looking for candidates (that's LinkedIn/Gem territory)
- Startup operators looking for hiring benchmarks (possible future product, not this one)

### Product Vision

**One-liner:** Cadre for Investors is a real-time portfolio hiring intelligence platform that replaces manual tracking with automated signals, comparisons, and alerts.

**The experience we want to deliver:**

> A talent partner at Sequoia opens Cadre on Monday morning. They see a dashboard showing all 87 portfolio companies, sorted by hiring activity. Acme AI added 14 new roles last week — mostly engineering — that's the product pivot they discussed at the last board meeting. Beacon Labs dropped from 22 open roles to 8 overnight — flagged in red. The talent partner clicks in, sees the roles that were removed, and fires off a note to the CEO asking if everything's okay. They didn't have to check 87 career pages. Cadre did it for them.

> On Friday, the same talent partner exports a one-page PDF: "Portfolio Hiring Pulse — Week of Feb 3." It shows aggregate trends (up 6% this week), top-hiring companies, new departments emerging, and three flags. They attach it to the GP weekly email. The GP forwards it to two LP contacts who've been asking about portfolio health.

### Core Feature Set

#### Tier 1 — The Dashboard (MVP / "Early Access")

**1. Portfolio Overview**
- Single view of all portfolio companies with live open role counts
- Sortable by: total roles, weekly change, department concentration, stage
- Company cards showing: name, stage, total roles, top department, week-over-week delta
- Quick-filter by stage (Seed, A, B, C, D+), industry, headcount band

**2. Company Deep-Dive**
- Click into any company to see full breakdown
- Department-level role distribution (pie/bar chart)
- Role-level listing with title, department, location, posted date
- Historical trend line (roles over time — 4/8/12 week views)
- "New this week" and "Removed this week" role lists

**3. Side-by-Side Comparison**
- Select 2–5 companies and compare on key metrics
- Metrics: total roles, department mix, hiring velocity, week-over-week change, engineering % of hiring
- Overlay trend lines on the same chart
- Use case: "How does our Series B AI company compare to the other two?"

**4. Weekly Digest Email**
- Automated email every Monday morning
- Summary: portfolio-wide open roles, net change, top 3 movers, any flags
- Per-company one-liner: "Acme AI: 48 roles (+6), top dept: Engineering"
- Link back to dashboard for details

#### Tier 2 — Signals & Alerts

**5. Hiring Spike Detection**
- Alert when a company's role count increases by >25% in a week
- Contextualize: "Beacon Labs added 12 roles this week, up from an average of 3/week over the past month. 8 of 12 are Sales & GTM."
- Interpretation hint: "This may indicate a GTM push following product launch"

**6. Hiring Freeze / Slowdown Detection**
- Alert when a company's role count drops by >30% in a week (roles removed, not just filled)
- Or: no new roles posted for 3+ weeks when the prior average was >2/week
- Red flag: "Cortex has posted zero new roles in 21 days. Prior average: 4.2 roles/week."

**7. New Department Signal**
- Alert when a company starts hiring in a department they've never hired in before
- E.g., "Acme AI posted its first-ever Sales & GTM roles (3 roles). This company has historically only hired Engineering and Product."
- Signal: potential pivot to revenue, or approaching product-market fit

**8. Executive Hire Detection**
- Flag job titles containing VP, C-suite, Head of, Director
- "Beacon Labs posted 'VP of Engineering' — first VP-level role in our dataset"
- Signal: company is scaling leadership, likely at an inflection point

**9. Geographic Expansion Signal**
- Alert when a company starts posting roles in a new country or city
- "Acme AI posted 3 roles in London. All previous roles were US-based."
- Signal: international expansion

**10. Velocity Anomaly Detection**
- Rolling average of new roles per week, flagged when current week deviates by >2 standard deviations
- Works both ways: unusually fast hiring and unusually slow

#### Tier 3 — Exports & Storytelling

**11. PDF Snapshot (Board Deck Insert)**
- One-page PDF: portfolio hiring pulse
- Designed for board decks and LP reports
- Aggregate stats + top 5 movers + trend chart + flags
- Branded with the VC firm's logo (uploaded in settings)

**12. CSV Download**
- Full data export: company, role, department, location, posted date, status
- Filterable before export
- Use case: talent partner wants to do their own analysis or load into their CRM

**13. LinkedIn Post Generator**
- One-click formatted post highlighting portfolio hiring
- "Our portfolio is hiring! 247 open roles across 43 companies this week. Top roles: [3 featured]. See them all: [cadre link]"
- Talent partners post these weekly — it's a major channel for candidate sourcing

**14. Slack/Teams Integration**
- Weekly summary posted to a #portfolio-talent channel
- Real-time alerts for spikes/freezes posted as they're detected
- Reduces need to log into the dashboard

### Pricing & Packaging

**Principle:** Price on value, not on data volume. The value is the *insight* (saved time, early risk detection, LP storytelling), not the raw job listings.

**Proposed tiers:**

| | Starter | Pro | Enterprise |
|---|---|---|---|
| **Price** | $500/mo | $1,500/mo | Custom |
| **Portfolio companies tracked** | Up to 30 | Up to 150 | Unlimited |
| **Dashboard** | Yes | Yes | Yes |
| **Company deep-dive** | Yes | Yes | Yes |
| **Side-by-side comparison** | 2 companies | 5 companies | Unlimited |
| **Weekly digest email** | Yes | Yes | Yes + custom schedule |
| **Alerts (spike/freeze/new dept)** | Email only | Email + Slack | Email + Slack + API |
| **PDF snapshots** | 1/month | Unlimited | Unlimited + white-label |
| **CSV export** | No | Yes | Yes |
| **LinkedIn post generator** | No | Yes | Yes |
| **Historical data** | 4 weeks | 12 weeks | Full history |
| **API access** | No | No | Yes |
| **Seats** | 2 | 5 | Unlimited |
| **Support** | Email | Email + onboarding call | Dedicated CSM |

**Why these numbers:**
- $500/mo is an easy "just expense it" line for a talent partner at a fund with $100M+ AUM
- $1,500/mo is the sweet spot for a mid-size fund getting real value — it's less than one recruiter placement fee
- Enterprise is for the Sequoias, a16zs, Accels who want API access and white-labeling

**Alternative model to consider:** Per-portfolio-company pricing ($10–25/company/month). Scales naturally with fund size. A 50-company fund pays $500–1,250/mo. A 200-company fund pays $2,000–5,000/mo.

### Go-To-Market

**Phase 1: Founder-led sales (now → 10 customers)**
- Personally reach out to talent partners at funds whose portfolios overlap heavily with our existing data (we already track their companies — show them)
- Offer free 30-day pilot with their actual portfolio data pre-loaded
- The `/for-investors` landing page is already live — drive traffic via LinkedIn posts
- Target: 10 paying customers within first quarter of launch

**Phase 2: Content-led growth (10 → 50 customers)**
- Publish a monthly "VC Portfolio Hiring Report" — aggregate trends across the market
- "Which sectors are hiring fastest? Where are freezes happening? Engineering vs. Sales allocation by stage."
- This content attracts the exact buyer and demonstrates the data's value
- Gate the detailed breakdown behind a signup wall

**Phase 3: Product-led growth (50 → 200 customers)**
- Free tier: any VC can see a limited view of their portfolio (current week only, no alerts, no exports)
- Paid unlocks history, alerts, exports, and comparisons
- Viral loop: talent partners share LinkedIn posts generated by Cadre, linking back to the platform

**Channel strategy:**
- LinkedIn is the #1 channel (talent partners live there)
- VC community Slack groups (Platform, Talent Network, etc.)
- Conference presence (Talent Summit, Platform Summit)
- Direct outreach to platform team leads at top 200 US VC firms (list is knowable and finite)

### Success Metrics

**Leading indicators:**
- Number of investor accounts created
- Weekly active users on dashboard
- Digest email open rate
- Alert interaction rate (clicked through)
- Time on dashboard per session

**Lagging indicators:**
- Monthly recurring revenue (MRR)
- Customer retention (monthly/quarterly churn)
- Net Revenue Retention (expansion within accounts)
- Number of portfolio companies covered (data coverage)

**North star metric:** Weekly active investor accounts viewing their dashboard. If they're looking, they're getting value.

### Competitive Landscape

| Player | What they do | How Cadre differs |
|--------|-------------|-------------------|
| **LinkedIn Talent Insights** | Aggregated workforce data, hiring trends | Not portfolio-specific. Expensive. No VC lens. |
| **Harmonic** | Company discovery + signal tracking for VCs | Focuses on *finding* companies to invest in, not monitoring existing portfolio hiring. |
| **Revealera / Telemetry** | Alternative data for investors | Broad economic signals, not company-level hiring detail. |
| **Pallet / Getro** | Talent networks for VC portfolios | Candidate-facing job boards, not investor-facing analytics. |
| **Internal spreadsheets** | Manual career page tracking | What we're replacing. Stale, incomplete, time-consuming. |

**Cadre's wedge:**
- We already have the data pipeline (ATS connectors syncing daily)
- We already have the knowledge graph (Jobs → Companies → Investors → Industries)
- No one else has portfolio-level hiring analytics with daily granularity
- The time-series moat grows every day we collect data — no competitor can backfill our history

### Risks & Open Questions

**Data coverage risk:** We currently track ~1,300 companies. A large VC firm might have portfolio companies we don't cover yet. Mitigation: onboarding flow that identifies gaps, then we spin up ATS connectors for missing companies within 24–48 hours.

**ATS dependency risk:** Greenhouse, Lever, and Ashby cover ~60–70% of VC-backed companies. Some use Workday, iCIMS, or custom career pages. Mitigation: build additional connectors over time; use Perplexity API to scrape career pages as a fallback.

**"Just a dashboard" risk:** If the product feels like "just another dashboard," churn will be high. Mitigation: the alerts and exports are the retention hooks. The dashboard gets you in; the weekly digest keeps you engaged without logging in.

**Pricing sensitivity:** VC platform budgets vary wildly. A micro-VC ($20M fund) won't pay $1,500/mo. A mega-fund won't blink. Need to validate pricing with early conversations.

**Legal/TOS risk:** Scraping career page data is generally permissible (public data), but ATS API terms should be reviewed. Greenhouse and Lever have public APIs; we're consuming them as intended.

**Open questions for the model council:**
1. Should we offer a fund-of-funds tier (track portfolios across multiple VC firms)?
2. Is there a market for a "talent marketplace" layer on top of this (connecting candidates to portfolio companies, facilitated by the talent partner)?
3. How much would investors pay for a *predictive* signal? E.g., "Based on hiring patterns, this company is likely to raise its next round in 6–9 months."
4. Should we white-label this for large funds, or keep Cadre-branded for distribution leverage?
5. Is there an LP-facing version of this product? LPs evaluating a fund could use portfolio hiring health as a diligence signal.

---

## Part II — Data Engineering Perspective

### What We Already Have

The current Cadre data infrastructure collects and structures the following:

**Job Listings (~16,000+ records, synced daily):**
- Title, Company (linked record), Location, Remote flag
- Job URL, Apply URL, Salary (when available)
- Function (classified into ~16 categories: Engineering, Sales, Product, etc.)
- Department (rolled up into 10 analytics segments)
- Created Time (when we first saw the listing)
- Raw JSON (full ATS payload — contains additional metadata like offices, teams, requisition IDs)
- Investors (linked through company → investor relationship)
- Industry (via company lookup)

**Companies (~1,343 records):**
- Name, Slug, Website, Logo URL
- Stage (Seed, A, B, C, etc.)
- About (AI-enriched bio)
- HQ Location
- VCs (linked records — which investors back this company)
- Industry (linked record)
- ATS Platform (Greenhouse / Lever / Ashby)
- jobsApiUrl (API endpoint for syncing)

**Investors (~201 records):**
- Name, Slug, Website, LinkedIn
- Bio (AI-enriched)
- Location (AI-enriched)
- Portfolio Companies (derived via Companies.VCs linked field)
- Last Scraped (portfolio discovery timestamp)

**Industries:**
- Name, Slug
- Linked to companies

**Function Table:**
- Function name (granular: "Solutions Engineering," "Product Design / UX")
- Department (rolled up: "Sales & GTM," "Design")
- Two-level hierarchy enabling both detailed and aggregate views

### The Time-Series Moat

This is the single most important data engineering concept for the product.

**Current state:** We snapshot job listings daily. Each record has a `Created Time` (when we first saw it). When a job disappears from the ATS API, we don't currently track that — we just stop seeing it.

**What we need to build:** A proper time-series layer that records weekly snapshots of every company's hiring state. This is the moat.

**Proposed schema — Weekly Snapshots table:**

```
company_id          — link to Companies
snapshot_date       — date (every Sunday midnight)
total_open_roles    — integer
roles_by_department — JSON { "Engineering": 24, "Sales & GTM": 12, ... }
roles_by_location   — JSON { "San Francisco": 15, "Remote": 8, "New York": 5 }
roles_by_seniority  — JSON { "IC": 30, "Manager": 5, "Director+": 2 }
new_roles_this_week — integer (roles not seen last week)
removed_roles       — integer (roles seen last week but gone this week)
net_change          — integer (new - removed)
hiring_velocity     — float (7-day rolling average of new roles/day)
role_ids_added      — JSON array (which specific roles were added)
role_ids_removed    — JSON array (which specific roles went away)
```

**Why this matters:**
- Every week we collect data, the historical dataset becomes more valuable and harder to replicate
- Competitors would need to start from scratch — they can't backfill what we've already captured
- Time-series data enables trend detection, anomaly detection, and predictive signals
- After 6 months, we can say "here's how this company's hiring evolved quarter over quarter"
- After 12 months, we can benchmark: "Series B AI companies typically have X% engineering at month 6 post-raise"

### Derivable Signals & Insights

Here is everything we can derive from our existing (and soon-to-exist time-series) data. Organized by value to investors.

#### A. Portfolio Health Signals

**1. Aggregate Portfolio Hiring Pulse**
- Total open roles across all portfolio companies
- Week-over-week delta (absolute and percentage)
- Weighted by company stage (a 10% increase at a Series C matters more than at a Seed)
- "Your portfolio has 1,247 open roles, up 8.3% from last week"

**2. Portfolio Hiring Velocity**
- New roles posted per week, across the entire portfolio
- Trend line: accelerating, steady, or decelerating
- Breakdowns: by stage, by industry, by department

**3. Portfolio Department Mix**
- What percentage of all portfolio hiring is Engineering? Sales? AI?
- How does this compare to the broader market (all companies in Cadre, not just this portfolio)?
- Shift detection: "Your portfolio's AI & Research hiring went from 5% to 12% of all roles in the last 8 weeks"

**4. Portfolio Geographic Distribution**
- Where are portfolio companies hiring? SF, NYC, Remote, London, Bangalore?
- Trend: are companies moving toward remote? Expanding internationally?
- "62% of your portfolio's roles are Remote-friendly, up from 48% three months ago"

#### B. Company-Level Signals

**5. Hiring Acceleration / Deceleration Score**
- For each company: compare current week's hiring velocity to its 4-week and 12-week average
- Score: -2 (sharp deceleration) to +2 (sharp acceleration)
- Surface the top 3 accelerators and top 3 decelerators each week

**6. Department Concentration Index**
- How concentrated is a company's hiring in one department?
- Herfindahl-style index: 1.0 = all roles in one department; lower = diversified
- High concentration + specific department = strong signal (e.g., "90% Engineering" = building mode; "80% Sales" = GTM push)

**7. Stage-Appropriate Hiring Mix**
- Compare a company's department mix to the typical mix for its stage
- "Acme AI (Series B) has 60% Engineering roles. The median Series B company in your portfolio has 38%. This is unusually engineering-heavy."
- Useful for GPs assessing whether a company is over-indexed on building vs. selling

**8. Role Seniority Progression**
- Track the seniority level of new roles over time
- Progression from IC-heavy to Manager/Director-heavy signals organizational maturity
- "Beacon Labs has posted 4 Director+ roles this month — up from zero in the prior quarter. This company is building its management layer."

**9. Time-to-Fill Proxy**
- We can't see when a role is *filled*, but we can see when it *disappears* from the ATS
- If a role was posted on Day 0 and disappeared on Day 45, estimated time-to-fill ≈ 45 days
- Aggregate by department: "Engineering roles at Acme AI last an average of 52 days — 30% longer than the portfolio median of 40 days"
- Long time-to-fill signals: role is hard to fill, or company is uncompetitive on comp/brand

**10. Salary Intelligence**
- Many ATS listings include salary ranges (increasingly required by law in CO, NY, CA, WA, etc.)
- Aggregate salary bands by function, seniority, and geography
- "The median senior engineer salary at your portfolio companies is $180K–$220K. Portfolio-wide, 64% of engineering roles now include salary ranges."
- Useful for: talent partners advising portfolio companies on comp, GPs understanding burn implications

#### C. Cross-Portfolio & Market Signals

**11. Cohort Benchmarking**
- Group portfolio companies by stage, industry, or founding year
- Compare any company to its cohort: "How does Acme AI's hiring compare to other Series B AI companies?"
- Metrics: total roles, velocity, department mix, geographic spread

**12. Industry Hiring Trends**
- Aggregate hiring by industry across all companies in Cadre (not just one portfolio)
- "AI/ML companies increased hiring 22% this month. Fintech decreased 8%."
- Gives investors a macro view of sector momentum

**13. Function Demand Index**
- Which functions are seeing the most demand growth across the market?
- "AI & Research roles are up 34% month-over-month across all tracked companies"
- Useful for: talent partners who need to proactively build candidate pipelines

**14. Competitive Intelligence**
- When an investor backs Company A and a rival Company B is also in Cadre's dataset, surface comparisons
- "Your portfolio company Acme AI has 48 open engineering roles. Competitor RivalCo has 85."
- Requires: the investor to optionally flag competitors, or Cadre infers via industry + stage matching

**15. ATS Platform Adoption Trends**
- Which ATS platforms are gaining/losing market share among VC-backed companies?
- "Ashby adoption grew from 8% to 14% of tracked companies this quarter"
- Interesting signal for the ecosystem; could be a separate content play

#### D. Predictive & Composite Signals

**16. Fundraise Predictor**
- Hypothesis: companies ramp hiring significantly 2–4 months before announcing a funding round
- If we can validate this pattern against historical fundraise data (Crunchbase, PitchBook), we can flag: "Beacon Labs' hiring pattern matches the typical pre-Series B ramp"
- High value, but requires external data enrichment and model validation

**17. Pivot Detection**
- When a company's department mix shifts dramatically (e.g., from 80% Engineering to 40% Engineering + 40% Sales), it may signal a pivot from build mode to GTM mode
- "Acme AI's hiring mix shifted from 70% Engineering to 40% Engineering / 35% Sales over the past 8 weeks. This pattern historically correlates with post-PMF GTM expansion."

**18. Burn Rate Proxy**
- Open roles * estimated salary by function = rough monthly burn rate increase if all roles are filled
- "If Acme AI fills all 48 open roles at median market rates, estimated monthly payroll increase: ~$620K/month"
- Combined with known funding amount: "At this hiring pace, estimated runway impact: reduces 24-month runway to ~18 months"
- Caveat: rough estimate, but directionally useful for GPs

**19. Company Health Score (Composite)**
- Weighted composite of: hiring velocity trend, department diversification, seniority progression, time-to-fill, and stage-appropriate mix
- Single 0–100 score: "Beacon Labs: 84 (Healthy). Cortex: 52 (Watch)."
- The "credit score" for portfolio company hiring health
- GPs can glance at this weekly without reading any details

**20. Portfolio Risk Score**
- Aggregate company health scores across the portfolio
- Weight by check size or ownership percentage
- "Portfolio Hiring Health: 71/100. 3 companies flagged for attention."

### Flags & Alerts Engine

Every signal above can be turned into an automated flag. Here's the complete alert taxonomy:

| Flag | Trigger | Severity | Delivery |
|------|---------|----------|----------|
| Hiring Spike | >25% role increase in 1 week | Info | Digest + in-app |
| Hiring Freeze | >30% role decrease in 1 week, or 0 new roles for 3 weeks | Warning | Immediate email + Slack |
| New Department | First-ever role in a department | Info | Digest |
| Executive Hire | VP/C-suite/Head-of title posted | Info | Digest |
| Geographic Expansion | Roles in a new country | Info | Digest |
| Velocity Anomaly | >2 std dev from 12-week rolling average | Warning | Immediate email |
| Competitor Activity | Tracked competitor's roles >2x portfolio company | Alert | Weekly comparison |
| Seniority Shift | >3 Director+ roles in a month (from 0 prior) | Info | Digest |
| Department Pivot | >20 percentage point shift in department mix over 8 weeks | Warning | Immediate email |
| Stale Roles | Role open >90 days (proxy for hard-to-fill) | Info | Monthly report |
| Runway Pressure | Estimated burn increase >15% of known raise amount | Alert | Immediate email |

### Benchmarking & Cohort Analysis

One of the highest-value features we can offer is **"Is this normal?"** context for every metric.

**Cohort definitions we can support:**
- By funding stage (Seed, Series A, B, C, D+)
- By industry (AI/ML, Fintech, Health Tech, SaaS, etc.)
- By geography (US, Europe, Asia)
- By company age (0–2 years, 2–5 years, 5+ years)
- By ATS platform (Greenhouse vs. Lever vs. Ashby)
- By portfolio (this fund's companies vs. market)

**Benchmark metrics:**
- Median open roles per company by stage
- Department distribution by stage (e.g., "Series A companies typically have 45% Engineering, 20% Sales, 15% Product")
- Hiring velocity percentiles (P25, P50, P75 by stage)
- Time-to-fill by function and stage
- Remote-role percentage by industry
- Salary ranges by function, seniority, and geography

**Example output:**
> "Acme AI (Series B, AI/ML) has 48 open roles. This is at the 72nd percentile for Series B AI companies. Their engineering concentration (60%) is above the median (42%), suggesting they're still in deep build mode relative to peers. Hiring velocity (6 new roles/week) is at the 81st percentile — they're moving fast."

### Data Pipeline Architecture

**Current state:**
- Daily sync via GitHub Actions → `/api/sync-jobs` → Airtable
- Three ATS connectors: Greenhouse, Lever, Ashby
- Portfolio discovery via Perplexity API → `/api/scrape-portfolios`
- Enrichment via Perplexity: company bios, investor bios/locations, function backfill
- All data lives in Airtable (primary store)

**What needs to change for the investor product:**

**1. Snapshot Pipeline (new)**
- Cron job: every Sunday at midnight UTC
- For each company: count open roles, group by department/location/seniority
- Compare to previous week's snapshot: compute delta, new roles, removed roles
- Store in a new Airtable table (or migrate to a proper database if Airtable limits hit)
- This is the #1 infrastructure investment needed

**2. Alert Processing Engine (new)**
- Runs after each snapshot
- Evaluates all flag triggers against current + historical data
- Generates alert records: company, flag type, severity, message, data
- Routes to delivery channels: in-app notification, email, Slack webhook

**3. Investor-Scoped Data Layer (new)**
- Currently all data is global — any user sees everything
- Investor product needs scoped views: "Show me only MY portfolio companies"
- Options:
  - Airtable: filtered views per investor (quick, but doesn't scale)
  - Supabase: Row-level security by investor account (proper, needs migration)
  - Middleware: fetch all, filter in API layer by investor's portfolio (simplest for V1)

**4. Export Pipeline (new)**
- PDF generation: use a library like `@react-pdf/renderer` or Puppeteer to render dashboard view as PDF
- CSV: straightforward — transform job/snapshot records to flat CSV
- LinkedIn post: template engine with merge fields

**5. Job Removal Tracking (enhancement)**
- Current gap: when a job disappears from ATS, we don't record it
- Need: "last seen" timestamp on every job record
- On each sync: if a previously-seen job is no longer in ATS response, mark it as removed and record the date
- This unlocks time-to-fill proxy and churn detection

### Data Quality & Coverage Gaps

**Current coverage gaps and mitigation strategies:**

| Gap | Impact | Mitigation |
|-----|--------|------------|
| ~40% of companies missing `jobsApiUrl` | Can't sync their jobs | Prioritize discovery; use Perplexity to find ATS URLs; manual lookup for key portfolio companies |
| No job removal tracking | Can't calculate time-to-fill or detect freezes properly | Add `lastSeenAt` field; mark removed on each sync |
| No historical snapshots | Can't show trends beyond "when we first saw a listing" | Start snapshotting now; backfill what we can from `Created Time` data |
| Salary data only on ~30% of listings | Limited salary intelligence | Will improve naturally as more states require salary transparency |
| Seniority not explicitly tagged | Can't do seniority analysis without inference | Build title → seniority classifier (IC / Manager / Director / VP / C-suite) |
| Company stage data incomplete | Some companies missing stage | Enrich via Crunchbase API or Perplexity |
| No headcount data | Can't compare open roles to total headcount (% growth) | Consider LinkedIn company size as a proxy; or ask during onboarding |
| No funding amount data | Can't do runway/burn analysis | Enrich via Crunchbase or PitchBook; or collect during investor onboarding |

### What We'd Need to Build

**Priority order for engineering:**

**P0 — Must have for MVP launch:**
1. Weekly snapshot pipeline (cron + storage)
2. Job removal tracking (`lastSeenAt` + `removedAt` fields)
3. Investor-scoped dashboard API (filter by portfolio)
4. Authenticated investor accounts (Clerk — already in stack)
5. Dashboard UI (portfolio overview, company deep-dive, comparison)
6. Weekly digest email (cron + email service)

**P1 — Needed for Pro tier:**
7. Alert engine (spike, freeze, new department, executive hire)
8. Alert delivery (email + Slack webhook)
9. PDF export (one-page portfolio snapshot)
10. CSV export
11. Historical trend charts (4/8/12 week views)
12. Title → seniority classifier

**P2 — Needed for Enterprise tier:**
13. API access (REST endpoints for portfolio data + snapshots)
14. White-label PDF (custom logo/branding)
15. Competitor tracking (flag + compare)
16. Custom alert rules
17. Composite health score model

**P3 — Future / differentiator:**
18. Fundraise predictor model
19. Burn rate estimator
20. LP-facing aggregate reports
21. Candidate routing layer (connect talent partners to candidates)
22. Integration with portfolio management tools (Carta, Visible, etc.)

---

## Appendix: Data We Already Collect That Powers This

For reference, here is the precise data flowing through Cadre today that forms the foundation for every signal described above:

- **16,000+ job listings** with title, company, function, department, location, salary, posted date, raw ATS payload
- **1,343 companies** with name, stage, industry, HQ, ATS platform, investor links
- **201 investors** with name, bio, location, website, portfolio company links
- **10 analytics department segments:** Sales & GTM, Marketing, Engineering, AI & Research, Product, Design, Customer Success & Support, People & Talent, Finance & Legal, Operations & Admin
- **3 ATS connectors** (Greenhouse, Lever, Ashby) syncing daily
- **Function inference engine** mapping job titles to departments (16 regex rules)
- **Knowledge graph:** Jobs → Companies → Investors → Industries (all linked in Airtable)

The foundation is built. The investor product is about layering intelligence on top.

---

*This document is intended to be evaluated by Perplexity's model council. The goal: identify the highest-leverage features, the most compelling positioning, and the gaps in this thinking. What would make a talent partner at a top-50 VC firm say "I need this yesterday"?*
