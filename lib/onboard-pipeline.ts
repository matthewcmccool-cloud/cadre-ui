import { inferFunction } from '@/lib/airtable';

// ---------------------------------------------------------------------------
// Configuration (read env at call time, not module load, for serverless)
// ---------------------------------------------------------------------------

const COMPANIES_TABLE = 'tbl4dA7iDr7mjF6Gt';
const JOBS_TABLE = 'Job Listings';
const FUNCTIONS_TABLE = 'tbl94EXkSIEmhqyYy';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Airtable helper — ALWAYS use response.text() + JSON.parse()
// ---------------------------------------------------------------------------

export async function airtableFetch(url: string, options?: RequestInit) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

// ---------------------------------------------------------------------------
// ATS Detection — deterministic, no AI needed
// ---------------------------------------------------------------------------

export interface AtsInfo {
  platform: 'Greenhouse' | 'Lever' | 'Ashby';
  slug: string;
  apiUrl: string;
}

export function detectAtsFromUrl(url: string): AtsInfo | null {
  const u = url.toLowerCase().trim();

  // Ashby: jobs.ashbyhq.com/{slug} or api.ashbyhq.com/posting-api/job-board/{slug}
  const ashbyMatch = u.match(/ashbyhq\.com\/(?:posting-api\/job-board\/)?([a-z0-9_-]+)/);
  if (ashbyMatch) {
    return {
      platform: 'Ashby',
      slug: ashbyMatch[1],
      apiUrl: `https://api.ashbyhq.com/posting-api/job-board/${ashbyMatch[1]}`,
    };
  }

  // Greenhouse: boards.greenhouse.io/{slug} or boards-api.greenhouse.io/v1/boards/{slug}
  const greenhouseMatch = u.match(/greenhouse\.io\/(?:v1\/boards\/)?([a-z0-9_-]+)/);
  if (greenhouseMatch) {
    return {
      platform: 'Greenhouse',
      slug: greenhouseMatch[1],
      apiUrl: `https://boards-api.greenhouse.io/v1/boards/${greenhouseMatch[1]}/jobs`,
    };
  }

  // Lever: jobs.lever.co/{slug} or api.lever.co/v0/postings/{slug}
  const leverMatch = u.match(/lever\.co\/(?:v0\/postings\/)?([a-z0-9_-]+)/);
  if (leverMatch) {
    return {
      platform: 'Lever',
      slug: leverMatch[1],
      apiUrl: `https://api.lever.co/v0/postings/${leverMatch[1]}`,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Perplexity: find an actual job posting URL (not just the careers page)
// ---------------------------------------------------------------------------

async function findCareersUrl(companyName: string): Promise<string | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content:
            'You find job posting URLs for companies. Return ONLY the URL, nothing else. I need a direct link to an actual open job posting (not just the careers page), because the individual job URL reveals which ATS platform the company uses. Look for URLs containing greenhouse.io, lever.co, or ashbyhq.com. Return the URL or "unknown" if not found.',
        },
        {
          role: 'user',
          content: `Find a direct link to any single open job posting at ${companyName}. Not their careers page — an actual job listing URL. The URL will usually be on greenhouse.io, lever.co, or ashbyhq.com. Just the URL.`,
        },
      ],
      max_tokens: 150,
      temperature: 0.1,
    }),
  });

  const text = await response.text();
  if (!response.ok) return null;

  const data = JSON.parse(text);
  const content = (data.choices?.[0]?.message?.content || '').trim();
  if (!content || content.toLowerCase().includes('unknown')) return null;

  // Strip markdown fences and extract URL
  const cleaned = content.replace(/```(?:\w+)?\s*/gi, '').replace(/```/g, '').trim();
  const urlMatch = cleaned.match(/https?:\/\/[^\s'"<>)]+/);
  return urlMatch ? urlMatch[0] : null;
}

// ---------------------------------------------------------------------------
// Job parsing types and helpers
// ---------------------------------------------------------------------------

interface ParsedJob {
  title: string;
  jobUrl: string;
  applyUrl: string;
  location: string;
  remoteFirst: boolean;
  country: string;
  datePosted: string;
  salary: string;
  content: string;
  rawJson: string;
  jobId: string;
}

function extractCountry(location: string): string {
  if (!location) return '';

  // US state abbreviations
  const usStates =
    /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/;
  if (usStates.test(location)) return 'United States';

  // US cities
  const usCities =
    /\b(new york|san francisco|los angeles|chicago|seattle|austin|boston|denver|miami|atlanta|dallas|houston|portland|nashville|raleigh|phoenix|philadelphia|san diego|san jose|detroit|minneapolis|salt lake|charlotte|pittsburgh|tampa|orlando|columbus|indianapolis|milwaukee|kansas city|las vegas|sacramento|richmond|st\.? louis|washington|brooklyn|manhattan)\b/i;
  if (usCities.test(location)) return 'United States';

  // Country patterns
  const countries: [RegExp, string][] = [
    [/\bunited states\b|\busa\b|\bu\.s\.?\b/i, 'United States'],
    [/\bunited kingdom\b|\buk\b|\bengland\b|\blondon\b|\bmanchester\b|\bbristol\b|\bedinburgh\b/i, 'United Kingdom'],
    [/\bcanada\b|\btoronto\b|\bvancouver\b|\bmontreal\b|\bottawa\b|\bcalgary\b/i, 'Canada'],
    [/\bgermany\b|\bberlin\b|\bmunich\b|\bfrankfurt\b|\bhamburg\b/i, 'Germany'],
    [/\bfrance\b|\bparis\b/i, 'France'],
    [/\bisrael\b|\btel aviv\b/i, 'Israel'],
    [/\bindia\b|\bbangalore\b|\bmumbai\b|\bhyderabad\b|\bdelhi\b|\bpune\b/i, 'India'],
    [/\baustralia\b|\bsydney\b|\bmelbourne\b/i, 'Australia'],
    [/\bireland\b|\bdublin\b/i, 'Ireland'],
    [/\bsingapore\b/i, 'Singapore'],
    [/\bjapan\b|\btokyo\b/i, 'Japan'],
    [/\bbrazil\b|\bsão paulo\b|\bsao paulo\b/i, 'Brazil'],
    [/\bnetherlands\b|\bamsterdam\b/i, 'Netherlands'],
    [/\bspain\b|\bmadrid\b|\bbarcelona\b/i, 'Spain'],
    [/\bsweden\b|\bstockholm\b/i, 'Sweden'],
  ];

  for (const [pattern, name] of countries) {
    if (pattern.test(location)) return name;
  }

  if (/^remote$/i.test(location.trim())) return '';
  return '';
}

function extractSalary(rawData: any): string {
  // Greenhouse
  if (rawData.pay) {
    const { min_amount, max_amount, currency_type } = rawData.pay;
    if (min_amount || max_amount) {
      const currency = currency_type || 'USD';
      if (min_amount && max_amount)
        return `${currency} ${min_amount.toLocaleString()} - ${max_amount.toLocaleString()}`;
      if (min_amount) return `${currency} ${min_amount.toLocaleString()}+`;
      return `${currency} up to ${max_amount.toLocaleString()}`;
    }
  }
  // Greenhouse metadata array
  if (rawData.metadata) {
    const salaryMeta = rawData.metadata.find((m: any) =>
      /salary|compensation|pay/i.test(m.name || '')
    );
    if (salaryMeta?.value) return salaryMeta.value;
  }
  // Lever
  if (rawData.salaryRange) {
    const { min, max, currency } = rawData.salaryRange;
    const c = currency || 'USD';
    if (min && max) return `${c} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  }
  if (rawData.categories?.salary) return rawData.categories.salary;
  // Ashby
  if (rawData.compensationTierSummary) return rawData.compensationTierSummary;

  return '';
}

// ---------------------------------------------------------------------------
// ATS job parsers
// ---------------------------------------------------------------------------

function parseGreenhouseJobs(data: any): ParsedJob[] {
  const jobs = data.jobs || data;
  if (!Array.isArray(jobs)) return [];

  return jobs.map((job: any) => {
    let location = '';
    if (job.offices && job.offices.length > 0) {
      location = job.offices[0].location || job.offices[0].name || '';
    } else if (job.location?.name) {
      location = job.location.name;
    }

    const remoteFirst = !!(
      (job.offices &&
        job.offices.some(
          (o: any) => /remote/i.test(o.name || '') || /remote/i.test(o.location || '')
        )) ||
      /remote/i.test(location)
    );

    const dateRaw = job.updated_at || job.created_at || '';
    const datePosted = dateRaw ? dateRaw.split('T')[0] : '';

    return {
      title: job.title || '',
      jobUrl: job.absolute_url || '',
      applyUrl: job.absolute_url || '',
      location,
      remoteFirst,
      country: extractCountry(location),
      datePosted,
      salary: extractSalary(job),
      content: job.content || '',
      rawJson: JSON.stringify(job),
      jobId: String(job.id || ''),
    };
  });
}

function parseLeverJobs(data: any): ParsedJob[] {
  const jobs = Array.isArray(data) ? data : data.postings || data.jobs || [];
  if (!Array.isArray(jobs)) return [];

  return jobs.map((job: any) => {
    const location = job.categories?.location || '';
    const remoteFirst = !!(
      job.categories?.commitment?.toLowerCase() === 'remote' ||
      job.workplaceType?.toLowerCase() === 'remote' ||
      /remote/i.test(location)
    );

    const datePosted = job.createdAt
      ? new Date(job.createdAt).toISOString().split('T')[0]
      : '';

    return {
      title: job.text || '',
      jobUrl: job.hostedUrl || '',
      applyUrl: job.applyUrl || job.hostedUrl || '',
      location,
      remoteFirst,
      country: extractCountry(location),
      datePosted,
      salary: extractSalary(job),
      content: job.descriptionPlain || job.description || '',
      rawJson: JSON.stringify(job),
      jobId: job.id || '',
    };
  });
}

function parseAshbyJobs(data: any): ParsedJob[] {
  const jobs = data.jobs || data;
  if (!Array.isArray(jobs)) return [];

  return jobs.map((job: any) => {
    let location = '';
    if (typeof job.location === 'string') {
      location = job.location;
    } else if (job.jobLocation) {
      if (typeof job.jobLocation === 'string') {
        location = job.jobLocation;
      } else if (job.jobLocation.city) {
        location =
          job.jobLocation.city + (job.jobLocation.country ? ', ' + job.jobLocation.country : '');
      }
    } else if (job.location?.name) {
      location = job.location.name;
    }

    const remoteFirst = !!(job.isRemote || /remote/i.test(location));

    const dateRaw = job.publishedAt || job.createdAt || '';
    const datePosted = dateRaw ? dateRaw.split('T')[0] : '';

    return {
      title: job.title || '',
      jobUrl: job.jobUrl || '',
      applyUrl: job.applyUrl || job.jobUrl || '',
      location,
      remoteFirst,
      country: extractCountry(location),
      datePosted,
      salary: extractSalary(job),
      content: job.descriptionHtml || job.description || '',
      rawJson: JSON.stringify(job),
      jobId: job.id || '',
    };
  });
}

async function fetchJobsFromAts(atsInfo: AtsInfo): Promise<ParsedJob[]> {
  const response = await fetch(atsInfo.apiUrl);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `${atsInfo.platform} API error ${response.status}: ${text.substring(0, 200)}`
    );
  }
  const data = JSON.parse(text);

  switch (atsInfo.platform) {
    case 'Greenhouse':
      return parseGreenhouseJobs(data);
    case 'Lever':
      return parseLeverJobs(data);
    case 'Ashby':
      return parseAshbyJobs(data);
  }
}

// ---------------------------------------------------------------------------
// Airtable operations
// ---------------------------------------------------------------------------

async function fetchCompanyRecord(companyId: string) {
  return airtableFetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${COMPANIES_TABLE}/${companyId}`
  );
}

async function getExistingJobUrls(companyName: string): Promise<Set<string>> {
  const escaped = companyName.replace(/"/g, '\\"');
  const params = new URLSearchParams();
  params.append(
    'filterByFormula',
    `FIND("${escaped}", ARRAYJOIN({Companies}, "||") & "")`
  );
  params.append('fields[]', 'Job URL');

  const data = await airtableFetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(JOBS_TABLE)}?${params.toString()}`
  );

  const urls = new Set<string>();
  for (const record of data.records || []) {
    const url = record.fields['Job URL'];
    if (url) urls.add(url);
  }
  return urls;
}

async function fetchFunctionMap(): Promise<Map<string, string>> {
  const data = await airtableFetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${FUNCTIONS_TABLE}?fields[]=Function`
  );
  const map = new Map<string, string>();
  for (const record of data.records || []) {
    const name = record.fields['Function'];
    if (name) map.set(name, record.id);
  }
  return map;
}

async function createJobsBatch(
  jobs: ParsedJob[],
  companyId: string,
  functionMap: Map<string, string>
): Promise<number> {
  let created = 0;

  for (let i = 0; i < jobs.length; i += 10) {
    const batch = jobs.slice(i, i + 10);

    const records = batch.map(job => {
      const funcName = inferFunction(job.title);
      const funcRecordId = funcName ? functionMap.get(funcName) : undefined;

      const fields: Record<string, any> = {
        Title: job.title,
        'Job URL': job.jobUrl,
        'Apply URL': job.applyUrl,
        'Date Posted': job.datePosted || undefined,
        Location: job.location,
        'Remote First': job.remoteFirst,
        Country: job.country || undefined,
        Salary: job.salary || undefined,
        content: job.content,
        'Raw JSON': job.rawJson,
        Companies: [companyId],
        'Job ID': job.jobId,
      };

      if (funcRecordId) {
        fields['Function'] = [funcRecordId];
      }

      // Remove undefined fields (Airtable doesn't like them)
      for (const key of Object.keys(fields)) {
        if (fields[key] === undefined) delete fields[key];
      }

      return { fields };
    });

    try {
      await airtableFetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(JOBS_TABLE)}`,
        {
          method: 'POST',
          body: JSON.stringify({ records }),
        }
      );
      created += batch.length;
    } catch (err) {
      console.error(`Failed to create batch ${i / 10 + 1}:`, err);
    }

    if (i + 10 < jobs.length) await delay(200);
  }

  return created;
}

async function updateCompany(companyId: string, fields: Record<string, any>) {
  await airtableFetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${COMPANIES_TABLE}/${companyId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    }
  );
}

// ---------------------------------------------------------------------------
// Company enrichment (Stage + Size via Perplexity)
// ---------------------------------------------------------------------------

function mapStage(raw: string): string | null {
  const t = raw.toLowerCase();
  if (t.includes('ipo') || t.includes('public') || t.includes('nyse') || t.includes('nasdaq'))
    return 'Public';
  if (t.includes('pre-seed') || t.includes('pre seed')) return 'Early Stage';
  if (t.includes('seed')) return 'Early Stage';
  if (t.includes('series a')) return 'Early Stage';
  if (t.includes('series b') || t.includes('series c')) return 'Mid Stage';
  if (
    t.includes('series d') ||
    t.includes('series e') ||
    t.includes('series f') ||
    t.includes('series g')
  )
    return 'Late Stage';
  return null;
}

function mapSize(raw: string): string | null {
  const t = raw.toLowerCase();
  const rangeMatch = t.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const high = parseInt(rangeMatch[2], 10);
    if (high <= 50) return '1-50';
    if (high <= 200) return '51-200';
    if (high <= 1000) return '201-1000';
    return '1000+';
  }
  const singleMatch = t.match(/(\d{1,5})\s*(\+|plus)?\s*employees?/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10);
    if (n <= 50) return '1-50';
    if (n <= 200) return '51-200';
    if (n <= 1000) return '201-1000';
    return '1000+';
  }
  return null;
}

async function enrichCompanyMetadata(
  companyName: string
): Promise<{ stage?: string; size?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return {};

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: `What is the funding stage and approximate employee count for ${companyName}? Return a short JSON object like: {"funding_stage": "...", "employee_count": "..."}. Be concise.`,
        },
      ],
      max_tokens: 150,
      temperature: 0.1,
    }),
  });

  const text = await response.text();
  if (!response.ok) return {};

  const data = JSON.parse(text);
  const content = data.choices?.[0]?.message?.content || '';

  // Strip markdown fences and extract JSON
  const cleaned = content.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const stage = mapStage(parsed.funding_stage || parsed.stage || '');
    const size = mapSize(parsed.employee_count || parsed.employees || parsed.size || '');
    return { stage: stage || undefined, size: size || undefined };
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface OnboardResult {
  success: boolean;
  /** Suggested HTTP status code for error responses (400, 404, 500) */
  statusCode?: number;
  error?: string;
  /** True when ATS platform could not be detected */
  atsNotFound?: boolean;
  companyName: string;
  atsPlatform: string;
  atsUrl: string;
  jobsFetched: number;
  jobsNew: number;
  jobsDuplicate: number;
  jobsCreated: number;
  companyEnriched: boolean;
  steps: string[];
  runtime: string;
}

// ---------------------------------------------------------------------------
// Find next unprocessed company (for batch endpoint)
// ---------------------------------------------------------------------------

export async function findNextUnprocessedCompany(): Promise<{
  id: string;
  name: string;
  hasMore: boolean;
} | null> {
  const params = new URLSearchParams();
  params.append(
    'filterByFormula',
    "AND({Company} != '', {Jobs API URL} = '')"
  );
  params.append('pageSize', '2');
  params.append('fields[]', 'Company');

  const data = await airtableFetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${COMPANIES_TABLE}?${params.toString()}`
  );

  const records = data.records || [];
  if (records.length === 0) return null;

  return {
    id: records[0].id,
    name: records[0].fields?.Company || '',
    hasMore: records.length > 1 || !!data.offset,
  };
}

// ---------------------------------------------------------------------------
// Main pipeline — processes a single company end-to-end
// ---------------------------------------------------------------------------

export async function onboardCompany(
  companyId: string,
  maxRuntimeMs: number = 8500
): Promise<OnboardResult> {
  const startTime = Date.now();
  const elapsed = () => Date.now() - startTime;

  const result: OnboardResult = {
    success: false,
    companyName: '',
    atsPlatform: '',
    atsUrl: '',
    jobsFetched: 0,
    jobsNew: 0,
    jobsDuplicate: 0,
    jobsCreated: 0,
    companyEnriched: false,
    steps: [],
    runtime: '',
  };

  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    return { ...result, error: 'Missing Airtable env vars', statusCode: 500, runtime: '0ms' };
  }

  try {
    // Step 1: Fetch company record
    const company = await fetchCompanyRecord(companyId);
    const companyName = company.fields?.Company || '';
    result.companyName = companyName;
    result.steps.push(`Fetched company: ${companyName}`);

    if (!companyName) {
      return {
        ...result,
        error: 'Company record has no name',
        statusCode: 400,
        runtime: `${elapsed()}ms`,
      };
    }

    // Step 2: Detect ATS platform
    let atsInfo: AtsInfo | null = null;

    // Try existing Jobs API URL first
    if (company.fields['Jobs API URL']) {
      atsInfo = detectAtsFromUrl(company.fields['Jobs API URL']);
      if (atsInfo) result.steps.push(`Detected ${atsInfo.platform} from existing Jobs API URL`);
    }

    // Try Website field
    if (!atsInfo && company.fields.Website) {
      atsInfo = detectAtsFromUrl(company.fields.Website);
      if (atsInfo) result.steps.push(`Detected ${atsInfo.platform} from Website field`);
    }

    // Fall back to Perplexity
    if (!atsInfo) {
      result.steps.push('No ATS detected from existing URLs, asking Perplexity...');
      const careersUrl = await findCareersUrl(companyName);
      if (careersUrl) {
        result.steps.push(`Perplexity found: ${careersUrl}`);
        atsInfo = detectAtsFromUrl(careersUrl);
        if (atsInfo) {
          result.steps.push(`Detected ${atsInfo.platform} from careers URL`);
        } else {
          result.steps.push(`URL doesn't match known ATS platforms`);
        }
      } else {
        result.steps.push('Perplexity could not find a careers URL');
      }
    }

    if (!atsInfo) {
      return {
        ...result,
        error: 'Could not detect ATS platform (Greenhouse, Lever, or Ashby)',
        statusCode: 404,
        atsNotFound: true,
        runtime: `${elapsed()}ms`,
      };
    }

    result.atsPlatform = atsInfo.platform;
    result.atsUrl = atsInfo.apiUrl;

    // Update company with ATS info
    await updateCompany(companyId, {
      'Jobs API URL': atsInfo.apiUrl,
      'ATS Platform': atsInfo.platform,
    });
    result.steps.push(
      `Updated company: ATS Platform = ${atsInfo.platform}, Jobs API URL saved`
    );

    // Step 3: Fetch jobs from ATS
    const rawJobs = await fetchJobsFromAts(atsInfo);
    result.jobsFetched = rawJobs.length;
    result.steps.push(`Fetched ${rawJobs.length} jobs from ${atsInfo.platform}`);

    if (rawJobs.length === 0) {
      // Still try to enrich company even if no jobs
      if (elapsed() < maxRuntimeMs) {
        if (!company.fields.Stage || !company.fields.Size) {
          const enrichment = await enrichCompanyMetadata(companyName);
          const enrichFields: Record<string, any> = {};
          if (!company.fields.Stage && enrichment.stage) enrichFields.Stage = enrichment.stage;
          if (!company.fields.Size && enrichment.size) enrichFields.Size = enrichment.size;
          if (Object.keys(enrichFields).length > 0) {
            await updateCompany(companyId, enrichFields);
            result.companyEnriched = true;
            result.steps.push(`Enriched company: ${JSON.stringify(enrichFields)}`);
          }
        }
      }
      result.success = true;
      result.runtime = `${elapsed()}ms`;
      return result;
    }

    // Step 4: Deduplicate against existing jobs
    const existingUrls = await getExistingJobUrls(companyName);
    const newJobs = rawJobs.filter(j => j.jobUrl && !existingUrls.has(j.jobUrl));
    result.jobsNew = newJobs.length;
    result.jobsDuplicate = rawJobs.length - newJobs.length;
    result.steps.push(`${newJobs.length} new jobs, ${result.jobsDuplicate} already exist`);

    // Step 5: Create new jobs with full metadata
    if (newJobs.length > 0 && elapsed() < maxRuntimeMs) {
      const functionMap = await fetchFunctionMap();
      const created = await createJobsBatch(newJobs, companyId, functionMap);
      result.jobsCreated = created;
      result.steps.push(`Created ${created} job records in Airtable`);
    }

    // Step 6: Enrich company metadata if missing
    if (elapsed() < maxRuntimeMs) {
      if (!company.fields.Stage || !company.fields.Size) {
        const enrichment = await enrichCompanyMetadata(companyName);
        const enrichFields: Record<string, any> = {};
        if (!company.fields.Stage && enrichment.stage) enrichFields.Stage = enrichment.stage;
        if (!company.fields.Size && enrichment.size) enrichFields.Size = enrichment.size;
        if (Object.keys(enrichFields).length > 0) {
          await updateCompany(companyId, enrichFields);
          result.companyEnriched = true;
          result.steps.push(`Enriched company: ${JSON.stringify(enrichFields)}`);
        } else {
          result.steps.push('Perplexity enrichment returned no mappable data');
        }
      } else {
        result.steps.push('Company already has Stage and Size — skipped enrichment');
      }
    }

    result.success = true;
    result.runtime = `${elapsed()}ms`;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.statusCode = 500;
    result.runtime = `${elapsed()}ms`;
    return result;
  }
}
