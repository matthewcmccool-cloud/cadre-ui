import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const COMPANIES_TABLE = 'Companies';
const BATCH_SIZE = 15;
const RATE_LIMIT_DELAY = 1500;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function findAtsUrl(companyName: string): Promise<string | null> {
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
            content: 'You find job board API URLs. Return ONLY the URL, nothing else. If Greenhouse: https://boards-api.greenhouse.io/v1/boards/COMPANY/jobs. If Lever: https://api.lever.co/v0/postings/COMPANY. If Ashby: https://api.ashbyhq.com/posting-api/job-board/COMPANY. If unknown, return null.'
          },
          {
            role: 'user',
            content: `What is the jobs API URL for ${companyName}? Just the URL.`
          }
        ],
        max_tokens: 100,
        temperature: 0.1,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content || content === 'null' || content.toLowerCase().includes('unknown')) return null;
    
    const urlMatch = content.match(/https?:\/\/[^\s"'<>]+/);
    return urlMatch ? urlMatch[0] : null;
  } catch (error) {
    console.error('Error finding ATS URL:', error);
    return null;
  }
}

export async function GET() {
  const startTime = Date.now();
  const results: any[] = [];
  let totalCompanies = 0;
  let withUrl = 0;
  let withoutUrl = 0;
  let processed = 0;
  let updated = 0;
  let errors = 0;

  try {
    // First get counts
    const countParams = new URLSearchParams();
    countParams.append('fields[]', 'Name');
    countParams.append('fields[]', 'jobsApiUrl');
    countParams.append('pageSize', '100');
    
    let offset: string | undefined;
    const allCompanies: any[] = [];
    
    do {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}?${countParams.toString()}${offset ? '&offset=' + offset : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
      const data = await res.json();
      allCompanies.push(...(data.records || []));
      offset = data.offset;
    } while (offset);
    
    totalCompanies = allCompanies.length;
    withUrl = allCompanies.filter(r => r.fields?.jobsApiUrl).length;
    withoutUrl = totalCompanies - withUrl;
    
    const companiesWithoutUrl = allCompanies.filter(r => !r.fields?.jobsApiUrl);
    const sampleMissing = companiesWithoutUrl.slice(0, 10).map(r => r.fields?.Name || 'Unknown');

    // Now fetch batch to process
    const params = new URLSearchParams();
    params.append('filterByFormula', `{jobsApiUrl} = ''`);
    params.append('maxRecords', String(BATCH_SIZE));
    params.append('fields[]', 'Name');
    params.append('fields[]', 'jobsApiUrl');

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}?${params.toString()}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    const data = await response.json();
    const records = data.records || [];

    for (const record of records) {
      if (Date.now() - startTime > 50000) break;
      
      const companyName = record.fields?.Name;
      if (!companyName) continue;
      
      processed++;
      const atsUrl = await findAtsUrl(companyName);
      
      if (atsUrl) {
        const updateRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}/${record.id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fields: { jobsApiUrl: atsUrl } }),
          }
        );
        
        if (updateRes.ok) {
          updated++;
          results.push({ company: companyName, url: atsUrl, status: 'updated' });
        } else {
          errors++;
          results.push({ company: companyName, url: atsUrl, status: 'error' });
        }
      } else {
        results.push({ company: companyName, url: null, status: 'not_found' });
      }
      
      await delay(RATE_LIMIT_DELAY);
    }

    return NextResponse.json({
      success: true,
      stats: { totalCompanies, withUrl, withoutUrl, sampleMissing },
      batch: { processed, updated, errors },
      runtime: Date.now() - startTime,
      results
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: { totalCompanies, withUrl, withoutUrl },
      batch: { processed, updated, errors }
    });
  }
}
