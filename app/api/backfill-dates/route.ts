import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const JOB_LISTINGS_TABLE_ID = 'tbl4HJr9bYCMOn2Ry';

const RATE_LIMIT_DELAY = 200;
const MAX_RUNTIME_MS = 8000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// Extract the best available date from Raw JSON per ATS platform
function extractBestDate(rawData: any, airtableCreatedTime: string): string | null {
  // Ashby: publishedAt is the real publish date
  if (rawData?.publishedAt) return rawData.publishedAt;

  // Lever: createdAt is a unix timestamp (milliseconds)
  if (rawData?.createdAt && typeof rawData.createdAt === 'number') {
    return new Date(rawData.createdAt).toISOString();
  }

  // Greenhouse: no created_at in public API — use Airtable record creation time
  // This is when we first discovered the job, within 24h of actual post date
  if (airtableCreatedTime) return airtableCreatedTime;

  return null;
}

async function fetchJobsNeedingDateFix(offset?: string) {
  const params = new URLSearchParams();
  // Fetch all jobs that have Raw JSON (we'll compare dates and fix bad ones)
  params.append('filterByFormula', "{Raw JSON} != BLANK()");
  params.append('pageSize', '100');
  params.append('fields[]', 'Raw JSON');
  params.append('fields[]', 'Date Posted');
  if (offset) params.append('offset', offset);

  return airtableFetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${JOB_LISTINGS_TABLE_ID}?${params.toString()}`
  );
}

async function batchUpdateJobs(updates: Array<{ id: string; fields: Record<string, unknown> }>) {
  return airtableFetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${JOB_LISTINGS_TABLE_ID}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ records: updates }),
    }
  );
}

export async function GET() {
  const startTime = Date.now();
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let alreadyGood = 0;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ success: false, error: 'Missing env vars' }, { status: 500 });
  }

  try {
    let offset: string | undefined;

    do {
      if (Date.now() - startTime > MAX_RUNTIME_MS) break;

      const data = await fetchJobsNeedingDateFix(offset);
      const records = data.records || [];
      offset = data.offset;

      if (records.length === 0) break;

      const updates: Array<{ id: string; fields: Record<string, unknown> }> = [];

      for (const record of records) {
        processed++;

        const rawJsonStr = record.fields?.['Raw JSON'];
        if (!rawJsonStr) { skipped++; continue; }

        let rawData: any;
        try { rawData = JSON.parse(rawJsonStr); } catch { skipped++; continue; }

        const currentDatePosted = record.fields?.['Date Posted'] || '';
        const airtableCreated = record.createdTime;

        // Determine if this is a Greenhouse job (no createdAt, no publishedAt)
        const isGreenhouse = !rawData.publishedAt && !(rawData.createdAt && typeof rawData.createdAt === 'number');

        if (isGreenhouse) {
          // For Greenhouse: if Date Posted matches updated_at, it's bad — replace with createdTime
          const atsUpdatedAt = rawData.updated_at || '';
          if (currentDatePosted === atsUpdatedAt && airtableCreated) {
            updates.push({ id: record.id, fields: { 'Date Posted': airtableCreated } });
          } else {
            alreadyGood++;
          }
        } else {
          // For Lever/Ashby: use the real ATS date
          const bestDate = extractBestDate(rawData, airtableCreated);
          if (bestDate && bestDate !== currentDatePosted) {
            updates.push({ id: record.id, fields: { 'Date Posted': bestDate } });
          } else {
            alreadyGood++;
          }
        }
      }

      for (let i = 0; i < updates.length; i += 10) {
        if (Date.now() - startTime > MAX_RUNTIME_MS) break;
        const batch = updates.slice(i, i + 10);
        try {
          await batchUpdateJobs(batch);
          updated += batch.length;
        } catch (err) {
          errors += batch.length;
          console.error('Batch update failed:', err);
        }
        await delay(RATE_LIMIT_DELAY);
      }

      await delay(RATE_LIMIT_DELAY);
    } while (offset && Date.now() - startTime < MAX_RUNTIME_MS);

    const runtime = Date.now() - startTime;
    const hasMore = !!offset;

    return NextResponse.json({
      success: true,
      processed,
      updated,
      alreadyGood,
      skipped,
      errors,
      hasMore,
      runtime: `${runtime}ms`,
      message: hasMore
        ? `Fixed ${updated} dates in ${runtime}ms. More records remaining — call again.`
        : `Done! Fixed ${updated} dates in ${runtime}ms.`,
    });
  } catch (error) {
    console.error('Backfill-dates error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processed, updated, skipped, errors,
      runtime: `${Date.now() - startTime}ms`,
    }, { status: 500 });
  }
}
