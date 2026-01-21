import { NextResponse } from 'next/server';
import Airtable from 'airtable';

// Force Node.js runtime to fix AbortSignal compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

const FUNCTION_TABLE_ID = 'tbl94EXkSIEmhqyYy';
const JOB_LISTINGS_TABLE_ID = 'tbl4HJr9bYCMOn2Ry';

// Delay helper to avoid rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function classifyJobFunction(title: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a job classifier. Given a job title, respond with ONLY the function category name, nothing else. No asterisks, no punctuation, no explanation. Just the category name.

Valid categories: Accounting & Finance, Administrative, Business Development, Consulting, Customer Success, Data & Analytics, Design, Engineering, Executive, Facilities, Healthcare, Human Resources, Infrastructure, Legal, Marketing, Operations, People, Product, Quality Assurance, Research, Sales, Security, Supply Chain`
          },
          {
            role: 'user',
            content: `Classify this job title: "${title}"`
          }
        ],
        max_tokens: 20,
        temperature: 0.1
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

async function getFunctionRecordId(functionName: string): Promise<string | null> {
  try {
    const records = await base(FUNCTION_TABLE_ID)
      .select({
        filterByFormula: `LOWER({Function}) = LOWER("${functionName}")`,
        maxRecords: 1
      })
      .firstPage();
    
    return records.length > 0 ? records[0].id : null;
  } catch (error) {
    console.error('Error finding function:', error);
    return null;
  }
}

export async function GET() {
  const startTime = Date.now();
  const maxRuntime = 55000; // 55 seconds
  const delayBetweenCalls = 600; // 600ms delay between API calls
  
  const results: any[] = [];
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let rateLimited = 0;

  try {
    // Get jobs without Function field, skip empty titles
    const records = await base(JOB_LISTINGS_TABLE_ID)
      .select({
        filterByFormula: `AND({Function} = '', {Title} != '')`,
        maxRecords: 100,
        fields: ['Title', 'Function']
      })
      .firstPage();

    console.log(`Found ${records.length} jobs to process`);

    for (const record of records) {
      // Check if we're running out of time
      if (Date.now() - startTime > maxRuntime) {
        console.log('Approaching timeout, stopping...');
        break;
      }

      const title = record.get('Title') as string;
      
      // Double-check for empty titles
      if (!title || title.trim() === '') {
        skipped++;
        results.push({ id: record.id, title: '(empty)', status: 'skipped' });
        continue;
      }

      processed++;

      // Add delay before API call to avoid rate limits
      await delay(delayBetweenCalls);

      const classification = await classifyJobFunction(title);
      
      if (!classification) {
        rateLimited++;
        results.push({ id: record.id, title, status: 'api_error' });
        continue;
      }

      const functionId = await getFunctionRecordId(classification);
      
      if (functionId) {
        try {
          await base(JOB_LISTINGS_TABLE_ID).update(record.id, {
            'Function': [functionId]
          });
          updated++;
          results.push({ id: record.id, title, classification, status: 'updated' });
        } catch (updateError) {
          console.error('Update error:', updateError);
          results.push({ id: record.id, title, classification, status: 'update_failed' });
        }
      } else {
        results.push({ id: record.id, title, classification, status: 'no_match' });
      }
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
      error: String(error),
      processed,
      updated,
      skipped,
      rateLimited,
      runtime: Date.now() - startTime,
      results
    }, { status: 500 });
  }
}
