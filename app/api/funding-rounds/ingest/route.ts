import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

const COMPANIES_TABLE = 'Companies';
const INVESTORS_TABLE = 'Investors';
const INDUSTRIES_TABLE = 'Industry';
const RATE_LIMIT_DELAY = 250;
const MAX_RUNTIME_MS = 8500;

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Map funding round sector → Cadre industry name.
 * Must match the Industry table's "Industry Name" field exactly.
 */
const SECTOR_TO_INDUSTRY: Record<string, string> = {
  'AI & Machine Learning': 'AI & Machine Learning',
  'AI': 'AI & Machine Learning',
  'Fintech': 'Fintech',
  'Defense & Aerospace': 'Defense & Aerospace',
  'Crypto': 'Crypto',
  'Enterprise Software': 'Enterprise Software',
  'Consumer': 'Consumer',
  'Data Science & Analytics': 'Data Science & Analytics',
  'Healthcare': 'Healthcare',
  'Healthtech': 'Healthcare',
  'SaaS': 'Enterprise Software',
  'DevTools': 'Enterprise Software',
  'Cybersecurity': 'Enterprise Software',
};

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

/** Fetch all records with pagination */
async function airtableFetchAll(table: string, params: URLSearchParams) {
  const records: any[] = [];
  let offset: string | undefined;

  do {
    const p = new URLSearchParams(params);
    if (offset) p.set('offset', offset);
    const data = await airtableFetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}?${p.toString()}`
    );
    records.push(...(data.records || []));
    offset = data.offset;
    if (offset) await delay(RATE_LIMIT_DELAY);
  } while (offset);

  return records;
}

/** Use Perplexity to find ATS URL for a company */
async function findAtsUrl(companyName: string): Promise<string | null> {
  if (!PERPLEXITY_API_KEY) return null;
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You find job board API URLs. Return ONLY the URL, nothing else. If Greenhouse: https://boards-api.greenhouse.io/v1/boards/COMPANYSLUG/jobs. If Lever: https://api.lever.co/v0/postings/COMPANYSLUG. If Ashby: https://api.ashbyhq.com/posting-api/job-board/COMPANYSLUG. Return only the URL or "unknown" if not found.',
          },
          {
            role: 'user',
            content: `What is the careers API URL for ${companyName}? Just the URL.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.1,
      }),
    });
    if (!response.ok) return null;
    const pText = await response.text();
    const data = JSON.parse(pText);
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content || content === 'null' || content.toLowerCase().includes('unknown')) return null;
    const urlMatch = content.match(/https?:\/\/[^\s'"<>]+/);
    return urlMatch ? urlMatch[0] : null;
  } catch {
    return null;
  }
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * POST /api/funding-rounds/ingest
 *
 * Fetches recent funding rounds, checks which companies are NOT in Cadre's DB,
 * creates Airtable company records for new ones, links investors + industry,
 * and optionally discovers ATS URLs.
 *
 * Query params:
 *   days=14 (lookback window, default 14)
 *   discoverAts=true (also find ATS URLs via Perplexity, default true)
 */
export async function POST(request: Request) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: 'Missing Airtable credentials' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '14', 10);
  const discoverAts = searchParams.get('discoverAts') !== 'false';

  const startTime = Date.now();
  const results: Array<{
    company: string;
    action: 'created' | 'exists' | 'skipped';
    investors?: string[];
    industry?: string;
    atsUrl?: string | null;
    error?: string;
  }> = [];

  try {
    // 1. Fetch funding rounds from our own API
    const baseUrl = request.url.split('/api/')[0];
    const roundsRes = await fetch(`${baseUrl}/api/funding-rounds?days=${days}`);
    const roundsText = await roundsRes.text();
    const roundsData = JSON.parse(roundsText);

    if (!roundsData.rounds || roundsData.rounds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No funding rounds found',
        created: 0,
        existing: 0,
      });
    }

    const rounds = roundsData.rounds as Array<{
      company: string;
      amount: string;
      roundType: string;
      leadInvestors: string[];
      sector: string;
      description: string;
      dateAnnounced: string;
      confidence: string;
    }>;

    // 2. Fetch existing companies (just names + slugs)
    const companyParams = new URLSearchParams();
    companyParams.set('fields[]', 'Company');
    const existingCompanies = await airtableFetchAll(COMPANIES_TABLE, companyParams);
    const existingSlugs = new Set(
      existingCompanies.map((r: any) => toSlug(r.fields?.['Company'] || ''))
    );

    // 3. Fetch all investors (for linking)
    const investorParams = new URLSearchParams();
    investorParams.set('fields[]', 'Firm Name');
    const investorRecords = await airtableFetchAll(INVESTORS_TABLE, investorParams);
    const investorNameToId = new Map<string, string>();
    for (const r of investorRecords) {
      const name = r.fields?.['Firm Name'] as string;
      if (name) {
        investorNameToId.set(name.toLowerCase(), r.id);
      }
    }

    // 4. Fetch all industries (for linking)
    const industryParams = new URLSearchParams();
    industryParams.set('fields[]', 'Industry Name');
    const industryRecords = await airtableFetchAll(INDUSTRIES_TABLE, industryParams);
    const industryNameToId = new Map<string, string>();
    for (const r of industryRecords) {
      const name = r.fields?.['Industry Name'] as string;
      if (name) {
        industryNameToId.set(name.toLowerCase(), r.id);
      }
    }

    // 5. Process each round
    let created = 0;
    let existing = 0;
    let skipped = 0;

    for (const round of rounds) {
      if (Date.now() - startTime > MAX_RUNTIME_MS) break;

      const slug = toSlug(round.company);

      // Skip if already in DB
      if (existingSlugs.has(slug)) {
        existing++;
        results.push({ company: round.company, action: 'exists' });
        continue;
      }

      // Skip low-confidence rounds for auto-creation
      if (round.confidence === 'low') {
        skipped++;
        results.push({ company: round.company, action: 'skipped', error: 'Low confidence' });
        continue;
      }

      try {
        // Match investors
        const matchedInvestorIds: string[] = [];
        const matchedInvestorNames: string[] = [];
        for (const inv of round.leadInvestors) {
          const invLower = inv.toLowerCase();
          // Exact match first
          if (investorNameToId.has(invLower)) {
            matchedInvestorIds.push(investorNameToId.get(invLower)!);
            matchedInvestorNames.push(inv);
            continue;
          }
          // Partial match (e.g., "a16z" matches "Andreessen Horowitz (a16z)")
          for (const [knownName, id] of investorNameToId) {
            if (knownName.includes(invLower) || invLower.includes(knownName)) {
              matchedInvestorIds.push(id);
              matchedInvestorNames.push(inv);
              break;
            }
          }
        }

        // Match industry
        const cadreIndustry = SECTOR_TO_INDUSTRY[round.sector];
        const industryId = cadreIndustry
          ? industryNameToId.get(cadreIndustry.toLowerCase())
          : undefined;

        // Build company record
        const fields: Record<string, any> = {
          'Company': round.company,
          'Stage': round.roundType, // Seed, Series A, etc.
          'About': round.description,
        };

        if (matchedInvestorIds.length > 0) {
          fields['VCs'] = matchedInvestorIds;
        }
        if (industryId) {
          fields['Industry'] = [industryId];
        }

        // Discover ATS URL if enabled
        let atsUrl: string | null = null;
        if (discoverAts && Date.now() - startTime < MAX_RUNTIME_MS - 3000) {
          atsUrl = await findAtsUrl(round.company);
          if (atsUrl) {
            fields['Jobs API URL'] = atsUrl;
          }
          await delay(RATE_LIMIT_DELAY);
        }

        // Create company in Airtable
        await airtableFetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}`,
          {
            method: 'POST',
            body: JSON.stringify({ records: [{ fields }] }),
          }
        );

        created++;
        existingSlugs.add(slug); // prevent duplicates within this batch
        results.push({
          company: round.company,
          action: 'created',
          investors: matchedInvestorNames,
          industry: cadreIndustry || round.sector,
          atsUrl,
        });

        await delay(RATE_LIMIT_DELAY);
      } catch (err) {
        skipped++;
        results.push({
          company: round.company,
          action: 'skipped',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      created,
      existing,
      skipped,
      total: rounds.length,
      results,
      runtime: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        runtime: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}
