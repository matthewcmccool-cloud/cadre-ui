import { parseCountry, parseWorkMode, matchesPostedFilter } from './location-parser';
import pLimit from 'p-limit';

// Limit concurrent Airtable API requests to 4 (Airtable rate limit: 5 req/s)
const airtableLimit = pLimit(4);

// Infer function from job title when Function field is empty.
// Categories MUST match the Airtable Function table exactly so the client-side
// fallback produces the same labels as the /api/backfill-functions endpoint.
// These are granular function names — the 10-segment analytics rollup
// (Sales & GTM, Marketing, Engineering, etc.) lives in Airtable's
// Department column on the Function table.
// Order matters — specific roles first, broad catch-alls last.
export function inferFunction(title: string): string {
  const rules: [RegExp, string][] = [
    [/\bsolutions? engineer|sales engineer|pre.?sales/i, 'Solutions Engineering'],
    [/\bdevrel|developer relation|developer advocate|developer evangel|community manager/i, 'Developer Relations'],
    [/\brevenue op|rev\s?ops/i, 'Revenue Operations'],
    [/\bbusiness develop|partnerships?|partner manager|bd |strategic allianc|channel manager/i, 'BD & Partnerships'],
    [/\bcustomer success|customer support|customer experience|support engineer|client success|technical support|help desk|service desk/i, 'Customer Success'],
    [/\bproduct design|ux|ui designer|graphic design|brand design|creative director|ux research|visual design|interaction design|design system/i, 'Product Design / UX'],
    [/\bproduct manag|head of product|vp.*product|director.*product|product lead|product owner|product strateg|technical product|product analys/i, 'Product Management'],
    [/\bdata scien|machine learn|\bml\b|\bai\b|research scien|deep learn|nlp|computer vision|llm|gen\s?ai|prompt engineer|applied scien/i, 'AI & Research'],
    [/\bengineer|software|developer|sre|devops|infrastructure|platform|full.?stack|backend|frontend|ios\b|android|mobile dev|architect|tech lead|cto\b|site reliab|cloud|database|dba\b|qa\b|quality assur|test\b|automation/i, 'Engineering'],
    [/\bsales|account exec|sdr\b|bdr\b|account manag|closing|quota|commercial|new business|enterprise rep/i, 'Sales'],
    [/\bmarketing|growth|demand gen|content market|seo\b|brand manag|comms\b|communications|social media|pr manager|content strateg|copywriter|content writer|editorial|email market|lifecycle market/i, 'Marketing'],
    [/\brecruit|talent|people ops|human resource|\bhr\b|people partner|head of people|talent acqui|onboarding|dei\b|diversity/i, 'People'],
    [/\bfinance|account(ant|ing)|controller|tax\b|treasury|financial|fp&a|cfo|payroll|billing|revenue account|audit/i, 'Finance & Accounting'],
    [/\boperation|chief of staff|program manag|project manag|business ops|strategy|bizops|office manag|executive assist|admin|procurement|supply chain|facilities/i, 'Business Operations'],
    [/\blegal|counsel|compliance|regulatory|policy|privacy|governance/i, 'Legal'],
    [/\bsecurity|infosec|cyber|penetration|appsec|information security/i, 'Engineering'],
    [/\bdata analy|business intel|analytics|data engineer|etl\b|bi\b.*engineer|data platform/i, 'AI & Research'],
    // Catch-all: director/VP/head roles that didn't match above
    [/\bdirector|vice president|\bvp\b|head of|general manager|\bgm\b|managing director/i, 'Business Operations'],
    // Technical writer and docs
    [/\btechnical writer|documentation|docs engineer/i, 'Engineering'],
    // Coordinator / specialist / associate (broad catch-all)
    [/\bcoordinator|specialist|associate|intern\b|fellow\b/i, 'Business Operations'],
  ];
  for (const [pattern, label] of rules) {
    if (pattern.test(title)) return label;
  }
  return '';
}

// Maps granular Function names → 10 analytics Department segments.
// Used as fallback when department isn't available from Airtable lookup
// (e.g., when inferFunction() provides the function name client-side).
const FUNCTION_TO_DEPARTMENT: Record<string, string> = {
  'Sales': 'Sales & GTM',
  'BD & Partnerships': 'Sales & GTM',
  'Solutions Engineering': 'Sales & GTM',
  'Revenue Operations': 'Sales & GTM',
  'Marketing': 'Marketing',
  'Developer Relations': 'Marketing',
  'Engineering': 'Engineering',
  'AI & Research': 'AI & Research',
  'Product Management': 'Product',
  'Product Design / UX': 'Design',
  'Customer Success': 'Customer Success & Support',
  'People': 'People & Talent',
  'Finance & Accounting': 'Finance & Legal',
  'Legal': 'Finance & Legal',
  'Business Operations': 'Operations & Admin',
  'Other': 'Operations & Admin',
};

const TABLES = {
  jobs: 'Job Listings',
  companies: 'Companies',
  investors: 'Investors',
  functions: 'Function',
  industries: 'Industry',
};

// Consistent slug generation - must match JobTable.tsx toSlug()
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

// Fetch ALL records from a table, handling pagination (Airtable returns max 100 per page)
async function fetchAllAirtable(
  table: string,
  options?: {
    filterByFormula?: string;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    fields?: string[];
  }
): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const result = await fetchAirtable(table, { ...options, offset });
    allRecords.push(...result.records);
    offset = result.offset;

    // Rate limit: Airtable allows 5 requests/second
    if (offset) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } while (offset);

  return allRecords;
}

async function fetchAirtable(
  table: string,
  options?: {
    filterByFormula?: string;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    maxRecords?: number;
    fields?: string[];
    offset?: string;
  }
): Promise<{ records: AirtableRecord[]; offset?: string }> {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  // Build URL with query params from options object
  const params = new URLSearchParams();

  if (options?.filterByFormula) {
    params.append('filterByFormula', options.filterByFormula);
  }
  if (options?.sort) {
    options.sort.forEach((s, i) => {
      params.append(`sort[${i}][field]`, s.field);
      params.append(`sort[${i}][direction]`, s.direction);
    });
  }
  if (options?.maxRecords) {
    params.append('maxRecords', String(options.maxRecords));
  }
  if (options?.fields) {
    options.fields.forEach(f => params.append('fields[]', f));
  }
  if (options?.offset) {
    params.append('offset', options.offset);
  }

  const queryString = params.toString();
  const url = queryString
    ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}?${queryString}`
    : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`;

  const response = await airtableLimit(() =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    })
  );

  // Read body only once to avoid Response.clone error
  const text = await response.text();

  if (!response.ok) {
        // Handle expired pagination tokens gracefully
        if (response.status === 422 && text.includes('LIST_RECORDS_ITERATOR_NOT_AVAILABLE')) {
                console.warn(`Airtable pagination expired for ${table}, returning partial results`);
                return { records: [] };
              }
    throw new Error(`Airtable error: ${response.status} for table ${table}${text ? ': ' + text : ''}`);
  }

  const data = JSON.parse(text);
  return { records: data.records, offset: data.offset };
}

export interface Job {
  id: string;
  jobId: string;
  title: string;
  company: string;
  companyUrl: string;
  investors: string[];
  location: string;
  remoteFirst: boolean;
  functionName: string;
  departmentName: string;
  industry: string;
  datePosted: string;
  firstSeenAt: string;
  jobUrl: string;
  applyUrl: string;
  salary: string;
  description?: string;
}

export interface CompanyTickerItem {
  name: string;
  url?: string;
}

export interface FilterOptions {
  functions: string[];
  departments: string[];
  locations: string[];
  investors: string[];
  industries: string[];
  companies: string[];
  companyData: CompanyTickerItem[];
}

export interface JobsResult {
  jobs: Job[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Shared utilities for job record mapping
// Eliminates duplication across getJobs, getJobById, getJobsForCompanyNames,
// getFeaturedJobs, and getOrganicJobs.
// ---------------------------------------------------------------------------

// Standard fields to request when fetching job records
const JOB_FIELDS = [
  'Job ID', 'Title', 'Companies', 'Function', 'Location',
  'Job URL', 'Apply URL', 'Salary', 'Investors',
  'Company Industry (Lookup)', 'Raw JSON',
];

// Extract location from Raw JSON or the Location field, with remote fallback
function extractLocation(record: AirtableRecord): { location: string; remoteFirst: boolean } {
  let location = '';
  const remoteFirst = record.fields['Remote First'] || false;

  if (record.fields['Raw JSON']) {
    try {
      const rawData = JSON.parse(record.fields['Raw JSON'] as string);
      if (rawData?.offices && rawData.offices.length > 0) {
        const office = rawData.offices[0];
        location = office?.location || office?.name || '';
      } else if (rawData?.location) {
        if (typeof rawData.location === 'string') {
          location = rawData.location;
        } else if (rawData.location.name) {
          location = rawData.location.name;
        } else if (rawData.location.city) {
          location = rawData.location.city + (rawData.location.country ? ', ' + rawData.location.country : '');
        }
      }
    } catch (e) {
      // Ignore JSON parse errors from malformed Raw JSON
    }
  }

  if (!location) {
    const airtableLocation = record.fields['Location'] as string || '';
    if (airtableLocation && !['remote', 'hybrid', 'on-site', 'onsite'].includes(airtableLocation.toLowerCase())) {
      location = airtableLocation;
    } else if (remoteFirst) {
      location = 'Remote';
    }
  }

  return { location, remoteFirst };
}

interface LookupMaps {
  companyMap: Map<string, string>;
  companyUrlMap: Map<string, string>;
  functionMap: Map<string, string>;
  investorMap: Map<string, string>;
  industryMap: Map<string, string>;
}

// Build all lookup maps in parallel. Uses fetchAllAirtable for companies (1,343)
// and investors (201) since both exceed Airtable's 100-record page limit.
async function buildLookupMaps(): Promise<LookupMaps> {
  const [functionRecords, investorRecords, industryRecords, companyRecords] = await Promise.all([
      fetchAirtable(TABLES.functions, { fields: ['Function'] }).catch(() => ({ records: [] })),
    fetchAllAirtable(TABLES.investors, { fields: ['Firm Name'] }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
    fetchAllAirtable(TABLES.companies, { fields: ['Company', 'URL'] }),
  ]);

  const companyMap = new Map<string, string>();
  const companyUrlMap = new Map<string, string>();
  companyRecords.forEach(r => {
    companyMap.set(r.id, (r.fields['Company'] as string) || '');
    companyUrlMap.set(r.id, (r.fields['URL'] as string) || '');
  });

  const functionMap = new Map<string, string>();
  functionRecords.records.forEach(r => functionMap.set(r.id, r.fields['Function'] || ''));

  const investorMap = new Map<string, string>();
  investorRecords.forEach(r => investorMap.set(r.id, r.fields['Firm Name'] || ''));

  const industryMap = new Map<string, string>();
  industryRecords.records.forEach(r => industryMap.set(r.id, r.fields['Industry Name'] || ''));

  return { companyMap, companyUrlMap, functionMap, investorMap, industryMap };
}

// Map a raw Airtable job record to a Job object using pre-built lookup maps
function mapRecordToJob(record: AirtableRecord, maps: LookupMaps): Job {
  const companyField = record.fields['Companies'];
  let companyName = 'Unknown';
  let companyUrl = '';

  if (typeof companyField === 'string') {
    companyName = companyField;
  } else if (Array.isArray(companyField) && companyField.length > 0) {
    companyName = maps.companyMap.get(companyField[0]) || 'Unknown';
    companyUrl = maps.companyUrlMap.get(companyField[0]) || '';
  }

  const functionIds = record.fields['Function'] || [];
  let funcName = '';
  if (Array.isArray(functionIds) && functionIds.length > 0) {
    funcName = maps.functionMap.get(functionIds[0]) || '';
  }
  if (!funcName) {
    funcName = inferFunction(record.fields['Title'] as string || '');
  }

  const investorIds = record.fields['Investors'] || [];
  const investorNames = Array.isArray(investorIds)
    ? investorIds.map(id => maps.investorMap.get(id) || '').filter(Boolean)
    : [];

  const industryIds = record.fields['Company Industry (Lookup)'] || [];
  const industryName = Array.isArray(industryIds) && industryIds.length > 0
    ? maps.industryMap.get(industryIds[0]) || ''
    : '';

  const { location, remoteFirst } = extractLocation(record);

  return {
    id: record.id,
    jobId: record.fields['Job ID'] || '',
    title: record.fields['Title'] || '',
    company: companyName,
    companyUrl,
    investors: investorNames,
    location,
    remoteFirst,
    functionName: funcName,
    industry: industryName,
    datePosted: record.fields['Date Posted'] || record.createdTime || '',
    jobUrl: record.fields['Job URL'] || '',
    applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
    salary: record.fields['Salary'] || '',
        departmentName: FUNCTION_TO_DEPARTMENT[funcName] || 'Operations & Admin',
        firstSeenAt: record.createdTime || '',
  };
}

// ---------------------------------------------------------------------------
// Main data fetching functions
// ---------------------------------------------------------------------------

export async function getJobs(filters?: {
  functionName?: string;
  industry?: string;
  investor?: string;
  location?: string;
  remoteOnly?: boolean;
  search?: string;
  company?: string;
  page?: number;
}): Promise<JobsResult> {
  const pageSize = 25;
  const page = filters?.page || 1;

  try {
    const formulaParts: string[] = [];

    if (filters?.search) {
      const s = filters.search.replace(/'/g, "\\'");
      formulaParts.push('OR(FIND(LOWER(\'' + s + '\'), LOWER({Title})), FIND(LOWER(\'' + s + '\'), LOWER(ARRAYJOIN({Companies}))))');
    }

    const filterByFormula = formulaParts.length > 0
      ? 'AND(' + formulaParts.join(', ') + ')'
      : '';

    // Fetch job records and lookup maps in parallel for better latency
    const [allRecordsResult, maps] = await Promise.all([
      fetchAirtable(TABLES.jobs, {
        filterByFormula,
        sort: [{ field: 'Created Time', direction: 'desc' }],
        maxRecords: 100,
        fields: JOB_FIELDS,
      }),
      buildLookupMaps(),
    ]);

    let jobs = allRecordsResult.records.map(record => mapRecordToJob(record, maps));

    // Client-side filters: these fields are derived from linked records / Raw JSON
    // and can't be pushed into Airtable's filterByFormula efficiently.
    if (filters?.functionName) {
      const selected = filters.functionName.split(',').map(f => f.trim().toLowerCase());
      jobs = jobs.filter(job =>
        selected.some(fn => job.functionName.toLowerCase() === fn)
      );
    }

    if (filters?.industry) {
      const selected = filters.industry.split(',').map(i => i.trim().toLowerCase());
      jobs = jobs.filter(job =>
        selected.some(ind => job.industry.toLowerCase() === ind)
      );
    }

    if (filters?.investor) {
      const selected = filters.investor.split(',').map(inv => inv.trim().toLowerCase());
      jobs = jobs.filter(job =>
        job.investors.some(inv =>
          selected.some(s => inv.toLowerCase() === s)
        )
      );
    }

    if (filters?.company) {
      jobs = jobs.filter(job =>
        job.company.toLowerCase().includes(filters.company!.toLowerCase())
      );
    }

    if (filters?.location) {
      jobs = jobs.filter(job =>
        job.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.remoteOnly) {
      jobs = jobs.filter(job =>
        job.remoteFirst || job.location.toLowerCase().includes('remote')
      );
    }

    const totalCount = jobs.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedJobs = jobs.slice(startIndex, startIndex + pageSize);

    return { jobs: paginatedJobs, totalCount, page, pageSize, totalPages };
  } catch (error) {
    console.error('getJobs error:', error);
    return { jobs: [], totalCount: 0, page, pageSize, totalPages: 0 };
  }
}

// ── Feed scoring helpers ───────────────────────────────────────────

/** Freshness score (0–100) based on firstSeenAt, not ATS published date */
function computeFreshness(job: Job, now: number): number {
  const seen = job.firstSeenAt ? new Date(job.firstSeenAt).getTime() : 0;
  if (!seen) return 10;
  const daysOld = (now - seen) / (1000 * 60 * 60 * 24);
  if (daysOld <= 1) return 100;
  if (daysOld <= 3) return 85;
  if (daysOld <= 7) return 70;
  if (daysOld <= 14) return 50;
  if (daysOld <= 30) return 30;
  return 10;
}

/** High-interest departments get a boost */
const DEPT_INTEREST: Record<string, number> = {
  'Engineering': 15,
  'AI & Research': 15,
  'Product': 12,
  'Sales & GTM': 10,
  'Design': 8,
  'Marketing': 8,
  'Customer Success & Support': 5,
  'People & Talent': 5,
  'Finance & Legal': 3,
  'Operations & Admin': 3,
};

/** Interest score (0–50) from brand strength + function + salary */
function computeInterest(job: Job): number {
  let score = 0;
  // Brand proxy: more investors = stronger brand (capped at 20)
  const investorCount = job.investors?.length || 0;
  score += Math.min(investorCount * 5, 20);
  // Department interest
  score += DEPT_INTEREST[job.departmentName] || 5;
  // Salary present is a signal of a well-structured listing
  if (job.salary) score += 5;
  return score;
}

interface ScoredJob {
  job: Job;
  freshness: number;
  interest: number;
  overall: number;
}

/**
 * Interleave ALL jobs with diversity constraints.
 * Multiple passes: each pass allows 1 per company. This round-robins
 * through companies so the same company never appears back-to-back
 * and is maximally spread across pages.
 */
function diversifyAll(sorted: ScoredJob[]): Job[] {
  const MAX_PER_COMPANY_PER_PASS = 1;

  const result: Job[] = [];
  let remaining = [...sorted];

  while (remaining.length > 0) {
    const companyCounts = new Map<string, number>();
    const deferred: ScoredJob[] = [];

    for (const item of remaining) {
      const co = item.job.company;
      const count = companyCounts.get(co) || 0;

      if (count >= MAX_PER_COMPANY_PER_PASS) {
        deferred.push(item);
        continue;
      }

      result.push(item.job);
      companyCounts.set(co, count + 1);
    }

    remaining = deferred;
  }

  return result;
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [functionRecords, investorRecords, industryRecords, companyRecords] = await Promise.all([
      fetchAirtable(TABLES.functions, { fields: ['Function', 'Department (Primary)'] }).catch(() => ({ records: [] })),
    fetchAllAirtable(TABLES.investors, { fields: ['Firm Name'] }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
    fetchAllAirtable(TABLES.companies, { fields: ['Company', 'URL'] }),
  ]);

  const functions = functionRecords.records
    .map(r => r.fields['Function'])
    .filter(Boolean)
    .sort();

  const departments = Array.from(new Set(
    functionRecords.records
      .map(r => r.fields['Department (Primary)'])
      .filter(Boolean)
  )).sort();

  const investors = investorRecords
    .map(r => r.fields['Firm Name'])
    .filter(Boolean)
    .sort();

  const industries = industryRecords.records
    .map(r => r.fields['Industry Name'])
    .filter(Boolean)
    .sort();

  const companyData: CompanyTickerItem[] = companyRecords
    .map(r => ({
      name: r.fields['Company'] as string || '',
      url: r.fields['URL'] as string || undefined,
    }))
    .filter(c => c.name);

  const companies = companyData.map(c => c.name).sort();

  const jobRecords = await fetchAirtable(TABLES.jobs, {
    fields: ['Location'],
    maxRecords: 100,
  });

  const locationSet = new Set<string>();
  jobRecords.records.forEach(r => {
    const country = r.fields['Location'];
    if (country) locationSet.add(country);
  });

  const locations = Array.from(locationSet).sort();

  return { functions, departments, locations, investors, industries, companies, companyData };
}

// Fetch a single job by its Airtable record ID
export async function getJobById(id: string): Promise<(Job & { description: string }) | null> {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Missing Airtable environment variables');
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.jobs)}/${id}`;
  const response = await airtableLimit(() =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
  );

  // Read body only once to avoid Response.clone error
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.status}`);
  }

  const record = JSON.parse(text);

  if (!record || !record.fields) {
    return null;
  }

  const maps = await buildLookupMaps();
  const job = mapRecordToJob(record, maps);

  // Extract job description from multiple sources
  let description = '';
  if (record.fields['content']) {
    description = record.fields['content'] as string;
  }
  if (!description && record.fields['Raw JSON']) {
    try {
      const rawData = JSON.parse(record.fields['Raw JSON'] as string);
      description = rawData?.content || rawData?.description || '';
    } catch (e) {
      // Ignore parse errors
    }
  }
  if (!description) {
    description = (record.fields['Job Description'] as string) || '';
  }

  return { ...job, description };
}


// Company interface
export interface Company {
  id: string;
  name: string;
  slug: string;
  url?: string;
  about?: string;
  industry?: string;
  stage?: string;
  size?: string;
  hqLocation?: string;
  totalRaised?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  investors: string[];
  jobCount: number;
}

// Fetch a single company by slug
// Uses Airtable Slug formula field for O(1) lookup instead of scanning all companies
export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  // Look up company directly by Slug formula field (1 API call instead of 14+)
  const escaped = slug.replace(/'/g, "\\'");
  const companyResults = await fetchAirtable(TABLES.companies, {
    filterByFormula: `{Slug}='${escaped}'`,
    maxRecords: 1,
    fields: ['Company', 'URL', 'VCs', 'About', 'Stage', 'Size', 'HQ Location', 'Total Raised', 'LinkedIn URL', 'Twitter URL'],
  });

  const company = companyResults.records[0];
  if (!company) {
    return null;
  }

  const companyName = company.fields['Company'] as string || '';

  // Resolve investor names from the company's VCs linked field directly,
  // instead of the expensive all-jobs scan that was here before.
  const vcIds = company.fields['VCs'] || [];
  let investorNames: string[] = [];

  if (Array.isArray(vcIds) && vcIds.length > 0) {
    // Fetch all investors to resolve IDs to names (>100 investors, must paginate)
    const investorRecords = await fetchAllAirtable(TABLES.investors, {
      fields: ['Firm Name'],
    });
    const investorMap = new Map<string, string>();
    investorRecords.forEach(r => {
      investorMap.set(r.id, r.fields['Firm Name'] || '');
    });
    investorNames = vcIds
      .map((id: string) => investorMap.get(id) || '')
      .filter(Boolean);
  }

  // Get job count for this specific company using filterByFormula
  const escapedName = companyName.replace(/"/g, '\\"');
  const jobCountResult = await fetchAirtable(TABLES.jobs, {
    filterByFormula: `FIND("${escapedName}", ARRAYJOIN({Companies}, "||") & "")`,
    fields: ['Job ID'],
  });

  return {
    id: company.id,
    name: companyName,
    slug: toSlug(companyName),
    url: company.fields['URL'] as string || undefined,
    about: company.fields['About'] as string || undefined,
    stage: company.fields['Stage'] as string || undefined,
    size: company.fields['Size'] as string || undefined,
    hqLocation: company.fields['HQ Location'] as string || undefined,
    totalRaised: company.fields['Total Raised'] as string || undefined,
    linkedinUrl: company.fields['LinkedIn URL'] as string || undefined,
    twitterUrl: company.fields['Twitter URL'] as string || undefined,
    investors: investorNames,
    jobCount: jobCountResult.records.length,
  };
}

// Get jobs by company name
export async function getJobsByCompany(companyName: string): Promise<Job[]> {
  return getJobsForCompanyNames([companyName]);
}

// Investor interface
export interface Investor {
  id: string;
  name: string;
  slug: string;
  bio: string;
  location: string;
  website?: string;
  linkedinUrl?: string;
  companies: Array<{ id: string; name: string; slug: string }>;
  jobCount: number;
}

// Fetch a single investor by slug
export async function getInvestorBySlug(slug: string): Promise<Investor | null> {
  // Fetch ALL investors — there are 201+, must paginate past 100-record limit
  const investorRecords = await fetchAllAirtable(TABLES.investors, {
    fields: ['Firm Name', 'Bio', 'Location', 'Website', 'LinkedIn'],
  });

  const investor = investorRecords.find(r => {
    const name = r.fields['Firm Name'] as string || '';
    const investorSlug = toSlug(name);
    return investorSlug === slug;
  });

      if (!investor) {  
  return null;
  }

  const investorName = investor.fields['Firm Name'] as string || '';
  const investorBio = investor.fields['Bio'] as string || '';
  const investorLocation = investor.fields['Location'] as string || '';
  const investorWebsite = investor.fields['Website'] as string || '';
  const investorLinkedin = investor.fields['LinkedIn'] as string || '';
  const investorId = investor.id;

  // Fetch ALL companies with their VCs field to find portfolio companies
  // This catches companies even if they don't have jobs synced yet
  const companyRecords = await fetchAllAirtable(TABLES.companies, {
    fields: ['Company', 'VCs'],
  });

  // Build company map and find companies directly linked to this investor
  const companyMap = new Map<string, string>();
  const companySet = new Map<string, { id: string; name: string; slug: string }>();

  companyRecords.forEach(r => {
    const companyName = r.fields['Company'] as string || '';
    companyMap.set(r.id, companyName);

    // Check if this company is backed by the target investor
    const companyVCs = r.fields['VCs'] || [];
    if (Array.isArray(companyVCs) && companyVCs.includes(investorId)) {
      if (companyName && !companySet.has(r.id)) {
        companySet.set(r.id, {
          id: r.id,
          name: companyName,
          slug: toSlug(companyName),
        });
      }
    }
  });

  // Skip the expensive ALL-jobs scan — the page will get real job count from getJobsForCompanyIds
  return {
    id: investorId,
    name: investorName,
    slug: toSlug(investorName),
    bio: investorBio,
    location: investorLocation,
    website: investorWebsite || undefined,
    linkedinUrl: investorLinkedin || undefined,
    companies: Array.from(companySet.values()),
    jobCount: 0, // Will be replaced by actual filtered jobs count in the component
  };
}

// Industry interface
export interface Industry {
  id: string;
  name: string;
  slug: string;
  jobCount: number;
  companies: Array<{ id: string; name: string; slug: string }>;
}

// Fetch a single industry by slug
export async function getIndustryBySlug(slug: string): Promise<Industry | null> {
  // Fetch all industries
  const industryRecords = await fetchAirtable(TABLES.industries, {
    fields: ['Industry Name'],
  });

  const industry = industryRecords.records.find(r => {
    const name = r.fields['Industry Name'] as string || '';
    const industrySlug = toSlug(name);
    return industrySlug === slug;
  });

  if (!industry) {
    return null;
  }

  const industryName = industry.fields['Industry Name'] as string || '';
  const industryId = industry.id;

  // Fetch ALL companies with their Industry field to find companies in this industry
  // This catches companies even if they don't have jobs synced yet
  const companyRecords = await fetchAllAirtable(TABLES.companies, {
    fields: ['Company', 'Industry'],
  });

  // Build company map and find companies directly linked to this industry
  const companyMap = new Map<string, string>();
  const companySet = new Map<string, { id: string; name: string; slug: string }>();

  companyRecords.forEach(r => {
    const companyName = r.fields['Company'] as string || '';
    companyMap.set(r.id, companyName);

    // Check if this company is linked to the target industry
    const companyIndustries = r.fields['Industry'] || [];
    if (Array.isArray(companyIndustries) && companyIndustries.includes(industryId)) {
      if (companyName && !companySet.has(r.id)) {
        companySet.set(r.id, {
          id: r.id,
          name: companyName,
          slug: toSlug(companyName),
        });
      }
    }
  });

  // Skip the expensive ALL-jobs scan — the page will get real job count from getJobsForCompanyIds
  return {
    id: industryId,
    name: industryName,
    slug: toSlug(industryName),
    jobCount: 0, // Will be replaced by actual filtered jobs count in the component
    companies: Array.from(companySet.values()),
  };
}

// Fetch ALL jobs for a set of company names (used by industry/investor pages)
// Uses Airtable filterByFormula — linked record fields resolve to names in formulas, NOT record IDs
export async function getJobsForCompanyNames(companyNames: string[]): Promise<Job[]> {
  if (companyNames.length === 0) return [];

  // Batch company names into chunks of 30 to keep formula under URL length limits
  const BATCH_SIZE = 30;
  const allMatchingRecords: AirtableRecord[] = [];

  for (let i = 0; i < companyNames.length; i += BATCH_SIZE) {
    const batch = companyNames.slice(i, i + BATCH_SIZE);
    const filterParts = batch.map(name => {
      const escaped = name.replace(/"/g, '\\"');
      return `FIND("${escaped}", ARRAYJOIN({Companies}, "||") & "")`;
    });
    const filterByFormula = filterParts.length === 1
      ? filterParts[0]
      : `OR(${filterParts.join(', ')})`;

    const records = await fetchAllAirtable(TABLES.jobs, {
      filterByFormula,
      sort: [{ field: 'Created Time', direction: 'desc' }],
      fields: JOB_FIELDS,
    });
    allMatchingRecords.push(...records);
  }

  // Deduplicate by record ID (batches may overlap)
  const seen = new Set<string>();
  const uniqueRecords = allMatchingRecords.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const maps = await buildLookupMaps();

  return uniqueRecords.map(record => mapRecordToJob(record, maps));
}

// Keep old name as alias for any remaining references
export const getJobsForCompanyIds = getJobsForCompanyNames;

// ── Directory page data ─────────────────────────────────────────────

export interface CompanyDirectoryItem {
  name: string;
  slug: string;
  url?: string;
  stage?: string;
  industry?: string;
  investors: string[];
  jobCount: number;
}

export async function getAllCompaniesForDirectory(): Promise<CompanyDirectoryItem[]> {
  const [companyRecords, investorRecords, industryRecords] = await Promise.all([
    fetchAllAirtable(TABLES.companies, {
      fields: ['Company', 'URL', 'VCs', 'Stage', 'Industry', 'Job Listings'],
    }),
    fetchAllAirtable(TABLES.investors, {
      fields: ['Firm Name'],
    }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
  ]);

  const investorMap = new Map<string, string>();
  investorRecords.forEach(r => {
    investorMap.set(r.id, r.fields['Firm Name'] as string || '');
  });

  const industryMap = new Map<string, string>();
  industryRecords.records.forEach(r => {
    industryMap.set(r.id, r.fields['Industry Name'] as string || '');
  });

  return companyRecords
    .map(r => {
      const name = r.fields['Company'] as string || '';
      const vcIds = (r.fields['VCs'] || []) as string[];
      const industryIds = (r.fields['Industry'] || []) as string[];
      const jobIds = (r.fields['Job Listings'] || []) as string[];
      return {
        name,
        slug: toSlug(name),
        url: r.fields['URL'] as string || undefined,
        stage: r.fields['Stage'] as string || undefined,
        industry: industryIds.length > 0 ? industryMap.get(industryIds[0]) || undefined : undefined,
        investors: vcIds.map(id => investorMap.get(id) || '').filter(Boolean),
        jobCount: jobIds.length,
      };
    })
    .filter(c => c.name)
    .sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name));
}

export interface InvestorDirectoryItem {
  name: string;
  slug: string;
  url?: string;
  companyCount: number;
  industries: string[];
  stages: string[];
}

export async function getAllInvestorsForDirectory(): Promise<InvestorDirectoryItem[]> {
  const [investorRecords, companyRecords, industryRecords] = await Promise.all([
    fetchAllAirtable(TABLES.investors, {
      fields: ['Firm Name', 'Website'],
    }),
    fetchAllAirtable(TABLES.companies, {
      fields: ['VCs', 'Stage', 'Industry'],
    }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
  ]);

  // Build industry name lookup
  const industryMap = new Map<string, string>();
  industryRecords.records.forEach(r => {
    industryMap.set(r.id, r.fields['Industry Name'] as string || '');
  });

  // Count portfolio companies and collect industries/stages per investor
  const portfolioCounts = new Map<string, number>();
  const investorIndustries = new Map<string, Set<string>>();
  const investorStages = new Map<string, Set<string>>();

  companyRecords.forEach(r => {
    const vcIds = (r.fields['VCs'] || []) as string[];
    const stage = r.fields['Stage'] as string || '';
    const industryIds = (r.fields['Industry'] || []) as string[];
    const industryNames = industryIds.map(id => industryMap.get(id) || '').filter(Boolean);

    for (const id of vcIds) {
      portfolioCounts.set(id, (portfolioCounts.get(id) || 0) + 1);

      if (!investorIndustries.has(id)) investorIndustries.set(id, new Set());
      for (const ind of industryNames) investorIndustries.get(id)!.add(ind);

      if (stage) {
        if (!investorStages.has(id)) investorStages.set(id, new Set());
        investorStages.get(id)!.add(stage);
      }
    }
  });

  return investorRecords
    .map(r => {
      const name = r.fields['Firm Name'] as string || '';
      const url = r.fields['Website'] as string || undefined;
      return {
        name,
        slug: toSlug(name),
        url,
        companyCount: portfolioCounts.get(r.id) || 0,
        industries: Array.from(investorIndustries.get(r.id) || []),
        stages: Array.from(investorStages.get(r.id) || []),
      };
    })
    .filter(i => i.name)
    .sort((a, b) => b.companyCount - a.companyCount || a.name.localeCompare(b.name));
}

// Get featured jobs — placeholder until monetization fields are re-added
export async function getFeaturedJobs(): Promise<Job[]> {
  const [allRecordsResult, maps] = await Promise.all([
    fetchAirtable(TABLES.jobs, {
      filterByFormula: 'FALSE()',
      sort: [{ field: 'Created Time', direction: 'desc' }],
      maxRecords: 10,
      fields: JOB_FIELDS,
    }),
    buildLookupMaps(),
  ]);

  return allRecordsResult.records.map(record => mapRecordToJob(record, maps));
}

// Get organic jobs sorted by Created Time
export async function getOrganicJobs(page: number = 1, pageSize: number = 25): Promise<JobsResult> {
  const [allRecordsResult, maps] = await Promise.all([
    fetchAirtable(TABLES.jobs, {
      sort: [{ field: 'Created Time', direction: 'desc' }],
      maxRecords: 100,
      fields: JOB_FIELDS,
    }),
    buildLookupMaps(),
  ]);

  const jobs = allRecordsResult.records.map(record => mapRecordToJob(record, maps));

  const totalCount = jobs.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedJobs = jobs.slice(startIndex, startIndex + pageSize);

  return {
    jobs: paginatedJobs,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

// Get stats for the homepage
export async function getStats(): Promise<{ jobCount: number; companyCount: number; investorCount: number }> {
  // Companies and investors are small enough to count exactly via pagination.
  // Jobs table (16k+) is too large to paginate within Vercel's 10s timeout,
  // so we fetch just the first page. A pre-computed counter would fix this.
  const [jobResult, companyRecords, investorRecords] = await Promise.all([
    fetchAirtable(TABLES.jobs, { fields: ['Job ID'] }),
    fetchAllAirtable(TABLES.companies, { fields: ['Company'] }),
    fetchAllAirtable(TABLES.investors, { fields: ['Firm Name'] }),
  ]);

  return {
    jobCount: jobResult.records.length,
    companyCount: companyRecords.length,
    investorCount: investorRecords.length,
  };
}

// ── Recently funded / recently added companies ──────────────────────
// Returns companies sorted by most recently created in Airtable.
// When we add a funding_rounds table, this will switch to use that.
export interface RecentCompany {
  id: string;
  name: string;
  slug: string;
  stage?: string;
  industry?: string;
  investors: string[];
  jobCount: number;
  url?: string;
}

export async function getRecentCompanies(limit: number = 8): Promise<RecentCompany[]> {
  // Lightweight: 2 API calls max (companies + investors). No job lookups.
  const [companyResults, investorRecords] = await Promise.all([
    fetchAirtable(TABLES.companies, {
      sort: [{ field: 'Created Time', direction: 'desc' }],
      maxRecords: limit,
      fields: ['Company', 'URL', 'VCs', 'Stage', 'Slug'],
    }),
    fetchAllAirtable(TABLES.investors, {
      fields: ['Firm Name'],
    }),
  ]);

  const investorNameMap = new Map<string, string>();
  investorRecords.forEach(r => {
    investorNameMap.set(r.id, r.fields['Firm Name'] as string || '');
  });

  return companyResults.records
    .map(r => {
      const name = r.fields['Company'] as string || '';
      const vcIds = (r.fields['VCs'] || []) as string[];
      return {
        id: r.id,
        name,
        slug: toSlug(name),
        stage: r.fields['Stage'] as string || undefined,
        industry: undefined,
        investors: vcIds.map(id => investorNameMap.get(id) || '').filter(Boolean),
        jobCount: 0, // Skip job counts to stay within Vercel timeout
        url: r.fields['URL'] as string || undefined,
      };
    })
    .filter(c => c.name)
    .slice(0, limit);
}
