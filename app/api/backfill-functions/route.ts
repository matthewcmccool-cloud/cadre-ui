import { NextResponse } from 'next/server';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

const FUNCTION_TABLE_ID = 'tbl94EXkSIEmhqyYy';
const JOB_LISTINGS_TABLE_ID = 'tbl4HJr9bYCMOn2Ry';

const BATCH_SIZE = 15;
const RATE_LIMIT_DELAY = 1000;

// Delay helper to avoid rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Valid function categories
const VALID_FUNCTIONS = [
  'Sales', 'BD & Partnerships', 'Marketing', 'Customer Success',
  'Solutions Engineering', 'Revenue Operations', 'Developer Relations',
  'Product Management', 'Product Design / UX', 'Engineering',
  'AI & Research', 'Business Operations', 'People',
  'Finance & Accounting', 'Legal', 'Other'
];

async function classifyJobFunction(title: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a job classifier. Given a job title, respond with ONLY the function category name, nothing else. No asterisks, no punctuation, no explanation. Just the category name. Valid categories: Sales, BD & Partnerships, Marketing, Customer Success, Solutions Engineering, Revenue Operations, Developer Relations, Product Management, Product Design / UX, Engineering, AI & Research, Business Operations, People, Finance & Accounting, Legal, Other'
          },
          {
            role: 'user',
            content: `Classify this job title: "${title}"`
          }
        ],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Perplexity API error:', errorData);
      return null;
    }

    const data = await response.json();
    let classification = data.choices?.[0]?.message?.content?.trim();

    // Strip asterisks and extra whitespace
    if (classification) {
      classification = classification.replace(/\*+/g, '').trim();
    }

    return classification || null;
  } catch (error) {
    console.error('Classification error:', error);
    return null;
  }
}

function mapToValidFunction(classification: string | null): string {
  if (!classification) return 'Other';
  
  const normalized = classification.toLowerCase().trim();
  
  for (const func of VALID_FUNCTIONS) {
    if (normalized === func.toLowerCase() || normalized.includes(func.toLowerCase())) {
      return func;
    }
  }
  
  return 'Other';
}

async function getFunctionRecordId(functionName: string): Promise<string | null> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `LOWER({Function}) = LOWER("${functionName}")`);
    params.append('maxRecords', '1');

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${FUNCTION_TABLE_ID}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records?.length > 0 ? data.records[0].id : null;
  } catch (error) {
    console.error('Error finding function:', error);
    return null;
  }
}

export async function GET() {
  const startTime = Date.now();
  const maxRuntime = 55000; // 55 seconds

  const results: any[] = [];
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let rateLimited = 0;

  try {
    // Get jobs without Function field, skip empty titles
    const params = new URLSearchParams();
    params.append('filterByFormula', `AND({Function} = '', {Title} != '')`);
    params.append('maxRecords', String(BATCH_SIZE));
    params.append('fields[]', 'Title');
    params.append('fields[]', 'Function');

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${JOB_LISTINGS_TABLE_ID}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();
    const records = data.records || [];

    console.log(`Found ${records.length} jobs to process`);

    for (const record of records) {
      // Check if we're running out of time
      if (Date.now() - startTime > maxRuntime) {
        console.log('Approaching timeout, stopping...');
        break;
      }

      const title = record.fields?.Title;
      if (!title) {
        skipped++;
        continue;
      }

      processed++;

      // Classify the job title
      const classification = await classifyJobFunction(title);
      const mappedFunction = mapToValidFunction(classification);

      // Get the function record ID
      const functionRecordId = await getFunctionRecordId(mappedFunction);

      if (functionRecordId) {
        // Update the job record with the function
        const updateResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${JOB_LISTINGS_TABLE_ID}/${record.id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                Function: [functionRecordId]
              }
            }),
          }
        );

        if (updateResponse.ok) {
          updated++;
          results.push({
            title,
            classification,
            mappedFunction,
            status: 'updated'
          });
        } else {
          const errorText = await updateResponse.text();
          console.error(`Failed to update job ${record.id}:`, errorText);
          results.push({
            title,
            classification,
            mappedFunction,
            status: 'error',
            error: errorText
          });
        }
      } else {
        skipped++;
        results.push({
          title,
          classification,
          mappedFunction,
          status: 'skipped',
          reason: 'Function record not found'
        });
      }

      // Rate limiting delay
      await delay(RATE_LIMIT_DELAY);
    }

    return NextResponse.json({
      success: true,
      processed,
      updated,
      skipped,
      rateLimited,
      runtime: Date.now() - startTime,
      results
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processed,
      updated,
      skipped,
      rateLimited,
      runtime: Date.now() - startTime,
      results
    });
  }
}
