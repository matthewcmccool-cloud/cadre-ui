# Cadre Launch Checklist

Production deployment guide for cadre-ui. Follow each section in order.

---

## 1. Environment Variables

All variables below must be set in **Vercel → Project → Settings → Environment Variables** and in your local `.env.local`. See `.env.example` for the template.

### Required

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk backend key | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Svix signing secret for Clerk webhooks | Clerk Dashboard → Webhooks |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in page path (set to `/sign-in`) | Hardcode |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up page path (set to `/sign-up`) | Hardcode |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | Supabase Dashboard → Settings → API |
| `AIRTABLE_API_KEY` | Airtable personal access token | airtable.com → Account → API |
| `AIRTABLE_BASE_ID` | Airtable base ID (starts with `app`) | Airtable API docs for your base |

### Optional (feature-specific)

| Variable | Feature | Description |
|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | Billing | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Billing | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` | Billing | Stripe Price ID for monthly plan |
| `NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID` | Billing | Stripe Price ID for annual plan |
| `LOOPS_API_KEY` | Email | Loops.so API key |
| `PERPLEXITY_API_KEY` | AI enrichment | Perplexity Sonar API key |
| `OPENCLAW_API_KEY` | Data pipeline | Shared secret for OpenClaw ingestion API |
| `SYNC_SECRET` | Cron jobs | Auth token for scheduled sync endpoints |

---

## 2. Supabase Setup

### Create project
1. Go to supabase.com → New Project
2. Region: `us-east-1` (matches Vercel default)
3. Save the database password securely

### Run migrations
Execute in order in the **Supabase SQL Editor**:

```
supabase/migrations/001_user_data_tables.sql   — follows, alert_preferences, feed_events, company_daily_metrics
supabase/migrations/002_rls_policies.sql        — RLS policies for all user data tables
```

When ready for the Airtable → Supabase migration (core data), also run the CREATE TABLE statements from `docs/Cadre_Airtable_Supabase_Migration.md` Step 1.

### Verify
- All tables visible in Table Editor
- RLS enabled on: `follows`, `alert_preferences`, `feed_events`, `company_daily_metrics`
- Connection pooling enabled (Settings → Database → Connection Pooling)

---

## 3. Stripe Setup

1. Create a Stripe account at stripe.com
2. Create a **Product** called "Cadre Pro"
3. Create two **Prices** on the product:
   - Monthly: $99/month, recurring
   - Annual: $948/year ($79/month), recurring
4. Copy the Price IDs into `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` and `NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID`
5. Create a **Webhook** endpoint:
   - URL: `https://cadre-ui-psi.vercel.app/api/stripe/webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`
6. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

---

## 4. Clerk Setup

1. Create a Clerk application at clerk.com
2. Enable OAuth providers: **Google** (recommended), optionally GitHub
3. Set allowed redirect URLs:
   - `https://cadre-ui-psi.vercel.app`
   - `http://localhost:3000` (for local dev)
4. Create a **Webhook** endpoint:
   - URL: `https://cadre-ui-psi.vercel.app/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
5. Copy the webhook signing secret into `CLERK_WEBHOOK_SECRET`
6. Copy publishable key and secret key into env vars

---

## 5. Loops Setup

1. Create a Loops.so account
2. Create the following **tags**:
   - `newsletter` — users subscribed to the newsletter
   - `user_no_newsletter` — signed-up users who haven't subscribed
   - `pro` — users with active Cadre Pro subscription
3. Create the following **transactional events**:
   - `welcome` — triggered on signup (data: `firstName`)
   - `trial_started` — triggered when trial begins
   - `trial_ending` — triggered 3 days before trial expires
   - `trial_expired` — triggered when trial ends
   - `subscription_confirmed` — triggered when payment succeeds
4. Create email templates for each event in the Loops editor
5. Copy API key into `LOOPS_API_KEY`

---

## 6. Vercel Deployment

### Build settings
- **Framework:** Next.js
- **Build command:** `next build`
- **Output directory:** `.next`
- **Node.js version:** 18.x or 20.x

### Environment variables
Add all variables from Section 1 (Required + whichever Optional features are enabled).

### Deploy
```bash
git push origin main    # triggers auto-deploy
```

### Custom domain (optional)
1. Add domain in Vercel → Project → Settings → Domains
2. Update DNS CNAME to `cname.vercel-dns.com`
3. Update `BASE_URL` references in sitemap.ts, robots.ts, and metadata

---

## 7. Post-Deploy Smoke Tests

After deploying, verify each URL manually:

| URL | Expected |
|-----|----------|
| `/` | Homepage with stats, ticker, newsletter CTA |
| `/discover` | Company directory with search + filters |
| `/discover?view=jobs` | Job listings with pagination |
| `/discover?view=investors` | Investor directory |
| `/companies/anthropic` | Company detail page with jobs |
| `/investors/sequoia` | Investor page with portfolio |
| `/fundraises` | Fundraises list with filters |
| `/pricing` | Pro pricing page with checkout |
| `/sign-up` | Clerk sign-up flow |
| `/sign-in` | Clerk sign-in flow |
| `/feed` | Personalized feed (requires auth) |
| `/settings` | Account settings (requires auth) |
| `/nonexistent-page` | Custom 404 page |
| `/sitemap.xml` | XML sitemap with all entity URLs |
| `/robots.txt` | Robots rules (allows AI crawlers, blocks /api/) |

### API endpoint checks
```bash
# Search
curl -s https://cadre-ui-psi.vercel.app/api/search?q=anthropic | jq .

# Ingest auth (should return 401)
curl -s -X POST https://cadre-ui-psi.vercel.app/api/ingest/companies \
  -H "Content-Type: application/json" \
  -d '{"companies":[]}' | jq .
```

---

## 8. Verification Checklist

- [ ] `next build` completes with zero TypeScript errors
- [ ] All API routes return appropriate status codes
- [ ] Every page has: meta title, meta description, canonical URL
- [ ] Sitemap generates and includes all entity pages
- [ ] robots.txt blocks `/api/` and `/settings`, allows AI crawlers
- [ ] All Supabase tables have RLS policies enabled
- [ ] Error boundary catches rendering errors (`app/global-error.tsx`)
- [ ] 404 page renders correctly (`app/not-found.tsx`)
- [ ] Loading skeletons on every data-fetching page
- [ ] No hardcoded API keys or secrets in committed code
- [ ] CSP headers configured in `next.config.js`
- [ ] Rate limiting on `/api/subscribe` and `/api/follows`
- [ ] Images use `next/image` (no raw `<img>` tags)
- [ ] PWA manifest at `/manifest.webmanifest`
- [ ] Analytics events firing (check Plausible dashboard)
