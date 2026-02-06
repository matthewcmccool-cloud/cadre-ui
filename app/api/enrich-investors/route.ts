import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

const INVESTORS_TABLE = 'Investors';
const BATCH_SIZE = 50; // Fetch more investors per run
const RATE_LIMIT_DELAY = 300; // Perplexity paid plan allows higher throughput
const MAX_RUNTIME_MS = 9000; // Stay under Vercel timeout

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ALWAYS use response.text() + JSON.parse() — never response.json()
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

// Fetch investors that are missing Bio OR Location
async function fetchInvestorsNeedingEnrichment() {
  const params = new URLSearchParams();
  params.append(
    'filterByFormula',
    `AND({Company} != '', OR({Bio} = BLANK(), {Location} = BLANK()))`
  );
  params.append('pageSize', String(BATCH_SIZE));
  params.append('fields[]', 'Company');
  params.append('fields[]', 'Bio');
  params.append('fields[]', 'Location');

  return airtableFetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${INVESTORS_TABLE}?${params.toString()}`
  );
}

// Call Perplexity to get investor bio + HQ location
async function lookupInvestor(
  name: string
): Promise<{ bio: string; location: string } | null> {
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
            content:
              'You are a concise research assistant. Return ONLY a JSON object, no markdown, no explanation.',
          },
          {
            role: 'user',
            content: `Give me a 1-2 sentence bio and the headquarters city for the venture capital firm "${name}". Return JSON: {"bio": "...", "location": "City, State"}. If you cannot find info, use empty strings.`,
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error(`Perplexity error for "${name}": ${text.substring(0, 300)}`);
      return null;
    }

    const data = JSON.parse(text);
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response (Perplexity sometimes wraps in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`No JSON in Perplexity response for "${name}": ${content.substring(0, 300)}`);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      bio: (parsed.bio || '').trim(),
      location: (parsed.location || parsed.headquarters || parsed.hq || '').trim(),
    };
  } catch (err) {
    console.error(`Perplexity lookup failed for "${name}":`, err);
    return null;
  }
}

// Batch update up to 10 records at once
async function batchUpdateInvestors(
  updates: Array<{ id: string; fields: Record<string, string> }>
) {
  return airtableFetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${INVESTORS_TABLE}`,
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

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json(
      { success: false, error: 'Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID' },
      { status: 500 }
    );
  }

  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Missing PERPLEXITY_API_KEY' },
      { status: 500 }
    );
  }

  try {
    const data = await fetchInvestorsNeedingEnrichment();
    const records = data.records || [];
    const hasMore = !!data.offset || records.length === BATCH_SIZE;

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        updated: 0,
        hasMore: false,
        runtime: `${Date.now() - startTime}ms`,
        message: 'All investors already have Bio and Location. Nothing to do.',
      });
    }

    const updates: Array<{ id: string; fields: Record<string, string> }> = [];
    const details: Array<{ name: string; bio: string; location: string; status: string }> = [];

    for (const record of records) {
      if (Date.now() - startTime > MAX_RUNTIME_MS) break;

      const name = record.fields?.Company;
      if (!name) {
        skipped++;
        continue;
      }

      processed++;
      const result = await lookupInvestor(name);

      if (!result || (!result.bio && !result.location)) {
        skipped++;
        details.push({ name, bio: '', location: '', status: 'no data from Perplexity' });
        await delay(RATE_LIMIT_DELAY);
        continue;
      }

      // Only write fields that are currently empty
      const fields: Record<string, string> = {};
      if (!record.fields.Bio && result.bio) {
        fields.Bio = result.bio;
      }
      if (!record.fields.Location && result.location) {
        fields.Location = result.location;
      }

      if (Object.keys(fields).length > 0) {
        updates.push({ id: record.id, fields });
        details.push({ name, bio: result.bio, location: result.location, status: 'will update' });
      } else {
        skipped++;
        details.push({ name, bio: result.bio, location: result.location, status: 'already filled' });
      }

      await delay(RATE_LIMIT_DELAY);
    }

    // Batch write all updates at once (max 10)
    if (updates.length > 0) {
      try {
        await batchUpdateInvestors(updates);
        updated = updates.length;
      } catch (err) {
        errors = updates.length;
        console.error('Batch update failed:', err);
      }
    }

    const runtime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      processed,
      updated,
      skipped,
      errors,
      hasMore,
      runtime: `${runtime}ms`,
      message: hasMore
        ? `Enriched ${updated} investors in ${runtime}ms. More remaining — call again to continue.`
        : `Done! Enriched ${updated} investors in ${runtime}ms.`,
      details,
    });
  } catch (error) {
    console.error('enrich-investors error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed,
        updated,
        runtime: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}
