import { NextResponse } from 'next/server';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const FUNCTION_TABLE_ID = 'tbl94EXkSIEmhqyYy';
const JOB_LISTINGS_TABLE_ID = 'tbl4HJr9bYCMOn2Ry';

// Airtable rate limit: 5 req/sec — 200ms between requests is safe
const RATE_LIMIT_DELAY = 200;
const MAX_RUNTIME_MS = 8000; // Stay under Vercel timeout (10s hobby, 60s pro)

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ── Classification rules ─────────────────────────────────────────────
// Categories MUST match the Function table in Airtable exactly.
// These are granular function names — the 10-segment analytics rollup
// (Sales & GTM, Marketing, Engineering, etc.) lives in Airtable's
// Department column on the Function table.
// Order matters — first match wins, so put more specific patterns first.
function classifyFunction(title: string): string {
  const t = title.toLowerCase();
  const rules: [RegExp, string][] = [
    // Specific roles first (before broad "engineer" or "sales" catch-alls)
    [/\bsolutions? engineer|sales engineer|pre.?sales/i, 'Solutions Engineering'],
    [/\bdevrel|developer relation|developer advocate|developer evangel/i, 'Developer Relations'],
    [/\brevenue op|rev\s?ops/i, 'Revenue Operations'],
    [/\bbusiness develop|partnerships?|partner manager|bd |strategic allianc/i, 'BD & Partnerships'],
    [/\bcustomer success|customer support|customer experience|support engineer|client success/i, 'Customer Success'],
    [/\bproduct design|ux|ui designer|graphic design|brand design|creative director|ux research/i, 'Product Design / UX'],
    [/\bproduct manag|head of product|vp.*product|director.*product|product lead|product owner|product strateg/i, 'Product Management'],
    [/\bdata scien|machine learn|\bml\b|\bai\b|research scien|deep learn|nlp|computer vision|llm/i, 'AI & Research'],
    // Broad catch-alls
    [/\bengineer|software|developer|sre|devops|infrastructure|platform|full.?stack|backend|frontend|ios\b|android|mobile dev|architect/i, 'Engineering'],
    [/\bsales|account exec|sdr\b|bdr\b|account manag|closing|quota/i, 'Sales'],
    [/\bmarketing|growth|demand gen|content market|seo\b|brand manag|comms\b|communications|social media|pr manager/i, 'Marketing'],
    [/\brecruit|talent|people ops|human resource|\bhr\b|people partner|head of people/i, 'People'],
    [/\bfinance|account(ant|ing)|controller|tax\b|treasury|financial|fp&a|cfo/i, 'Finance & Accounting'],
    [/\boperation|chief of staff|program manag|project manag|business ops|strategy|bizops/i, 'Business Operations'],
    [/\blegal|counsel|compliance|regulatory|policy/i, 'Legal'],
    [/\bsecurity|infosec|cyber|penetration/i, 'Engineering'],
    [/\bdata analy|business intel|analytics/i, 'AI & Research'],
  ];

  for (const [pattern, label] of rules) {
    if (pattern.test(t)) return label;
  }
  return 'Other';
}

// ── Airtable helpers ─────────────────────────────────────────────────
// ALWAYS use response.text() + JSON.parse() — never response.json()
// (avoids Response.clone: Body already consumed crash)

async function airtableFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Airtable ${response.status}: ${text.substring(0, 500)}`);
  }
  return JSON.parse(text);
}

// Load the Function table once → build name→recordId map
async function loadFunctionMap(): Promise<Map<string, string>> {
  const data = await airtableFetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${FUNCTION_TABLE_ID}`
  );
  const map = new Map<string, string>();
  for (const record of data.records) {
    const name = record.fields?.Function;
    if (name) {
      map.set(name, record.id);
    }
  }
  return map;
}

// Fetch one page of unclassified jobs (100 max per page)
async function fetchUnclassifiedJobs(offset?: string) {
  const params = new URLSearchParams();
  params.append('filterByFormula', `AND({Function} = BLANK(), {Title} != '')`);
  params.append('pageSize', '100');
  params.append('fields[]', 'Title');
  if (offset) params.append('offset', offset);

  return airtableFetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${JOB_LISTINGS_TABLE_ID}?${params.toString()}`
  );
}

// Batch update up to 10 records at once (Airtable's max per PATCH)
async function batchUpdateJobs(updates: Array<{ id: string; fields: Record<string, unknown> }>) {
  return airtableFetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${JOB_LISTINGS_TABLE_ID}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ records: updates }),
    }
  );
}

// ── Main endpoint ────────────────────────────────────────────────────
export async function GET() {
  const startTime = Date.now();
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let pagesProcessed = 0;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ success: false, error: 'Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID' }, { status: 500 });
  }

  try {
    // Step 1: Load Function table (name → record ID)
    const functionMap = await loadFunctionMap();

    let offset: string | undefined;

    // Step 2: Page through unclassified jobs until time runs out
    do {
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        break;
      }

      const data = await fetchUnclassifiedJobs(offset);
      const records = data.records || [];
      offset = data.offset; // undefined if no more pages
      pagesProcessed++;

      if (records.length === 0) break;

      // Step 3: Classify all records locally (instant)
      const updates: Array<{ id: string; fields: Record<string, unknown> }> = [];

      for (const record of records) {
        const title = record.fields?.Title;
        if (!title) {
          skipped++;
          continue;
        }

        processed++;
        const category = classifyFunction(title);
        const functionRecordId = functionMap.get(category);

        if (functionRecordId) {
          updates.push({
            id: record.id,
            fields: { Function: [functionRecordId] },
          });
        } else {
          // Category not in Function table — skip (don't write bad data)
          skipped++;
          console.warn(`No Function record for category "${category}" (title: "${title}")`);
        }
      }

      // Step 4: Batch write in chunks of 10 (Airtable max)
      for (let i = 0; i < updates.length; i += 10) {
        if (Date.now() - startTime > MAX_RUNTIME_MS) break;

        const batch = updates.slice(i, i + 10);
        try {
          await batchUpdateJobs(batch);
          updated += batch.length;
        } catch (err) {
          errors += batch.length;
          console.error(`Batch update failed:`, err);
        }
        await delay(RATE_LIMIT_DELAY);
      }

      await delay(RATE_LIMIT_DELAY);
    } while (offset && Date.now() - startTime < MAX_RUNTIME_MS);

    const runtime = Date.now() - startTime;
    const remaining = offset ? true : false;

    return NextResponse.json({
      success: true,
      processed,
      updated,
      skipped,
      errors,
      pagesProcessed,
      hasMore: remaining,
      runtime: `${runtime}ms`,
      message: remaining
        ? `Processed ${updated} jobs in ${runtime}ms. More jobs remaining — call again to continue.`
        : `Done! Classified ${updated} jobs in ${runtime}ms. No more unclassified jobs.`,
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processed,
      updated,
      skipped,
      errors,
      runtime: `${Date.now() - startTime}ms`,
    }, { status: 500 });
  }
}
