import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SYNC_SECRET = process.env.SYNC_SECRET; // optional auth for cron calls

const COMPANIES_TABLE = 'Companies';
const JOBS_TABLE_ID = 'tbl4HJr9bYCMOn2Ry';
const RATE_LIMIT_DELAY = 200;
const MAX_RUNTIME_MS = 8000;
const BATCH_SIZE = 5; // companies per invocation

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Airtable helpers ─────────────────────────────────────────────────

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

// ── ATS platform detection ───────────────────────────────────────────

function detectPlatform(url: string): 'greenhouse' | 'lever' | 'ashby' | 'unknown' {
  if (url.includes('greenhouse.io')) return 'greenhouse';
  if (url.includes('lever.co')) return 'lever';
  if (url.includes('ashbyhq.com')) return 'ashby';
  return 'unknown';
}

// ── Parse jobs from ATS response ─────────────────────────────────────

interface AtsJob {
  externalId: string;
  title: string;
  jobUrl: string;
  applyUrl: string;
  location: string;
  rawJson: string;
  content: string;
}

function parseGreenhouseJobs(data: any, baseUrl: string): AtsJob[] {
  const jobs = data.jobs || [];
  return jobs.map((job: any) => {
    const loc = job.location?.name || '';
    return {
      externalId: String(job.id || ''),
      title: job.title || '',
      jobUrl: job.absolute_url || '',
      applyUrl: job.absolute_url || '',
      location: loc,
      rawJson: JSON.stringify(job),
      content: job.content || '',
    };
  });
}

function parseLeverJobs(data: any): AtsJob[] {
  const jobs = Array.isArray(data) ? data : [];
  return jobs.map((job: any) => ({
    externalId: job.id || '',
    title: job.text || '',
    jobUrl: job.hostedUrl || '',
    applyUrl: job.applyUrl || job.hostedUrl || '',
    location: job.categories?.location || '',
    rawJson: JSON.stringify(job),
    content: job.descriptionPlain || job.description || '',
  }));
}

function parseAshbyJobs(data: any): AtsJob[] {
  const jobs = data.jobs || [];
  return jobs.map((job: any) => {
    const loc = typeof job.location === 'string'
      ? job.location
      : job.location?.name || '';
    return {
      externalId: job.id || '',
      title: job.title || '',
      jobUrl: job.jobUrl || '',
      applyUrl: job.applyUrl || job.jobUrl || '',
      location: loc,
      rawJson: JSON.stringify(job),
      content: job.descriptionHtml || job.descriptionPlain || '',
    };
  });
}

function parseAtsJobs(data: any, url: string): AtsJob[] {
  const platform = detectPlatform(url);
  if (platform === 'greenhouse') return parseGreenhouseJobs(data, url);
  if (platform === 'lever') return parseLeverJobs(data);
  if (platform === 'ashby') return parseAshbyJobs(data);
  // Unknown — try common patterns
  const jobs = data.jobs || data.results || (Array.isArray(data) ? data : []);
  return jobs.map((job: any) => ({
    externalId: String(job.id || ''),
    title: job.title || job.text || '',
    jobUrl: job.absolute_url || job.hostedUrl || job.jobUrl || '',
    applyUrl: job.applyUrl || job.absolute_url || job.hostedUrl || '',
    location: job.location?.name || job.categories?.location || '',
    rawJson: JSON.stringify(job),
    content: job.content || job.description || '',
  }));
}

// ── Fetch existing job URLs for a company ────────────────────────────

async function getExistingJobUrls(companyRecordId: string): Promise<Set<string>> {
  const urls = new Set<string>();
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    params.append('filterByFormula', `FIND("${companyRecordId}", ARRAYJOIN({Companies}))`);
    params.append('fields[]', 'Job URL');
    params.append('pageSize', '100');
    if (offset) params.append('offset', offset);

    const data = await airtableFetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${JOBS_TABLE_ID}?${params.toString()}`
    );

    for (const r of (data.records || [])) {
      const url = r.fields?.['Job URL'];
      if (url) urls.add(url);
    }
    offset = data.offset;
    if (offset) await delay(RATE_LIMIT_DELAY);
  } while (offset);

  return urls;
}

// ── Create new jobs in Airtable ──────────────────────────────────────

async function createJobs(
  jobs: AtsJob[],
  companyRecordId: string,
): Promise<number> {
  let created = 0;

  for (let i = 0; i < jobs.length; i += 10) {
    const batch = jobs.slice(i, i + 10);
    const records = batch.map(job => ({
      fields: {
        'Title': job.title,
        'Companies': [companyRecordId],
        'Job URL': job.jobUrl,
        'Apply URL': job.applyUrl || job.jobUrl,
        'Job ID': job.externalId,
        'Location': job.location,
        'Raw JSON': job.rawJson,
        'content': job.content,
      },
    }));

    await airtableFetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${JOBS_TABLE_ID}`,
      {
        method: 'POST',
        body: JSON.stringify({ records }),
      }
    );
    created += batch.length;
    await delay(RATE_LIMIT_DELAY);
  }

  return created;
}

// ── Main endpoint ────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Optional auth
  const secret = searchParams.get('secret');
  if (SYNC_SECRET && secret !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: 'Missing Airtable credentials' }, { status: 500 });
  }

  const offsetParam = searchParams.get('offset') || '';
  const startTime = Date.now();

  const results: Array<{
    company: string;
    atsJobs: number;
    existingJobs: number;
    newJobs: number;
    error?: string;
  }> = [];

  let totalNew = 0;
  let nextOffset: string | undefined;

  try {
    // Fetch a batch of companies with Jobs API URL
    const params = new URLSearchParams();
    params.append('filterByFormula', "{Jobs API URL} != ''");
    params.append('pageSize', String(BATCH_SIZE));
    params.append('fields[]', 'Company');
    params.append('fields[]', 'Jobs API URL');
    if (offsetParam) params.append('offset', offsetParam);

    const companiesData = await airtableFetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}?${params.toString()}`
    );

    const companies = companiesData.records || [];
    nextOffset = companiesData.offset;

    for (const company of companies) {
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        // Time's up — return what we have and let the caller retry
        break;
      }

      const companyName = company.fields?.['Company'] || 'Unknown';
      const atsUrl = company.fields?.['Jobs API URL'];
      if (!atsUrl) continue;

      try {
        // 1. Fetch jobs from ATS
        const atsResponse = await fetch(atsUrl, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        });

        if (!atsResponse.ok) {
          results.push({
            company: companyName,
            atsJobs: 0, existingJobs: 0, newJobs: 0,
            error: `ATS HTTP ${atsResponse.status}`,
          });
          continue;
        }

        const atsText = await atsResponse.text();
        const atsData = JSON.parse(atsText);
        const atsJobs = parseAtsJobs(atsData, atsUrl);

        if (atsJobs.length === 0) {
          results.push({
            company: companyName,
            atsJobs: 0, existingJobs: 0, newJobs: 0,
          });
          continue;
        }

        // 2. Get existing job URLs for dedup
        await delay(RATE_LIMIT_DELAY);
        const existingUrls = await getExistingJobUrls(company.id);

        // 3. Filter to only new jobs
        const newJobs = atsJobs.filter(j => j.jobUrl && !existingUrls.has(j.jobUrl));

        // 4. Create new jobs in Airtable
        if (newJobs.length > 0) {
          await createJobs(newJobs, company.id);
          totalNew += newJobs.length;
        }

        results.push({
          company: companyName,
          atsJobs: atsJobs.length,
          existingJobs: existingUrls.size,
          newJobs: newJobs.length,
        });

      } catch (err) {
        results.push({
          company: companyName,
          atsJobs: 0, existingJobs: 0, newJobs: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      await delay(RATE_LIMIT_DELAY);
    }

    const runtime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      batch: {
        companiesProcessed: results.length,
        newJobsCreated: totalNew,
        hasMore: !!nextOffset,
        nextOffset: nextOffset || null,
      },
      results,
      runtime: `${runtime}ms`,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      runtime: `${Date.now() - startTime}ms`,
    }, { status: 500 });
  }
}
