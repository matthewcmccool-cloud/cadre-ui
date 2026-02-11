# Cadre — Changelog

Track what ships, what breaks, what's next. Updated after every Claude Code session.

---

## February 11, 2026

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
