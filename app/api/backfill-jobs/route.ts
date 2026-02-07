import { NextResponse } from 'next/server';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const JOB_LISTINGS_TABLE_ID = 'tbl4HJr9bYCMOn2Ry';

// Airtable rate limit: 5 req/sec — 200ms between requests is safe
const RATE_LIMIT_DELAY = 200;
const MAX_RUNTIME_MS = 8000; // Stay under Vercel timeout (10s hobby, 60s pro)

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// ── Location extraction from Raw JSON ────────────────────────────────
// Mirrors the logic in lib/airtable.ts lines 296-328

function extractLocation(rawData: any): string {
  // Greenhouse: offices array
  if (rawData?.offices && Array.isArray(rawData.offices) && rawData.offices.length > 0) {
    const office = rawData.offices[0];
    return office?.location || office?.name || '';
  }

  // Lever: location field (string or object)
  if (rawData?.location) {
    if (typeof rawData.location === 'string') {
      return rawData.location;
    }
    if (rawData.location.name) {
      return rawData.location.name;
    }
    if (rawData.location.city) {
      return rawData.location.city + (rawData.location.country ? ', ' + rawData.location.country : '');
    }
  }

  // Ashby: location object with city/country
  if (rawData?.jobLocation) {
    if (typeof rawData.jobLocation === 'string') return rawData.jobLocation;
    if (rawData.jobLocation.city) {
      return rawData.jobLocation.city + (rawData.jobLocation.country ? ', ' + rawData.jobLocation.country : '');
    }
  }

  return '';
}

// ── Remote detection ─────────────────────────────────────────────────

function extractRemoteFirst(rawData: any, location: string): boolean {
  // Greenhouse: check offices for "Remote" in name/location
  if (rawData?.offices && Array.isArray(rawData.offices)) {
    for (const office of rawData.offices) {
      const name = (office?.name || '').toLowerCase();
      const loc = (office?.location || '').toLowerCase();
      if (name.includes('remote') || loc.includes('remote')) return true;
    }
  }

  // Lever: categories.commitment or location contains "Remote"
  if (rawData?.categories?.commitment) {
    if (rawData.categories.commitment.toLowerCase().includes('remote')) return true;
  }
  if (rawData?.workplaceType === 'remote') return true;

  // Ashby: isRemote flag
  if (rawData?.isRemote === true) return true;

  // Fallback: check if location string contains "remote"
  if (location.toLowerCase().includes('remote')) return true;

  return false;
}

// ── Country derivation ───────────────────────────────────────────────

// Common US state abbreviations
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

function extractCountry(location: string): string {
  if (!location) return '';

  const loc = location.trim();

  // If it explicitly says a country
  if (/\bunited states\b/i.test(loc) || /\busa\b/i.test(loc) || /\bu\.s\.\b/i.test(loc)) return 'United States';
  if (/\bunited kingdom\b/i.test(loc) || /\buk\b/i.test(loc)) return 'United Kingdom';
  if (/\bcanada\b/i.test(loc)) return 'Canada';
  if (/\bgermany\b/i.test(loc)) return 'Germany';
  if (/\bfrance\b/i.test(loc)) return 'France';
  if (/\bisrael\b/i.test(loc)) return 'Israel';
  if (/\bindia\b/i.test(loc)) return 'India';
  if (/\baustralia\b/i.test(loc)) return 'Australia';
  if (/\bireland\b/i.test(loc)) return 'Ireland';
  if (/\bsingapore\b/i.test(loc)) return 'Singapore';
  if (/\bjapan\b/i.test(loc)) return 'Japan';
  if (/\bbrazil\b/i.test(loc)) return 'Brazil';

  // Check for US state abbreviation pattern: "City, ST" or "City, State"
  const parts = loc.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1].toUpperCase();
    if (US_STATES.has(lastPart)) return 'United States';
  }

  // Common US cities
  const usCities = /\b(san francisco|new york|los angeles|chicago|seattle|austin|boston|denver|portland|miami|atlanta|dallas|houston|nashville|philadelphia|phoenix|san diego|san jose|washington|brooklyn|manhattan|palo alto|mountain view|menlo park|sunnyvale|cupertino|redwood city|santa monica|culver city|venice|playa vista|hoboken|jersey city|cambridge|somerville|santa clara|irvine|raleigh|durham|charlotte|minneapolis|salt lake city|detroit|pittsburgh|columbus|indianapolis|milwaukee|kansas city|st\.? louis|tampa|orlando|jacksonville|las vegas|sacramento|oakland|berkeley|bellevue|redmond|kirkland)\b/i;
  if (usCities.test(loc)) return 'United States';

  // If it just says "Remote" with no other info, skip
  if (/^remote$/i.test(loc)) return '';

  return '';
}

// ── Salary extraction ────────────────────────────────────────────────

function extractSalary(rawData: any): string {
  // Greenhouse: pay or compensation fields
  if (rawData?.pay) {
    if (typeof rawData.pay === 'string') return rawData.pay;
    if (rawData.pay.min_amount && rawData.pay.max_amount) {
      const currency = rawData.pay.currency || 'USD';
      return `${currency} ${rawData.pay.min_amount.toLocaleString()} - ${rawData.pay.max_amount.toLocaleString()}`;
    }
  }

  // Greenhouse: metadata compensation
  if (rawData?.metadata) {
    for (const meta of Array.isArray(rawData.metadata) ? rawData.metadata : []) {
      if (meta?.name?.toLowerCase().includes('salary') || meta?.name?.toLowerCase().includes('compensation')) {
        if (meta.value) return String(meta.value);
      }
    }
  }

  // Lever: salaryRange or categories.salary
  if (rawData?.salaryRange) {
    if (typeof rawData.salaryRange === 'string') return rawData.salaryRange;
    if (rawData.salaryRange.min && rawData.salaryRange.max) {
      const currency = rawData.salaryRange.currency || 'USD';
      return `${currency} ${rawData.salaryRange.min.toLocaleString()} - ${rawData.salaryRange.max.toLocaleString()}`;
    }
  }
  if (rawData?.categories?.salary) return String(rawData.categories.salary);

  // Ashby: compensationTierSummary
  if (rawData?.compensationTierSummary) return String(rawData.compensationTierSummary);
  if (rawData?.compensation) {
    if (typeof rawData.compensation === 'string') return rawData.compensation;
  }

  return '';
}

// ── Fetch one page of jobs needing backfill ──────────────────────────

async function fetchJobsNeedingBackfill(offset?: string) {
  const params = new URLSearchParams();
  // Jobs where Location is blank AND Raw JSON exists
  params.append('filterByFormula', "AND({Location} = BLANK(), {Raw JSON} != BLANK())");
  params.append('pageSize', '100');
  params.append('fields[]', 'Raw JSON');
  params.append('fields[]', 'Location');
  params.append('fields[]', 'Remote First');
  params.append('fields[]', 'Country');
  params.append('fields[]', 'Salary');
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

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ success: false, error: 'Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID' }, { status: 500 });
  }

  try {
    let offset: string | undefined;

    do {
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        console.log('Approaching timeout, stopping...');
        break;
      }

      const data = await fetchJobsNeedingBackfill(offset);
      const records = data.records || [];
      offset = data.offset;

      if (records.length === 0) break;

      // Parse Raw JSON and build updates
      const updates: Array<{ id: string; fields: Record<string, unknown> }> = [];

      for (const record of records) {
        const rawJsonStr = record.fields?.['Raw JSON'];
        if (!rawJsonStr) {
          skipped++;
          continue;
        }

        processed++;

        let rawData: any;
        try {
          rawData = JSON.parse(rawJsonStr);
        } catch {
          skipped++;
          continue;
        }

        const location = extractLocation(rawData);
        if (!location) {
          skipped++;
          continue;
        }

        const remoteFirst = extractRemoteFirst(rawData, location);
        const country = extractCountry(location);
        const salary = extractSalary(rawData);

        const fields: Record<string, unknown> = {
          Location: location,
        };

        if (remoteFirst) {
          fields['Remote First'] = true;
        }

        if (country) {
          fields['Country'] = country;
        }

        if (salary) {
          fields['Salary'] = salary;
        }

        updates.push({ id: record.id, fields });
      }

      // Batch write in chunks of 10 (Airtable max)
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
      skipped,
      errors,
      hasMore,
      runtime: `${runtime}ms`,
      message: hasMore
        ? `Processed ${updated} jobs in ${runtime}ms. More jobs remaining — call again to continue.`
        : `Done! Backfilled ${updated} jobs in ${runtime}ms. No more jobs needing backfill.`,
    });

  } catch (error) {
    console.error('Backfill-jobs error:', error);
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
