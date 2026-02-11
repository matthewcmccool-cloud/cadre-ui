# Cadre — Changelog

Track what ships, what breaks, what's next. Updated after every Claude Code session.

---

## February 11, 2026

### Session: Prompt 17 — Post-Build Audit & Consistency Pass

**1. Pricing consistency** (Monthly $99, Annual $79):
- `app/pricing/page.tsx`: $79→$99 monthly, $63→$79 annual (toggle labels and price calc)
- `app/pricing/layout.tsx`: Meta tag $79/month→$99/month
- `app/settings/billing/page.tsx`: 4 references updated ($79→$99 monthly, $63→$79 annual)

**2. Dead imports / unused components removed** (9 files):
- `components/ComingSoon.tsx` — removed (never imported)
- `components/EmailCapture.tsx` — removed (never imported)
- `components/FundingRoundsFeed.tsx` — removed (never imported)
- `components/HomepageTabs.tsx` — removed (never imported)
- `components/RecentRounds.tsx` — removed (never imported)
- `components/SearchBar.tsx` — removed (superseded by CommandPalette)
- `components/InvestorTicker.tsx` — removed (never imported)
- `components/ProGate.tsx` — removed (never imported)
- `components/QueryBuilder.tsx` — removed (never imported)
- `lib/filters.ts`: removed unused `parseFilters()` function
- `lib/supabase.ts`: removed unused `createClerkSupabaseClient()` and `createSupabaseClient()`

**3. Console.log cleanup** (7 statements removed):
- `app/api/backfill-functions/route.ts`: 2 console.log removed
- `app/api/stripe/webhook/route.ts`: 3 console.log removed
- `app/api/enrich-companies/route.ts`: 1 console.log removed
- `app/api/webhooks/clerk/route.ts`: 1 console.log removed
- Kept: 48 console.error + 3 console.warn (valid error logging)

**4. Environment variables** (`.env.example` — updated):
- Added missing `CLERK_WEBHOOK_SECRET` (was used in code but absent from template)
- Added missing `SYNC_SECRET` for cron auth
- Reorganized into Required vs Optional sections
- All 8 optional vars documented with feature context

**5. Mobile responsiveness**:
- `components/FundraisesPageContent.tsx`: Fixed hardcoded `ml-[42px]` → `sm:ml-[42px]` (prevents overflow on 375px)
- Verified: Header bottom tab bar, SearchFilters mobile button, ManageFollowsPanel full-width, Settings stacked tabs, Feed sidebar hidden, Compare desktop-only message — all correct

**6. Loading states** (4 new loading.tsx files):
- `app/feed/loading.tsx` — signal card + summary + card skeletons
- `app/companies/loading.tsx` — search + company chip skeletons
- `app/investors/loading.tsx` — search + investor chip skeletons
- `app/fundraises/loading.tsx` — filter pills + card skeletons

**7. Error handling**: Verified — global `error.tsx` catches page errors, `not-found.tsx` handles 404s, all client fetch calls use try/catch or .catch()

**8. TypeScript strict mode**: `npx tsc --noEmit` — zero errors before and after all changes

- **Broke:** Nothing. Zero TypeScript errors.
- **Files changed:** 20 files (9 removed, 4 new loading.tsx, 7 updated)

---

### Session: Prompt 16 — Polish Pass (Skeletons, Errors, Mobile, SEO)
- **Shipped:**
  - **Skeleton components** (`components/Skeletons.tsx` — new): CompanyChipSkeleton, FeedCardSkeleton, SparklineSkeleton, StatSkeleton
  - **Discover loading** (`app/discover/loading.tsx` — new): View switcher + search + company chip skeletons via Next.js Suspense
  - **Feed skeleton** (`components/FeedPageContent.tsx` — updated): Replaced spinner with 4 FeedCardSkeletons
  - **Error page** (`app/error.tsx` — updated): Added "Go to homepage" link alongside "Try again", improved copy to match spec
  - **Compare mobile** (`app/feed/compare/page.tsx` — updated): Shows "Comparison view is available on desktop" message on mobile
  - **SEO: Discover meta** (`app/discover/page.tsx` — updated): Title → "Discover 1,300+ VC-Backed Companies & Their Open Roles", added OpenGraph
  - **SEO: Fundraises meta** (`app/fundraises/page.tsx` — updated): Title → "Latest Venture Capital Fundraises & Who's Hiring"
  - **SEO: Pricing meta** (`app/pricing/layout.tsx` — new): "Cadre Pro — Hiring Activity Intelligence | $79/month"
  - **SEO: Sitemap** (`app/sitemap.ts` — updated): Added /discover, /pricing, updated /fundraises priority, replaced legacy tab URLs with /discover?view= URLs
  - **Terms placeholder** (`app/terms/page.tsx` — new): "Coming soon" placeholder
  - **Privacy placeholder** (`app/privacy/page.tsx` — new): "Coming soon" placeholder
- **Already existed (no changes needed):**
  - Footer with links, copyright, mailto — already in layout ✓
  - robots.txt with sitemap reference ✓
  - JSON-LD on all entity pages (company, investor, industry, job) ✓
  - JobRowSkeleton ✓
  - Header bottom tab bar for mobile ✓
  - SearchFilters mobile filter button + bottom sheet ✓
  - ManageFollowsPanel full-width on mobile ✓
  - Settings mobile stacked tabs ✓
  - Feed sidebar hidden on mobile ✓
  - Empty states on CompanyDirectory, JobTable, FeedPageContent ✓
- **Broke:** Nothing. Zero TypeScript errors.
- **Files changed:** `components/Skeletons.tsx` (new), `app/discover/loading.tsx` (new), `components/FeedPageContent.tsx`, `app/error.tsx`, `app/feed/compare/page.tsx`, `app/discover/page.tsx`, `app/fundraises/page.tsx`, `app/pricing/layout.tsx` (new), `app/sitemap.ts`, `app/terms/page.tsx` (new), `app/privacy/page.tsx` (new), `docs/CHANGELOG.md`

---

### Session: Prompt 15 — Settings Page
- **Shipped:**
  - **Settings layout** (`app/settings/layout.tsx` — new): Desktop left sidebar tabs + mobile stacked tabs, URL-routed (/settings, /settings/alerts, /settings/billing)
  - **Account tab** (`app/settings/page.tsx` — new): Email (read-only from Clerk), auth method detection (Google vs email), "Delete account" with confirmation modal → calls `DELETE /api/account`
  - **Alerts tab** (`app/settings/alerts/page.tsx` — new):
    - Toggle components (w-9 h-5, purple-600 on, zinc-700 off, CSS only)
    - Weekly digest: toggle (default on)
    - Daily digest: toggle with PRO badge, time picker dropdown (hourly, 9 AM default), disabled for free users with upgrade CTA
    - Real-time alerts: PRO badge, 4 sub-toggles (new roles, fundraises, surges, stalls), upgrade CTA for free users
    - Newsletter: toggle (default on)
    - Immediate save on toggle change (PUT /api/preferences), "Saved" fade confirmation
  - **Billing tab** (`app/settings/billing/page.tsx` — new): Conditionally renders based on subscription status: Free (upgrade CTA), Trialing (trial days remaining + manage billing), Active (manage billing + switch to annual), Canceled (reactivate link), Past Due (update payment). "Manage billing" opens Stripe Portal via `/api/billing/portal`.
  - **GET/PUT /api/preferences** (`app/api/preferences/route.ts` — new): Fetches/upserts alert_preferences in Supabase, maps snake_case DB columns to camelCase API fields
  - **DELETE /api/account** (`app/api/account/route.ts` — new): Deletes follows, alert_preferences, user record from Supabase, then deletes Clerk user
- **Broke:** Nothing. Zero TypeScript errors.
- **Files changed:** `app/settings/layout.tsx` (new), `app/settings/page.tsx` (new), `app/settings/alerts/page.tsx` (new), `app/settings/billing/page.tsx` (new), `app/api/preferences/route.ts` (new), `app/api/account/route.ts` (new), `docs/CHANGELOG.md`

---

### Session: Prompt 14 — Pro Feature Gating
- **Shipped:**
  - **ProGate** (`components/ProGate.tsx` — new): Reusable gating component — renders children if `isPro`, fallback otherwise
  - **BlurredPlaceholder** (`components/BlurredPlaceholder.tsx` — new): Blurred content with gradient overlay + CTA link to /pricing. Parses `→` in prompt string to separate text from CTA label.
  - **Company detail page**: HiringActivity now shows Pro-only content (90-day chart placeholder, function breakdown, MoM comparison) for Pro users; blurred upgrade prompt for free users with proper Link to /pricing
  - **Investor detail page**: Already gated (no changes needed)
  - **Discover page — Hiring Activity filter**: Added "Hiring Activity" FilterDropdown with 4 options (Surging, Ramping, Steady, Stalling). Free users see grayed-out options (`text-zinc-600 cursor-not-allowed`) with footer CTA: "Start free trial to unlock →". FilterDropdown gained `disabled` + `disabledFooter` props.
  - **Feed page — Compare tab**: Added "Compare" link in summary bar with PRO badge for free users. Created `/feed/compare` page with comparison table — Pro users see table, free users see fully blurred content with upgrade prompt.
  - **Feed page**: Investor context on cards + Pro teaser cards already gated (no changes needed)
  - **CSV Export**: Export CSV button shown only for Pro users in desktop filter bar. `GET /api/export/csv` checks subscription status server-side, returns 403 if not Pro.
- **Broke:** Nothing. Zero TypeScript errors.
- **Files changed:** `components/ProGate.tsx` (new), `components/BlurredPlaceholder.tsx` (new), `app/feed/compare/page.tsx` (new), `app/api/export/csv/route.ts` (new), `components/HiringActivity.tsx`, `components/FilterDropdown.tsx`, `components/SearchFilters.tsx`, `components/FeedPageContent.tsx`, `docs/CHANGELOG.md`

---

### Session: Prompt 13 — Pricing Page + Stripe Integration
- **Shipped:**
  - **Pricing page** (`app/pricing/page.tsx` — new):
    - Centered layout (max-w-lg), "Cadre Pro" title, subtitle
    - Billing toggle: Monthly $79 / Annual $63/mo with pill toggle (bg-zinc-800 selected)
    - CTA: "Start 14-day free trial →" (bg-purple-600), adapts to auth/subscription state
    - "What you get" section: 8 Pro features (✓ in text-emerald-400, text-zinc-300)
    - "Always free" section: 5 free features (✓ in text-zinc-500, text-zinc-400)
    - Footer: "Questions? Contact matt@cadre.careers"
  - **Stripe lib** (`lib/stripe.ts` — new): Shared Stripe client + price ID config
  - **POST /api/checkout** (`app/api/checkout/route.ts` — new): Creates Stripe Checkout session with 14-day trial, mode subscription, customer_email from Clerk, userId in metadata
  - **GET /api/billing/portal** (`app/api/billing/portal/route.ts` — new): Creates Stripe Customer Portal session, looks up customer by email
  - **POST /api/stripe/webhook** (`app/api/stripe/webhook/route.ts` — new): Verifies webhook signature, handles `customer.subscription.created/updated/deleted` and `invoice.payment_failed`. Updates `users` table in Supabase with plan, stripe_customer_id, stripe_subscription_id, trial_ends_at
  - **GET /api/subscription** (`app/api/subscription/route.ts` — new): Returns { status, isPro, isTrialing, trialDaysRemaining } from Supabase users table
  - **SubscriptionProvider** (`hooks/useSubscription.tsx` — updated): Now fetches real subscription status from `/api/subscription` on auth. Falls back to free state if not signed in or on error.
  - **stripe** npm package installed
- **Broke:** Nothing. Zero TypeScript errors.
- **Env vars needed:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID`, `NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID`
- **Supabase schema note:** `users` table needs columns: `stripe_customer_id`, `stripe_subscription_id`, `trial_ends_at`
- **Files changed:** `app/pricing/page.tsx` (new), `lib/stripe.ts` (new), `app/api/checkout/route.ts` (new), `app/api/billing/portal/route.ts` (new), `app/api/stripe/webhook/route.ts` (new), `app/api/subscription/route.ts` (new), `hooks/useSubscription.tsx`, `docs/CHANGELOG.md`

---

### Session: Prompt 12 — Command Palette Search
- **Shipped:**
  - **CommandPalette** (`components/CommandPalette.tsx` — new):
    - Full-screen overlay (`bg-black/60`) with centered modal (`bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg`)
    - Animation: fade-in backdrop + scale-up modal, 150ms
    - Search input: magnifying glass icon + "Search companies, investors, roles..." placeholder, auto-focus, `bg-transparent` no border
    - Results grouped by type with section headers (`text-xs text-zinc-500 uppercase tracking-wide`)
    - Companies: logo 20px + name + industry + stage, max 3
    - Investors: name, max 3
    - Jobs: title + company name, max 3
    - Keyboard navigation: ↑↓ to highlight (`bg-zinc-800`), Enter to navigate, ESC to close
    - Mouse hover highlights rows, click navigates to entity page
    - No results: "No results for '[query]'" centered
    - Footer: "ESC to close" right-aligned (`text-xs text-zinc-600`)
    - Debounced search (200ms) with loading spinner
  - **`searchAll()`** added to `lib/airtable.ts` — searches companies by name, investors by Firm Name, jobs by Job Title via Airtable `SEARCH(LOWER(...))` formula. Resolves industry names for companies and company names for jobs. Sorts by relevance (prefix match first). Returns max 3 per type.
  - **`GET /api/search?q=`** (`app/api/search/route.ts` — new) — public search endpoint
  - **Header wired up**: ⌘K (Mac) / Ctrl+K (Windows) global shortcut, desktop search button, mobile search icon all open CommandPalette. Removed TODO comments.
  - **CSS animations**: `animate-fade-in`, `animate-scale-in` in `globals.css`
- **Broke:** Nothing. Zero TypeScript errors.
- **Files changed:** `components/CommandPalette.tsx` (new), `app/api/search/route.ts` (new), `lib/airtable.ts`, `components/Header.tsx`, `app/globals.css`, `docs/CHANGELOG.md`

---

### Session: Prompt 11 — Manage Follows Panel + Toast System
- **Shipped:**
  - **ToastProvider + useToast hook** (`hooks/useToast.tsx` — new):
    - Fixed bottom-center (`bottom-6 z-50`), `bg-zinc-800 border border-zinc-700 rounded-lg`
    - Success (✓ emerald-400) auto-dismisses at 3s, Error (✕ red-400) at 5s
    - Slide-up + fade-in animation on appear, slide-down + fade-out on dismiss
    - Multiple toasts stack vertically with `gap-2`, newest on bottom
    - API: `const { toast } = useToast(); toast({ type: 'success', message: '...' })`
  - **ManageFollowsPanel** (`components/ManageFollowsPanel.tsx` — new):
    - Slide-over from right (`w-96` desktop, full-width mobile)
    - Animation: `slideInRight 0.2s ease-out` via CSS keyframes
    - Dimmed backdrop (`bg-black/40`), click/ESC/✕ to close
    - Header: "Following (N)" with live count
    - Search input filters both followed and all companies
    - Followed list: `★ purple-500` star, logo, name, stage — tap to unfollow (strikethrough → animate out in 500ms)
    - Suggested section: 3-5 companies from same industries as follows, not yet followed, sorted by job count — tap to follow (star fills, moves to followed)
    - Uses global toasts for all follow/unfollow feedback
  - **Wired ToastProvider** into `Providers.tsx` (outermost after FollowsProvider)
  - **Updated FollowButton** — uses global `useToast()` for success/error messages
  - **Updated FollowPortfolioButton** — removed local toast state, uses global `useToast()`, simplified JSX (removed wrapper divs + inline toast popups)
  - **Updated FeedPageContent** — "Manage" link now opens ManageFollowsPanel instead of linking to `/feed`
  - **CSS animations** added to `globals.css`: `animate-toast-in` (slide-up), `animate-slide-in-right` (panel)
- **Broke:** Nothing. Zero TypeScript errors.
- **Files changed:** `hooks/useToast.tsx` (new), `components/ManageFollowsPanel.tsx` (new), `components/Providers.tsx`, `components/FollowButton.tsx`, `components/FollowPortfolioButton.tsx`, `components/FeedPageContent.tsx`, `app/globals.css`, `docs/CHANGELOG.md`

---

### Session: Prompt 10 — My Feed
- **Shipped:**
  - **Feed page** (`app/feed/page.tsx` — new) — protected by middleware (auth required), server component fetches stats for ticker
  - **FeedPageContent** (`components/FeedPageContent.tsx` — new) — full client component with:
    - **LiveTicker** at top (reuses homepage ticker with platform stats)
    - **This Week's Signal** card — dismissable with X, same content as homepage
    - **Summary bar**: "Following N companies · N open roles · N new this week" with bold numbers
    - **Activity feed**: Company cards with logo, name, latest job posting, expand/collapse for multiple roles, Pro-only investor context line
    - **Pro Teaser cards**: inserted every ~10 cards for free users ("🔒 N of your companies are surging → Start free trial")
    - **Right sidebar** (desktop only, `w-72`): Quick Stats (following/roles/new), Top Functions (horizontal mini bars with %), Recently Funded companies
    - **Empty state**: "Not following any companies" with link to Discover
    - **Load more** pagination (20 per page)
    - **"Manage" link** in summary bar (top right, `text-xs text-zinc-400`)
    - Mobile: full-width cards, sidebar hidden
  - **`GET /api/feed`** (`app/api/feed/route.ts` — new) — auth-protected, fetches user's follows from Supabase, enriches with Airtable company + job data via `getFeedDataForCompanyIds()`
  - **`getFeedDataForCompanyIds()`** added to `lib/airtable.ts` — takes array of company IDs, returns enriched companies with recent jobs, investors, industry, stage, plus aggregated stats (total roles, new this week, top functions)
  - **Homepage redirect** updated: signed-in users now redirect to `/feed` instead of `/discover`
- **Broke:** Nothing. Zero TypeScript errors.
- **Note:** feed_events Supabase table exists but isn't populated yet. MVP feed uses Airtable company + jobs data directly. When OpenClaw populates feed_events, the API route can be enhanced.
- **Next:** Prompt 11 (Manage Follows Panel + Toast System)
- **Files changed:** `app/feed/page.tsx` (new), `components/FeedPageContent.tsx` (new), `app/api/feed/route.ts` (new), `lib/airtable.ts`, `app/page.tsx`, `docs/CHANGELOG.md`

---

### Session: Prompt 9 — Onboarding Flow (Playlist)
- **Shipped:**
  - **OnboardingModal** (`components/OnboardingModal.tsx` — new) — full-screen overlay that appears after sign-up:
    - Header: "Pick companies to follow" + subtitle
    - Search input for companies (same styling as Discover)
    - "Already Following" section showing the company that triggered sign-up (auto-followed)
    - "Suggested for You" section: 6-9 companies from same industry, sorted by job count
    - "Popular on Cadre" section: top 9 companies by job count
    - "Quick Follow" section: top 3 investor portfolio rows (`bg-zinc-800 rounded-lg p-3`), tap to follow entire portfolio
    - Company chips: tappable with `scale-[1.02]` + purple fill on select, 150ms transition
    - Continue button fixed at bottom: "Continue to your feed (N) →", disabled (opacity-50) until 3+ followed
    - Minimum warning: "Follow at least 3 companies to get started" (`text-xs text-yellow-400`)
    - Close via X or ESC: navigates to `/feed` (if 1+ followed) or `/discover` (if 0 followed)
  - **`getOnboardingData()`** added to `lib/airtable.ts` — returns popular companies (by job count), top 3 investors (by portfolio size), and all companies for search
  - **`GET /api/onboarding`** (`app/api/onboarding/route.ts` — new) — serves onboarding data with 60-minute ISR
  - **Auth flow wired up:**
    - FollowButton now stores pending company ID in localStorage before triggering sign-in
    - SignInModal redirects to `/?onboarding=true` after Google OAuth and email magic link
    - Sign-up page redirects to `/?onboarding=true` via `afterSignUpUrl` prop
    - AuthProvider detects `?onboarding=true` URL param and renders OnboardingModal
    - Pending follow company auto-followed and shown in "Already Following" section
    - URL param cleaned after detection (no stale `?onboarding=true` in address bar)
  - Root layout wrapped in `<Suspense>` for `useSearchParams` compatibility
  - Sign-up page background changed from `bg-gray-50` to `bg-zinc-950` (dark theme consistency)
- **Broke:** Nothing. Zero TypeScript errors.
- **Files changed:** `components/OnboardingModal.tsx` (new), `app/api/onboarding/route.ts` (new), `lib/airtable.ts`, `hooks/useAuth.tsx`, `components/FollowButton.tsx`, `components/SignInModal.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `app/layout.tsx`, `docs/CHANGELOG.md`

---

### Session: Prompt 8 — Fundraises Page
- **Shipped:**
  - Replaced "Coming Soon" placeholder with full Fundraises page (`app/fundraises/page.tsx`).
  - **FundraisesPageContent** (`components/FundraisesPageContent.tsx` — new) — client component with:
    - Page title "Fundraises" + subtitle
    - Time filter pills (All / This Week / This Month) — same pill toggle style as Discover `ViewSwitcher`
    - Industry dropdown filter populated from Airtable industries
    - Result count ("N fundraises")
    - Fundraise cards: `bg-zinc-900 rounded-lg p-5 border border-zinc-800`, left accent `border-l-2 border-l-emerald-500/30`, company logo (favicon), company name + "raised $X Stage", investor links (lead + co-investors), industry badge, "Now hiring N roles →" link, `FollowButton` on right
    - "Load more" pagination (20 per page)
    - Empty state with link to clear filters
  - **`getFundraises()`** added to `lib/airtable.ts` — synthesizes fundraise entries from Companies table (Stage + Total Raised + VCs fields). Filters for companies with recognizable funding stages (Seed, Series A-D, Growth, Pre-Seed). Sorts by stage (later stages first). Ready to swap to dedicated Fundraises table when available.
  - Server page fetches fundraises + filter options in parallel. ISR at 60 minutes.
- **Broke:** Nothing. Zero TypeScript errors.
- **Note:** No dedicated Fundraises table exists yet in Airtable. Data is synthesized from Companies table fields. When a Fundraises table is added, only `getFundraises()` in `airtable.ts` needs updating.
- **Next:** Prompt 9 (Onboarding Flow)
- **Files changed:** `app/fundraises/page.tsx`, `components/FundraisesPageContent.tsx` (new), `lib/airtable.ts`

---

### Session: Prompt 7 — Investor Detail Page Redesign
- **Shipped:**
  - Rewrote `InvestorPageContent.tsx` — complete investor page redesign with new layout matching company page style.
  - **FollowPortfolioButton** (`components/FollowPortfolioButton.tsx` — new) — "Follow Portfolio (N companies)" button with three states: anonymous (triggers sign-in modal), not following (outlined), all followed (filled `bg-purple-600`, hover shows "Unfollow Portfolio"). Calls `followPortfolio()` from `useFollows`. Toast notifications on success/failure.
  - **Top section** — investor name + `FollowPortfolioButton` side-by-side, subtitle "Venture Capital · [Location]", website/LinkedIn links, bio.
  - **Portfolio Overview** — three stat cards (`bg-zinc-900 rounded-lg border border-zinc-800`): portfolio companies, open roles, new roles this week.
  - **Portfolio Companies** — chip grid sorted by role count descending. Followed companies get subtle purple left border (`border-l-2 border-l-purple-500`). Collapsible to ~2 rows with "Show all N companies" expand button.
  - **Portfolio Hiring Activity** (Pro-gated) — Pro users see placeholder "coming soon" card. Free users see blurred skeleton cards behind `backdrop-blur` overlay with "Unlock portfolio hiring intelligence → Start free trial" CTA linking to `/pricing`.
  - **Open Roles** — searchable role list with company favicon, title, company name, location, department. Consistent style with company page role list.
  - Updated `app/investors/[slug]/page.tsx` — background `bg-zinc-950`, breadcrumbs updated to Discover/Investors path with zinc design tokens.
- **Broke:** Nothing. Zero TypeScript errors.
- **Next:** Prompt 8 (Fundraises Page)
- **Files changed:** `components/InvestorPageContent.tsx`, `components/FollowPortfolioButton.tsx` (new), `app/investors/[slug]/page.tsx`

---

### Session: Prompt 6 — Company Detail Page Redesign
- **Shipped:**
  - Rewrote `CompanyPageContent.tsx` — complete company page redesign with new layout.
  - **Breadcrumbs** — `Discover / Companies / {name}` with link navigation.
  - **Top section** — company logo (favicon), name + `FollowButton` side-by-side, description, metadata chips (`rounded-full`, industry links to `/industry/` page), external links (Website/LinkedIn/X), investor badges linking to `/investors/`.
  - **FollowButton** (`components/FollowButton.tsx` — new) — reusable follow/unfollow button with three states: anonymous (triggers sign-in modal), not following (outlined `border-zinc-700`), following (filled `bg-purple-600`, hover shows "Unfollow" in `bg-zinc-600`). Uses `useAuth()` and `useFollows()` hooks.
  - **HiringActivity** (`components/HiringActivity.tsx` — new) — hiring stats section with total roles + new this week counts. SVG sparkline (120x24px, `stroke-purple-500` with gradient fill). Pro gate: 90-day chart blurred behind `backdrop-blur-md` overlay with "Start free trial" CTA when `!isPro`. Uses `useSubscription()`.
  - **Open Roles** — searchable role list (filter input appears when >5 roles). Each role links to `/jobs/[id]`, shows title, location, department, relative posted date, chevron.
  - **Similar Companies** — chip grid of related companies with favicons, name, role count. Appears at bottom when available.
  - **`getSimilarCompanies()`** added to `lib/airtable.ts` — queries companies with same industry, scores by shared investors, returns top N matches. Gracefully catches errors.
  - Updated `app/companies/[slug]/page.tsx` — parallel fetch of jobs + similarCompanies via `Promise.all`. Passes `similarCompanies` prop to `CompanyPageContent`. Background changed from `bg-[#0e0e0f]` to `bg-zinc-950` for consistency.
- **Broke:** Nothing. Zero TypeScript errors.
- **Next:** Prompt 7 (Investor Page Redesign)
- **Files changed:** `components/CompanyPageContent.tsx`, `components/FollowButton.tsx` (new), `components/HiringActivity.tsx` (new), `lib/airtable.ts`, `app/companies/[slug]/page.tsx`

---

### Session: Prompt 5 — Discover Page with View Mode Switching
- **Shipped:**
  - Created `/discover` route (`app/discover/page.tsx`) — unified browsing page with three view modes: Companies (default), Jobs, Investors.
  - **ViewSwitcher** (`components/ViewSwitcher.tsx` — new) — pill-style toggle bar (`bg-zinc-900 rounded-lg`), active pill `bg-zinc-800 text-zinc-100`, inactive `text-zinc-500`. Each pill shows count. URL-driven via `?view=` param.
  - Discover page fetches view-specific data in parallel via `Promise.all` — only loads data for the active view. ISR at 60 minutes.
  - Companies view renders existing `CompanyDirectory` component (chip grid, search, stage/investor/industry filters).
  - Jobs view renders existing `SearchFilters` + `JobTable` + `Pagination` (full filter bar, department/location/industry/work mode/investor/posted).
  - Investors view renders existing `InvestorDirectory` (chip grid, search, industry/stage filters, sort).
  - **Updated `Pagination.tsx`** — uses `usePathname()` instead of hardcoded `/`. Now works on any route (`/discover`, `/`, future routes).
  - **Updated `SearchFilters.tsx`** — uses `usePathname()` for all `router.push()` calls and `handleClearAll()`. No longer hardcoded to `/`.
  - **Redirects** — `next.config.js` redirects `/?tab=companies` → `/discover?view=companies` and `/?tab=investors` → `/discover?view=investors` (permanent 301).
  - Homepage (`/`) already redirects signed-in users to `/discover` (from Prompt 4).
- **Broke:** Nothing. Zero TypeScript errors. All existing components reused without modification to their internal logic.
- **Next:** Prompt 6 (Company Page Redesign)
- **Files changed:** `app/discover/page.tsx` (new), `components/ViewSwitcher.tsx` (new), `components/Pagination.tsx`, `components/SearchFilters.tsx`, `next.config.js`

---

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
