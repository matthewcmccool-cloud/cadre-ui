# CLAUDE.md — Cadre

## Project Overview

Cadre is a relationship-based job discovery platform for VC-backed companies. It organizes jobs through a knowledge graph connecting Jobs ↔ Companies ↔ Investors ↔ Industries, letting users filter opportunities by investor portfolios, funding stages, and other criteria.

**Live site:** https://cadre-ui-psi.vercel.app
**Owner:** Matt (@matthewcmccool-cloud)

## Repositories

| Repo | Purpose | Deploy |
|------|---------|--------|
| `matthewcmccool-cloud/cadre-ui` | Next.js frontend + API routes | Vercel (auto-deploy on push to main) |
| `matthewcmccool-cloud/cadre-jobs-sync` | Job sync engine (ATS connectors) | Vercel serverless |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Airtable (primary data store)
- **Auth:** Clerk + Supabase
- **Hosting:** Vercel
- **Styling:** Tailwind CSS (dark theme)
- **AI enrichment:** Perplexity Sonar API
- **ATS connectors:** Greenhouse, Lever, Ashby

## File Structure — cadre-ui

```
app/
  page.tsx                    — Homepage with job table
  jobs/[id]/page.tsx          — Job detail page
  companies/[slug]/page.tsx   — Company page
  investors/[slug]/page.tsx   — Investor page
  industry/[slug]/page.tsx    — Industry page
  api/
    enrich-companies/route.ts
    backfill-functions/route.ts
    enrich-ats-urls/route.ts

components/
  Header.tsx                  — Site header with logo
  JobTable.tsx                — Main job listing table
  QueryBuilder.tsx            — Filter UI

lib/
  airtable.ts                 — Airtable API client, all data fetching
```

## File Structure — cadre-jobs-sync

```
api/
  sync.js                     — Main sync endpoint
  connectors/
    greenhouse.js
    lever.js
    ashby.js
```

## Airtable Schema (Key Tables)

**Companies** (~1,343 records): Name, Slug, Website, Logo URL, Stage, About, VCs (linked), Industry, ATS Platform, jobsApiUrl
**Investors** (~201 records): Name, Slug, Website, Logo URL, Portfolio Companies (linked)
**Job Listings** (~16,000+ records): Title, Company (linked), Location, Posted Date, Job URL, Job Description, Function, Industry, content (raw HTML from ATS)
**Industries**: Name, Slug

## Critical Rules

### Airtable Fetching
- ALWAYS use `response.text()` + `JSON.parse()` — NEVER use `response.json()` or `response.clone()`. The `Response.clone: Body has already been consumed` error has crashed the homepage multiple times.
- Use Table IDs, not table names, in API calls
- Airtable has a 5 requests/second rate limit — add delays in batch operations

### Data Integrity
- Always deduplicate by Job URL before creating records
- Company names must match exactly between Jobs and Companies tables
- Investor linking uses the VCs field on Companies, NOT through Jobs

### Deployment
- Vercel auto-deploys on push to main — never push broken code to main
- ALWAYS use feature branches → preview URLs → test → then merge
- The `stable-v3` tag is the last known-good deployment — use it as rollback target
- Vercel Hobby plan has 10-second function timeout — keep API routes fast

### Frontend
- Dark theme throughout — do not introduce light backgrounds
- Use `<Link>` components for all internal navigation (not `<a>` tags)
- Job descriptions use `dangerouslySetInnerHTML` for HTML from ATS feeds
- Pagination: 20 items per page default
- Investor/industry badges must be clickable and link to their respective pages

### Known Bug Patterns (DO NOT REPEAT)
- `Response.clone` crash: Caused by calling `.json()` on Airtable responses. Always use `.text()` + `JSON.parse()`
- Duplicate jobs on frontend: Airtable data is clean — check React key props and pagination overlap
- "Unknown" company: Check field mapping in JobTable.tsx — company is a linked record, not a string
- Industry badges not clickable: Must wrap in `<Link href={/industry/${slug}}>` component
- GitHub browser editor caching: Edits may appear committed but aren't — always verify via git log

### Process
- Start in Plan Mode for anything complex — get the plan right before implementation
- One change at a time when debugging — never change multiple things simultaneously
- Always test on preview URL before merging to main
- After every correction, update this CLAUDE.md so the mistake doesn't repeat

## Current State (as of Feb 2026)

### What's Working
- Job table with filtering (company, investor, industry, function, location)
- Company, investor, industry, and job detail pages
- ATS connectors (Greenhouse, Lever, Ashby)
- Daily job sync via GitHub Actions
- Dark UI with navigation chips
- ~1,343 companies, ~201 investors, ~16,000+ jobs

### Known Issues to Fix
- Homepage may be crashing (Response.clone error in airtable.ts) — check if stable-v3 rollback is still active
- Function backfill endpoint needs work (Perplexity response parsing)
- Many companies missing jobsApiUrl (limits sync coverage)
- Job expiration logic not implemented (stale jobs stay listed)

### Not Yet Built
- Email capture / newsletter
- Recruiter-facing features
- Featured/sponsored job placements
- User accounts beyond basic auth
