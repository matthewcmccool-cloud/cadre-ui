import { NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AtsTestResult {
  company: string;
  atsUrl: string;
  platform: 'greenhouse' | 'lever' | 'ashby' | 'unknown';
  status: 'success' | 'error' | 'empty';
  jobCount?: number;
  error?: string;
  sampleJob?: {
    title: string;
    location?: string;
  };
}

function detectPlatform(url: string): 'greenhouse' | 'lever' | 'ashby' | 'unknown' {
  if (url.includes('greenhouse.io')) return 'greenhouse';
  if (url.includes('lever.co')) return 'lever';
  if (url.includes('ashbyhq.com')) return 'ashby';
  return 'unknown';
}

async function testAtsUrl(companyName: string, atsUrl: string): Promise<AtsTestResult> {
  const platform = detectPlatform(atsUrl);

  try {
    const response = await fetch(atsUrl, {
      headers: { 'Accept': 'application/json' },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        company: companyName,
        atsUrl,
        platform,
        status: 'error',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Parse jobs based on platform
    let jobs: any[] = [];

    if (platform === 'greenhouse') {
      jobs = data.jobs || [];
    } else if (platform === 'lever') {
      jobs = Array.isArray(data) ? data : [];
    } else if (platform === 'ashby') {
      jobs = data.jobs || [];
    } else {
      // Try common patterns
      jobs = data.jobs || data.results || (Array.isArray(data) ? data : []);
    }

    if (jobs.length === 0) {
      return {
        company: companyName,
        atsUrl,
        platform,
        status: 'empty',
        jobCount: 0,
      };
    }

    // Get sample job info
    const sampleJob = jobs[0];
    let sampleInfo: { title: string; location?: string } = { title: 'Unknown' };

    if (platform === 'greenhouse') {
      sampleInfo = {
        title: sampleJob.title || 'Unknown',
        location: sampleJob.location?.name,
      };
    } else if (platform === 'lever') {
      sampleInfo = {
        title: sampleJob.text || 'Unknown',
        location: sampleJob.categories?.location,
      };
    } else if (platform === 'ashby') {
      sampleInfo = {
        title: sampleJob.title || 'Unknown',
        location: sampleJob.location,
      };
    }

    return {
      company: companyName,
      atsUrl,
      platform,
      status: 'success',
      jobCount: jobs.length,
      sampleJob: sampleInfo,
    };

  } catch (error) {
    return {
      company: companyName,
      atsUrl,
      platform,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const onlyMissing = searchParams.get('onlyMissing') !== 'false'; // Default: only test companies with ATS URL but no jobs

  try {
    // Fetch companies with ATS URLs
    let filterFormula = "{Jobs API URL} != ''";
    if (onlyMissing) {
      // Companies with ATS URL but potentially missing jobs
      // We'll check job count after
      filterFormula = "AND({Jobs API URL} != '', {Company} != '')";
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Companies?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=${limit}&fields[]=Company&fields[]=Jobs%20API%20URL&fields[]=Industry`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'Failed to fetch companies', details: errorText }, { status: 500 });
    }

    const data = await response.json();
    const companies = data.records || [];

    const results: AtsTestResult[] = [];
    const summary = {
      total: companies.length,
      success: 0,
      empty: 0,
      error: 0,
      byPlatform: {
        greenhouse: { total: 0, success: 0 },
        lever: { total: 0, success: 0 },
        ashby: { total: 0, success: 0 },
        unknown: { total: 0, success: 0 },
      } as Record<string, { total: number; success: number }>,
    };

    for (const company of companies) {
      const companyName = company.fields?.Company;
      const atsUrl = company.fields?.['Jobs API URL'];

      if (!companyName || !atsUrl) continue;

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

      const result = await testAtsUrl(companyName, atsUrl);
      results.push(result);

      // Update summary
      summary.byPlatform[result.platform].total++;
      if (result.status === 'success') {
        summary.success++;
        summary.byPlatform[result.platform].success++;
      } else if (result.status === 'empty') {
        summary.empty++;
      } else {
        summary.error++;
      }
    }

    return NextResponse.json({
      summary,
      results,
    });

  } catch (error) {
    console.error('ATS test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
