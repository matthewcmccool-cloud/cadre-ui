name: cadre-deploy-workflow
description: Use when deploying code, scripts, or configuration to CADRE infrastructure. Covers the GitHub → OpenClaw deployment pipeline, Telegram commands, and what NOT to do (no copy-paste via Telegram).

# CADRE Deploy Workflow

## The Rule

**Never copy-paste scripts via Telegram.** Always use the GitHub → OpenClaw pull workflow.

## Pipeline

1. Build scripts/code in Claude (chat or Claude Code)
2. Push to the appropriate GitHub repo
3. Message OpenClaw on Telegram to pull and deploy

## Repos

- **cadre-jobs-sync** — sync scripts, enrichment pipelines, cron jobs
- **cadre-ui** — Next.js frontend, deployed to Vercel

## OpenClaw (CadreClaw)

Runs 24/7 on Mac Mini M4. Handles:

- Data enrichment and sync operations
- Cron jobs (job syncing, fundraise scanning)
- Browser automation tasks
- Heartbeat monitoring (when configured)

Communication: via Telegram bot (@CadreClaw)

## Telegram Message Format for Deploys

Be explicit. Give OC a clear task:

```
TASK: [What to do]

1. Pull latest from [repo name]
2. [Specific steps to run]
3. [Verification step]

[Any notes or warnings]
```

### Example — Deploy a new cron script:

```
TASK: Set up fundraise scanner cron

1. Pull latest from cadre-jobs-sync
2. Install dependencies: npm install
3. Run the scanner once to test: node scripts/fundraise-scanner.js
4. Set up cron to run every 4 hours
5. Confirm first successful run

Note: Uses Haiku to keep costs down.
Service role key is already in .env
```

### Example — Deploy frontend update:

```
TASK: Deploy updated landing page

1. Pull latest from cadre-ui
2. Deploy to Vercel
3. Verify it's live at cadre.careers
4. Test on mobile viewport
```

## Vercel Deploys

Frontend changes go through Vercel's GitHub integration:

- Push to `main` → production deploy
- Push to feature branch → preview deploy

For frontend-only changes, you may not need OpenClaw at all — just push to GitHub and Vercel handles it.

## What OpenClaw Needs Terminal For

- Running data scripts and cron jobs
- Browser automation (Comet/Supabase dashboard tasks)
- File system operations on the Mac Mini
- Process management (starting/stopping services)

## Cost Awareness

- Use Haiku for high-volume operations (enrichment, scanning)
- Reserve Sonnet/Opus for complex reasoning tasks
- Perplexity API for web research (has rate limits — add delays)
- Monitor API spend, especially during bulk enrichment runs

## When Things Break

**If OpenClaw can't pull from GitHub:**

1. Check SSH keys are configured on Mac Mini
2. Verify repo exists and is accessible
3. Try `git clone` manually via Telegram to debug

**If a cron job fails:**

1. Ask OC for the error log
2. Fix in Claude → push to GitHub → tell OC to pull again
3. Never hot-fix directly on the Mac Mini
