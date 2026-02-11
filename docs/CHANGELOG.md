# Cadre — Changelog

Track what ships, what breaks, what's next. Updated after every Claude Code session.

---

## February 11, 2026

### Session: Prompt 4 — Homepage Redesign
- **Shipped:**
  - Rewrote `app/page.tsx` — complete homepage redesign for anonymous visitors.
  - Signed-in users redirect to `/discover` (will change to `/feed` after Prompt 10).
  - **LiveTicker** (`components/LiveTicker.tsx` — new) — horizontal scrolling bar, `h-8 bg-zinc-900`, CSS infinite scroll animation. Uses existing `animate-ticker` keyframes from globals.css. Entries passed as props with real stats from Airtable.
  - **Hero section** — `py-24`, centered. Headline: "Hiring intelligence for the venture ecosystem." Stats line uses real Airtable counts. Two CTAs: "Explore companies →" (`bg-purple-600`) links to `/discover`, "Get weekly intel →" (outlined) scrolls to `#newsletter`.
  - **This Week's Signal** card — `bg-zinc-900 rounded-xl p-8 border border-zinc-800`, hardcoded insight text for MVP. Links to `/fundraises`.
  - **Three entry cards** — `grid grid-cols-1 sm:grid-cols-3 gap-4`. Companies (links to `/discover?view=companies`), Investors (to `/discover?view=investors`), Fundraises (to `/fundraises`). Real counts from Airtable. Arrow icons with hover effect.
  - **NewsletterCTA** (`components/NewsletterCTA.tsx` — new) — "The Cadre Hiring Signal" with email input + subscribe button. Wired to existing `/api/subscribe` endpoint. Success/error states.
  - **Footer** (`components/Footer.tsx` — new) — `py-16 border-t border-zinc-800`. Brand line, nav links (Discover, Fundraises, Pricing, Newsletter), copyright with Terms/Privacy/Contact. Added to root `layout.tsx` so it appears on every page.
  - Updated `app/layout.tsx` — imported and rendered `<Footer />` below `{children}`.
  - JSON-LD structured data (WebSite schema) with real stats.
- **Broke:** Nothing. Zero TypeScript errors. Old homepage content (jobs/companies/investors tabs) will move to `/discover` in Prompt 5.
- **Next:** Prompt 5 (Discover Page with View Mode Switching)
- **Files changed:** `app/page.tsx`, `app/layout.tsx`, `components/LiveTicker.tsx` (new), `components/NewsletterCTA.tsx` (new), `components/Footer.tsx` (new)

---

### Session: Prompt 3 — Navigation Redesign
- **Shipped:**
  - Rewrote `Header.tsx` — complete navigation redesign per spec.
  - Desktop top bar (`h-14`, `bg-zinc-950`, `border-b border-zinc-800`):
    - Left: Cadre logo (link to `/`)
    - Center: Discover | Feed | Fundraises — `text-sm font-medium`, active gets `text-zinc-100` with purple-500 bottom indicator, inactive `text-zinc-400`
    - Feed nav item only renders when signed in (`useAuth`)
    - Right: Search button with magnifying glass icon + `⌘K` keyboard hint (wires to command palette in Prompt 12), Sign in button OR avatar dropdown
  - Avatar dropdown (signed in): My Feed, Settings, Sign out — `bg-zinc-900`, `border-zinc-800`, `shadow-lg`. Closes on outside click.
  - Sign in button (anonymous): `text-zinc-400 hover:text-zinc-100`, triggers `openSignIn()` modal from Prompt 1.
  - Mobile bottom tab bar (`md:hidden`, `fixed bottom-0`, `h-14`, `bg-zinc-950`, `border-t border-zinc-800`):
    - Three tabs: Discover, Feed (auth-only), Fundraises — icon above label, `text-xs`
    - Active tab: `text-purple-500`, inactive: `text-zinc-500`
    - Bottom spacer div to prevent content from hiding behind fixed bar
  - Sticky top bar (`sticky top-0 z-40`) — stays visible on scroll.
  - Removed old nav (Fundraises + Analytics tabs).
- **Broke:** Nothing. Zero TypeScript errors.
- **Next:** Prompt 4 (Homepage Redesign — hero, ticker, entry cards, newsletter CTA, footer)
- **Files changed:** `components/Header.tsx`

---

### Session: Prompt 2 — Supabase Setup + Data Models
- **Shipped:**
  - Added `createSupabaseAdmin()` to `lib/supabase.ts` — server-side client using `SUPABASE_SERVICE_ROLE_KEY` for full read/write access in API routes.
  - SQL migration `supabase/migrations/001_user_data_tables.sql` — creates `follows`, `alert_preferences`, `feed_events`, `company_daily_metrics` tables with proper indexes and constraints.
  - Follow API routes:
    - `GET /api/follows` — returns user's followed company IDs
    - `POST /api/follows` — follow a company (with source + portfolio_investor_id)
    - `DELETE /api/follows/[companyId]` — unfollow a company
    - `POST /api/follows/portfolio` — follow all companies for an investor (looks up portfolio via Airtable, bulk upserts follows)
  - `FollowsProvider` context (`hooks/useFollows.tsx`) — fetches follows on auth, exposes `isFollowing()`, `follow()`, `unfollow()`, `followPortfolio()` with optimistic updates. Reverts on API failure.
  - `SubscriptionProvider` stub (`hooks/useSubscription.tsx`) — hardcoded to `{ status: 'free', isPro: false }`. Exposes `useSubscription()` hook. Will wire to Stripe in Prompt 13.
  - Updated `Providers.tsx` — nests `AuthProvider > SubscriptionProvider > FollowsProvider` per ARCHITECTURE spec.
  - Updated Clerk webhook (`app/api/webhooks/clerk/route.ts`) — uses shared `createSupabaseAdmin()`, creates default `alert_preferences` row on user.created.
- **Broke:** Nothing. Zero new TypeScript errors.
- **Deferred:** Nothing — Prompt 2 is complete.
- **Next:** Prompt 3 (Navigation Redesign — top bar with Discover/Feed/Fundraises, mobile bottom tabs, avatar dropdown)
- **DB changes:** New tables: `follows`, `alert_preferences`, `feed_events`, `company_daily_metrics`. Run `supabase/migrations/001_user_data_tables.sql` in Supabase SQL Editor.
- **Files changed:** `lib/supabase.ts`, `components/Providers.tsx`, `hooks/useFollows.tsx` (new), `hooks/useSubscription.tsx` (new), `app/api/follows/route.ts` (new), `app/api/follows/[companyId]/route.ts` (new), `app/api/follows/portfolio/route.ts` (new), `app/api/webhooks/clerk/route.ts`, `supabase/migrations/001_user_data_tables.sql` (new)

---

### Session: Prompt 1 — Clerk Auth Setup
- **Shipped:**
  - Updated Clerk middleware (`middleware.ts`) — switched from public-route allow-list to protected-route pattern. `/feed(.*)` and `/settings(.*)` require auth; everything else is public.
  - Built `SignInModal` component (`components/SignInModal.tsx`) — modal overlay (not full-page redirect) with dynamic headline ("Follow [Company] and 1,300+ companies on Cadre"), Google OAuth button, email magic link flow, error handling, ESC-to-close.
  - Created `useAuth` hook + `AuthProvider` (`hooks/useAuth.tsx`) — wraps Clerk's `useUser`/`useClerk`, exposes `user`, `isSignedIn`, `isLoaded`, `openSignIn(context?)`, `signOut()`. Manages sign-in modal state so any component can trigger it with company context.
  - Created `Providers` wrapper (`components/Providers.tsx`) — client-side provider composition. Wired into root layout inside `ClerkProvider`.
  - Updated root layout (`app/layout.tsx`) — added `Providers` wrapper around `Header` + `{children}`.
  - Added `.env.local` (gitignored) with Clerk placeholder vars.
  - Added `.env.example` (committable) documenting all required env vars per ARCHITECTURE.md spec.
- **Broke:** Nothing. Zero new TypeScript errors. All pre-existing pages still function.
- **Deferred:** Nothing — Prompt 1 is complete.
- **Next:** Prompt 2 (Supabase Setup + Data Models — follows table, alert_preferences, feed_events, company_daily_metrics, FollowsProvider context, SubscriptionProvider stub)
- **Env changes:** `.env.local` created with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, Supabase vars, Airtable vars
- **Files changed:** `middleware.ts`, `app/layout.tsx`, `components/SignInModal.tsx` (new), `components/Providers.tsx` (new), `hooks/useAuth.tsx` (new), `.env.local` (new), `.env.example` (new)

---

### Session: PLG Rebuild Planning
- **Shipped:** 16 implementation prompts finalized, Supabase migration plan drafted
- **Status:** Pre-build. All spec docs committed to `/docs`
- **Next:** Begin Prompt 1 (Clerk Auth) and Prompt 2 (Supabase Setup)

---

<!--
## [DATE]

### Session: [DESCRIPTION]
- **Shipped:** What was built/deployed
- **Broke:** Any regressions, bugs, or issues introduced
- **Deferred:** What was planned but pushed
- **Next:** What the next session should pick up
- **Env changes:** Any new env vars, packages, or config added
- **DB changes:** Any schema migrations, new tables, altered columns

TEMPLATE — copy this block for each session
-->
