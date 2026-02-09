import { parseCountry, parseWorkMode, matchesPostedFilter } from './location-parser';

// Infer function from job title when Function field is empty.
// Categories MUST match the Airtable Function table exactly so the client-side
// fallback produces the same labels as the /api/backfill-functions endpoint.
// These are granular function names — the 10-segment analytics rollup
// (Sales & GTM, Marketing, Engineering, etc.) lives in Airtable's
// Department column on the Function table.
// Order matters — specific roles first, broad catch-alls last.
function inferFunction(title: string): string {
  const rules: [RegExp, string][] = [
    [/\bsolutions? engineer|sales engineer|pre.?sales/i, 'Solutions Engineering'],
    [/\bdevrel|developer relation|developer advocate|developer evangel/i, 'Developer Relations'],
    [/\brevenue op|rev\s?ops/i, 'Revenue Operations'],
    [/\bbusiness develop|partnerships?|partner manager|bd |strategic allianc/i, 'BD & Partnerships'],
    [/\bcustomer success|customer support|customer experience|support engineer|client success/i, 'Customer Success'],
    [/\bproduct design|ux|ui designer|graphic design|brand design|creative director|ux research/i, 'Product Design / UX'],
    [/\bproduct manag|head of product|vp.*product|director.*product|product lead|product owner|product strateg/i, 'Product Management'],
    [/\bdata scien|machine learn|\bml\b|\bai\b|research scien|deep learn|nlp|computer vision|llm/i, 'AI & Research'],
    [/\bengineer|software|developer|sre|devops|infrastructure|platform|full.?stack|backend|frontend|ios\b|android|mobile dev|architect/i, 'Engineering'],
    [/\bsales|account exec|sdr\b|bdr\b|account manag|closing|quota/i, 'Sales'],
    [/\bmarketing|growth|demand gen|content market|seo\b|brand manag|comms\b|communications|social media|pr manager/i, 'Marketing'],
    [/\brecruit|talent|people ops|human resource|\bhr\b|people partner|head of people/i, 'People'],
    [/\bfinance|account(ant|ing)|controller|tax\b|treasury|financial|fp&a|cfo/i, 'Finance & Accounting'],
    [/\boperation|chief of staff|program manag|project manag|business ops|strategy|bizops/i, 'Business Operations'],
    [/\blegal|counsel|compliance|regulatory|policy/i, 'Legal'],
    [/\bsecurity|infosec|cyber|penetration/i, 'Engineering'],
    [/\bdata analy|business intel|analytics/i, 'AI & Research'],
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
  functions: 'tbl94EXkSIEmhqyYy',
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

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
        cache: 'no-store',
  });

  // Read body only once to avoid Response.clone error
  const text = await response.text();
  
  if (!response.ok) {
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

export interface FilterOptions {
  functions: string[];
  departments: string[];
  locations: string[];
  investors: string[];
  industries: string[];
  companies: string[];
}

export interface JobsResult {
  jobs: Job[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getJobs(filters?: {
  functionName?: string;
  department?: string;
  industry?: string;
  investor?: string;
  location?: string;
  country?: string;
  workMode?: string;
  posted?: string;
  remoteOnly?: boolean;
  search?: string;
  company?: string;
  page?: number;
  sort?: 'featured' | 'recent';
}): Promise<JobsResult> {
  const pageSize = 25;
  const page = filters?.page || 1;

  const formulaParts: string[] = [];

  if (filters?.search) {
    const s = filters.search.replace(/'/g, "\\'");
    formulaParts.push('OR(FIND(LOWER(\'' + s + '\'), LOWER({Title})), FIND(LOWER(\'' + s + '\'), LOWER(ARRAYJOIN({Companies}))))');
  }


  const filterByFormula = formulaParts.length > 0
    ? 'AND(' + formulaParts.join(', ') + ')'
    : '';

  // Fetch up to 500 jobs (paginated — Airtable returns max 100 per page)
  const jobFields = [
    'Job ID', 'Title', 'Companies', 'Function', 'Location',
    'Created Time', 'Job URL', 'Apply URL', 'Salary', 'Investors',
    'Company Industry (Lookup)', 'Raw JSON',
  ];
  const TARGET_RECORDS = 500;
  const allRecords: AirtableRecord[] = [];
  let jobOffset: string | undefined;
  do {
    const batch = await fetchAirtable(TABLES.jobs, {
      filterByFormula,
      sort: [{ field: 'Created Time', direction: 'desc' }],
      fields: jobFields,
      offset: jobOffset,
    });
    allRecords.push(...batch.records);
    jobOffset = batch.offset;
    if (allRecords.length >= TARGET_RECORDS) break;
    if (jobOffset) await new Promise(r => setTimeout(r, 200)); // rate limit
  } while (jobOffset);

  const functionRecords = await fetchAirtable(TABLES.functions, {
    fields: ['Function', 'Department (Primary)'],
  });
  const functionMap = new Map<string, string>();
  const departmentMap = new Map<string, string>();
  functionRecords.records.forEach(r => {
    functionMap.set(r.id, r.fields['Function'] || '');
    departmentMap.set(r.id, r.fields['Department (Primary)'] || '');
  });

  // Fetch all company records with pagination
  const companyMap = new Map<string, string>();
  const companyUrlMap = new Map<string, string>();
  let companyOffset: string | undefined;
  do {
    const companyRecords = await fetchAirtable(TABLES.companies, {
      fields: ['Company', 'URL'],
      offset: companyOffset,
    });
    companyRecords.records.forEach(r => {
      companyMap.set(r.id, (r.fields['Company'] as string) || '');
      companyUrlMap.set(r.id, (r.fields['URL'] as string) || '');
    });
    companyOffset = companyRecords.offset;
  } while (companyOffset);

  const investorRecords = await fetchAirtable(TABLES.investors, {
    fields: ['Company'],
  });
  const investorMap = new Map<string, string>();
  investorRecords.records.forEach(r => {
    investorMap.set(r.id, r.fields['Company'] || '');
  });

  const industryRecords = await fetchAirtable(TABLES.industries, {
    fields: ['Industry Name'],
  });
  const industryMap = new Map<string, string>();
  industryRecords.records.forEach(r => {
    industryMap.set(r.id, r.fields['Industry Name'] || '');
  });

  let jobs = allRecords.map(record => {
    const companyField = record.fields['Companies'];
    let companyName = 'Unknown';
    let companyUrl = '';
    
    if (typeof companyField === 'string') {
      // Text field - use directly
      companyName = companyField;
    } else if (Array.isArray(companyField) && companyField.length > 0) {
      // Linked record field - look up in map
      companyName = companyMap.get(companyField[0]) || 'Unknown';
      companyUrl = companyUrlMap.get(companyField[0]) || '';
    }

    const functionIds = record.fields['Function'] || [];
    let funcName = functionIds.length > 0 ? functionMap.get(functionIds[0]) || '' : '';
    let deptName = functionIds.length > 0 ? departmentMap.get(functionIds[0]) || '' : '';
    if (!funcName) {
      funcName = inferFunction(record.fields['Title'] as string || '');
    }
    if (!deptName) {
      deptName = FUNCTION_TO_DEPARTMENT[funcName] || '';
    }

    const investorIds = record.fields['Investors'] || [];
    const investorNames = Array.isArray(investorIds)
      ? investorIds.map(id => investorMap.get(id) || '').filter(Boolean)
      : [];

    const industryIds = record.fields['Company Industry (Lookup)'] || [];
    const industryName = Array.isArray(industryIds) && industryIds.length > 0
      ? industryMap.get(industryIds[0]) || ''
      : '';

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
        // Ignore parse errors
      }
    }

    // Fallback to Location field if Raw JSON didn't have location
    if (!location) {
      const airtableLocation = record.fields['Location'] as string || '';
      // Only use Airtable Location field if it's a real city (not Remote/Hybrid)
      if (airtableLocation && !['remote', 'hybrid', 'on-site', 'onsite'].includes(airtableLocation.toLowerCase())) {
        location = airtableLocation;
      } else if (remoteFirst) {
        location = 'Remote';
      }
    }

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
      departmentName: deptName,
      industry: industryName,
      datePosted: record.fields['Created Time'] || record.createdTime || '',
      firstSeenAt: (record.fields['Created Time'] as string) || record.createdTime || '',
      jobUrl: record.fields['Job URL'] || '',
      applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
      salary: record.fields['Salary'] || '',
    };
  });

  // ── Department filter (new multi-select or legacy functionName) ──
  const deptFilter = filters?.department || filters?.functionName;
  if (deptFilter) {
    const selectedDepts = deptFilter.split(',').map(f => f.trim().toLowerCase());
    jobs = jobs.filter(job =>
      selectedDepts.some(d => job.departmentName.toLowerCase() === d)
    );
  }

  // ── Industry filter ────────────────────────────────────────────
  if (filters?.industry) {
    const selectedIndustries = filters.industry.split(',').map(i => i.trim().toLowerCase());
    jobs = jobs.filter(job =>
      selectedIndustries.some(ind => job.industry.toLowerCase() === ind)
    );
  }

  // ── Investor filter ────────────────────────────────────────────
  if (filters?.investor) {
    const selectedInvestors = filters.investor.split(',').map(inv => inv.trim().toLowerCase());
    jobs = jobs.filter(job =>
      job.investors.some(inv =>
        selectedInvestors.some(selected => inv.toLowerCase() === selected)
      )
    );
  }

  // ── Country filter (uses location parser) ──────────────────────
  if (filters?.country) {
    const selectedCountries = filters.country.split(',').map(c => c.trim().toLowerCase());
    jobs = jobs.filter(job => {
      const jobCountry = parseCountry(job.location).toLowerCase();
      return selectedCountries.some(c => jobCountry === c);
    });
  }

  // ── Work mode filter ───────────────────────────────────────────
  if (filters?.workMode) {
    const selectedModes = filters.workMode.split(',').map(m => m.trim().toLowerCase());
    jobs = jobs.filter(job => {
      const mode = parseWorkMode(job.location, job.remoteFirst);
      return selectedModes.includes(mode);
    });
  }

  // ── Posted date filter ─────────────────────────────────────────
  if (filters?.posted && filters.posted !== 'all') {
    jobs = jobs.filter(job => matchesPostedFilter(job.datePosted, filters.posted!));
  }

  // ── Legacy: company name filter ────────────────────────────────
  if (filters?.company) {
    jobs = jobs.filter(job =>
      job.company.toLowerCase().includes(filters.company!.toLowerCase())
    );
  }

  // ── Legacy: location string filter ─────────────────────────────
  if (filters?.location) {
    jobs = jobs.filter(job =>
      job.location.toLowerCase().includes(filters.location!.toLowerCase())
    );
  }

  // ── Legacy: remote toggle ──────────────────────────────────────
  if (filters?.remoteOnly) {
    jobs = jobs.filter(job =>
      job.remoteFirst || job.location.toLowerCase().includes('remote')
    );
  }

  // ── Feed scoring & diversity ─────────────────────────────────────
  const sortMode = filters?.sort || 'featured';

  if (sortMode === 'featured') {
    // Score every job
    const now = Date.now();
    const scored = jobs.map(job => ({
      job,
      freshness: computeFreshness(job, now),
      interest: computeInterest(job),
    })).map(s => ({
      ...s,
      overall: s.freshness + s.interest,
    }));

    // Sort by overall score (deterministic tie-break on id)
    scored.sort((a, b) => b.overall - a.overall || a.job.id.localeCompare(b.job.id));

    // Interleave ALL jobs with diversity constraints (not just first page)
    jobs = diversifyAll(scored);
  }
  // else 'recent' — keep existing Created Time desc order from Airtable

  const totalCount = jobs.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Paginate
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
    fetchAirtable(TABLES.functions, { fields: ['Function', 'Department (Primary)'] }),
    fetchAllAirtable(TABLES.investors, { fields: ['Company'] }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
    fetchAllAirtable(TABLES.companies, { fields: ['Company'] }),
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
    .map(r => r.fields['Company'])
    .filter(Boolean)
    .sort();

  const industries = industryRecords.records
    .map(r => r.fields['Industry Name'])
    .filter(Boolean)
    .sort();

  const companies = companyRecords
    .map(r => r.fields['Company'] as string)
    .filter(Boolean)
    .sort();

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

  return { functions, departments, locations, investors, industries, companies };
}

// Fetch a single job by its Airtable record ID
export async function getJobById(id: string): Promise<(Job & { description: string }) | null> {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Missing Airtable environment variables');
  }

  // Fetch the job record by ID
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.jobs)}/${id}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  });

  // Read body only once to avoid Response.clone error
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.status}`);
  }

  const record = JSON.parse(text);

  // Check if record exists and has fields
  if (!record || !record.fields) {
    return null;
  }

  // Fetch related data — use fetchAllAirtable for tables with 100+ records
  const [companyRecords, investorRecords, industryRecords, functionRecords] = await Promise.all([
    fetchAllAirtable(TABLES.companies, { fields: ['Company', 'URL'] }),
    fetchAllAirtable(TABLES.investors, { fields: ['Company'] }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
    fetchAirtable(TABLES.functions, { fields: ['Function', 'Department (Primary)'] }),
  ]);

  const companyMap = new Map<string, string>();
  const companyUrlMap = new Map<string, string>();
  companyRecords.forEach(r => {
    companyMap.set(r.id, (r.fields['Company'] as string) || '');
    companyUrlMap.set(r.id, (r.fields['URL'] as string) || '');
  });

  const investorMap = new Map<string, string>();
  investorRecords.forEach(r => {
    investorMap.set(r.id, r.fields['Company'] || '');
  });

  const industryMap = new Map<string, string>();
  industryRecords.records.forEach(r => {
    industryMap.set(r.id, r.fields['Industry Name'] || '');
  });

  const functionMap = new Map<string, string>();
  const departmentMap = new Map<string, string>();
  functionRecords.records.forEach(r => {
    functionMap.set(r.id, r.fields['Function'] || '');
    departmentMap.set(r.id, r.fields['Department (Primary)'] || '');
  });

  // Map the record to a Job object
  const companyField = record.fields['Companies'];
  let companyName = 'Unknown';
  let companyUrl = '';
  if (typeof companyField === 'string') {
    companyName = companyField;
  } else if (Array.isArray(companyField) && companyField.length > 0) {
    companyName = companyMap.get(companyField[0]) || 'Unknown';
    companyUrl = companyUrlMap.get(companyField[0]) || '';
  }

  const functionIds = record.fields['Function'] || [];
  let funcName = functionIds.length > 0 ? functionMap.get(functionIds[0]) || '' : '';
  let deptName = functionIds.length > 0 ? departmentMap.get(functionIds[0]) || '' : '';
  if (!funcName) {
    funcName = inferFunction(record.fields['Title'] as string || '');
  }
  if (!deptName) {
    deptName = FUNCTION_TO_DEPARTMENT[funcName] || '';
  }

  const investorIds = record.fields['Investors'] || [];
  const investorNames = Array.isArray(investorIds)
    ? investorIds.map(invId => investorMap.get(invId) || '').filter(Boolean)
    : [];

  const industryIds = record.fields['Company Industry (Lookup)'] || [];
  const industryName = Array.isArray(industryIds) && industryIds.length > 0
    ? industryMap.get(industryIds[0]) || ''
    : '';

  // Extract location from Raw JSON or Location field
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
      // Ignore parse errors
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

  // Extract job description — check multiple sources
  let description = '';

  // 1. Direct content field (raw HTML from ATS)
  if (record.fields['content']) {
    description = record.fields['content'] as string;
  }

  // 2. Raw JSON content/description
  if (!description && record.fields['Raw JSON']) {
    try {
      const rawData = JSON.parse(record.fields['Raw JSON'] as string);
      description = rawData?.content || rawData?.description || '';
    } catch (e) {
      // Ignore parse errors
    }
  }

  // 3. Job Description field
  if (!description) {
    description = (record.fields['Job Description'] as string) || '';
  }

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
    departmentName: deptName,
    industry: industryName,
    datePosted: record.fields['Created Time'] || record.createdTime || '',
    firstSeenAt: (record.fields['Created Time'] as string) || record.createdTime || '',
    jobUrl: record.fields['Job URL'] || '',
    applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
    salary: record.fields['Salary'] || '',
    description,
  };
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
export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Missing Airtable environment variables');
  }

  // Fetch ALL companies with pagination — fetchAirtable only returns 100 per page
  const companyRecords = await fetchAllAirtable(TABLES.companies, {
    fields: ['Company', 'URL', 'VCs', 'About', 'Stage', 'Size', 'HQ Location', 'Total Raised', 'LinkedIn URL', 'Twitter URL'],
  });

  const company = companyRecords.find(r => {
    const name = r.fields['Company'] as string || '';
    const companySlug = toSlug(name);
    return companySlug === slug;
  });

  if (!company) {
    return null;
  }

  // Fetch investors linked to this company
  const investorRecords = await fetchAirtable(TABLES.investors, {
    fields: ['Company'],
  });
  const investorMap = new Map<string, string>();
  investorRecords.records.forEach(r => {
    investorMap.set(r.id, r.fields['Company'] || '');
  });

  // Fetch jobs for this company to get investor links and job count
  const jobRecords = await fetchAirtable(TABLES.jobs, {
    fields: ['Companies', 'Investors'],
  });

    const investorSet = new Set<string>();
  jobRecords.records.forEach(job => {
    const invIds = job.fields['Investors'] || [];
    if (Array.isArray(invIds)) {
      invIds.forEach(id => {
        
        const name = investorMap.get(id);
        if (name) investorSet.add(name);
      });
    }
  });

  const companyName = company.fields['Company'] as string || '';

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
    investors: Array.from(investorSet),
    jobCount: jobRecords.records.length,
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
  // Fetch ALL investors (200+, need pagination)
  const allInvestors = await fetchAllAirtable(TABLES.investors, {
    fields: ['Company', 'Bio', 'Location', 'Website', 'LinkedIn'],
  });

  const investor = allInvestors.find(r => {
    const name = r.fields['Company'] as string || '';
    const investorSlug = toSlug(name);
    return investorSlug === slug;
  });

  if (!investor) {
    return null;
  }

  const investorName = investor.fields['Company'] as string || '';
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
  const jobFields = [
    'Job ID', 'Title', 'Companies', 'Function', 'Location',    'Created Time', 'Job URL', 'Apply URL', 'Salary', 'Investors',
    'Company Industry (Lookup)', 'Raw JSON',
  ];

  for (let i = 0; i < companyNames.length; i += BATCH_SIZE) {
    const batch = companyNames.slice(i, i + BATCH_SIZE);
    // Escape double quotes in company names for the Airtable formula
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
      fields: jobFields,
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

  // Build lookup maps in parallel
  const [functionRecords, investorRecords, industryRecords, companyRecords] = await Promise.all([
    fetchAirtable(TABLES.functions, { fields: ['Function', 'Department (Primary)'] }),
    fetchAirtable(TABLES.investors, { fields: ['Company'] }),
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
  const departmentMap = new Map<string, string>();
  functionRecords.records.forEach(r => {
    functionMap.set(r.id, r.fields['Function'] || '');
    departmentMap.set(r.id, r.fields['Department (Primary)'] || '');
  });

  const investorMap = new Map<string, string>();
  investorRecords.records.forEach(r => investorMap.set(r.id, r.fields['Company'] || ''));

  const industryMap = new Map<string, string>();
  industryRecords.records.forEach(r => industryMap.set(r.id, r.fields['Industry Name'] || ''));

  return uniqueRecords.map(record => {
    const companyField = record.fields['Companies'];
    let companyName = 'Unknown';
    let companyUrl = '';
    if (typeof companyField === 'string') {
      companyName = companyField;
    } else if (Array.isArray(companyField) && companyField.length > 0) {
      companyName = companyMap.get(companyField[0]) || 'Unknown';
      companyUrl = companyUrlMap.get(companyField[0]) || '';
    }

    const functionIds = record.fields['Function'] || [];
    let funcName = '';
    let deptName = '';
    if (Array.isArray(functionIds) && functionIds.length > 0) {
      funcName = functionMap.get(functionIds[0]) || (typeof functionIds[0] === 'string' ? functionIds[0] : '');
      deptName = departmentMap.get(functionIds[0]) || '';
    } else if (typeof functionIds === 'string') {
      funcName = functionMap.get(functionIds) || functionIds;
      deptName = departmentMap.get(functionIds) || '';
    }
    // Fallback: infer function from job title
    const jobTitle = (record.fields['Title'] as string) || '';
    if (!funcName) {
      funcName = inferFunction(jobTitle);
    }
    if (!deptName) {
      deptName = FUNCTION_TO_DEPARTMENT[funcName] || '';
    }

    const investorIds = record.fields['Investors'] || [];
    const investorNames = Array.isArray(investorIds)
      ? investorIds.map(id => investorMap.get(id) || '').filter(Boolean)
      : [];

    const indIds = record.fields['Company Industry (Lookup)'] || [];
    const industryName = Array.isArray(indIds) && indIds.length > 0
      ? industryMap.get(indIds[0]) || (typeof indIds[0] === 'string' ? indIds[0] : '')
      : '';

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
      } catch (e) {}
    }
    if (!location) {
      const airtableLocation = record.fields['Location'] as string || '';
      if (airtableLocation && !['remote', 'hybrid', 'on-site', 'onsite'].includes(airtableLocation.toLowerCase())) {
        location = airtableLocation;
      } else if (remoteFirst) {
        location = 'Remote';
      }
    }

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
      departmentName: deptName,
      industry: industryName,
      datePosted: record.fields['Created Time'] || record.createdTime || '',
      firstSeenAt: (record.fields['Created Time'] as string) || record.createdTime || '',
      jobUrl: record.fields['Job URL'] || '',
      applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
      salary: record.fields['Salary'] || '',
    };
  });
}

// Keep old name as alias for any remaining references
export const getJobsForCompanyIds = getJobsForCompanyNames;

// Get featured jobs — placeholder until monetization fields are re-added
export async function getFeaturedJobs(): Promise<Job[]> {
  const allRecordsResult = await fetchAirtable(TABLES.jobs, {
    filterByFormula: 'FALSE()',
      sort: [{ field: 'Created Time', direction: 'desc' }],
    maxRecords: 10,
    fields: [
      'Job ID', 'Title', 'Companies', 'Function', 'Location',      'Created Time', 'Job URL', 'Apply URL', 'Salary', 'Investors',
      'Company Industry (Lookup)', 'Raw JSON',
    ],
  });

  const [functionRecords, investorRecords, industryRecords] = await Promise.all([
    fetchAirtable(TABLES.functions, { fields: ['Function', 'Department (Primary)'] }),
    fetchAirtable(TABLES.investors, { fields: ['Company'] }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
  ]);

  // Build company map with pagination
  const companyMap = new Map<string, string>();
  const companyUrlMap = new Map<string, string>();
  let companyOffset: string | undefined;
  do {
    const companyRecords = await fetchAirtable(TABLES.companies, {
      fields: ['Company', 'URL'],
      offset: companyOffset,
    });
    companyRecords.records.forEach(r => {
      companyMap.set(r.id, (r.fields['Company'] as string) || '');
      companyUrlMap.set(r.id, (r.fields['URL'] as string) || '');
    });
    companyOffset = companyRecords.offset;
  } while (companyOffset);

  const functionMap = new Map<string, string>();
  const departmentMap = new Map<string, string>();
  functionRecords.records.forEach(r => {
    functionMap.set(r.id, r.fields['Function'] || '');
    departmentMap.set(r.id, r.fields['Department (Primary)'] || '');
  });

  const investorMap = new Map<string, string>();
  investorRecords.records.forEach(r => investorMap.set(r.id, r.fields['Company'] || ''));

  const industryMap = new Map<string, string>();
  industryRecords.records.forEach(r => industryMap.set(r.id, r.fields['Industry Name'] || ''));

  return allRecordsResult.records.map(record => {
    const companyField = record.fields['Companies'];
    let companyName = 'Unknown';
    let companyUrl = '';
    if (typeof companyField === 'string') {
      companyName = companyField;
    } else if (Array.isArray(companyField) && companyField.length > 0) {
      companyName = companyMap.get(companyField[0]) || 'Unknown';
      companyUrl = companyUrlMap.get(companyField[0]) || '';
    }

    const functionIds = record.fields['Function'] || [];
    let funcName = functionIds.length > 0 ? functionMap.get(functionIds[0]) || '' : '';
    let deptName = functionIds.length > 0 ? departmentMap.get(functionIds[0]) || '' : '';
    if (!funcName) {
      funcName = inferFunction(record.fields['Title'] as string || '');
    }
    if (!deptName) {
      deptName = FUNCTION_TO_DEPARTMENT[funcName] || '';
    }

    const investorIds = record.fields['Investors'] || [];
    const investorNames = Array.isArray(investorIds)
      ? investorIds.map(id => investorMap.get(id) || '').filter(Boolean)
      : [];

    const industryIds = record.fields['Company Industry (Lookup)'] || [];
    const industryName = Array.isArray(industryIds) && industryIds.length > 0
      ? industryMap.get(industryIds[0]) || ''
      : '';

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
          }
        }
      } catch (e) {}
    }
    if (!location) {
      const airtableLocation = record.fields['Location'] as string || '';
      if (airtableLocation && !['remote', 'hybrid', 'on-site', 'onsite'].includes(airtableLocation.toLowerCase())) {
        location = airtableLocation;
      } else if (remoteFirst) {
        location = 'Remote';
      }
    }

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
      departmentName: deptName,
      industry: industryName,
      datePosted: record.fields['Created Time'] || record.createdTime || '',
      firstSeenAt: (record.fields['Created Time'] as string) || record.createdTime || '',
      jobUrl: record.fields['Job URL'] || '',
      applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
      salary: record.fields['Salary'] || '',
    };
  });
}

  // Get organic jobs sorted by Created Time
export async function getOrganicJobs(page: number = 1, pageSize: number = 25): Promise<JobsResult> {
  const allRecordsResult = await fetchAirtable(TABLES.jobs, {
    sort: [{ field: 'Created Time', direction: 'desc' }],
    maxRecords: 100,
    fields: [
      'Job ID', 'Title', 'Companies', 'Function', 'Location',      'Created Time', 'Job URL', 'Apply URL', 'Salary', 'Investors',
      'Company Industry (Lookup)', 'Raw JSON',
    ],
  });

  const [functionRecords, investorRecords, industryRecords] = await Promise.all([
    fetchAirtable(TABLES.functions, { fields: ['Function', 'Department (Primary)'] }),
    fetchAirtable(TABLES.investors, { fields: ['Company'] }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
  ]);

  // Build company map with pagination
  const companyMap = new Map<string, string>();
  const companyUrlMap = new Map<string, string>();
  let companyOffset: string | undefined;
  do {
    const companyRecords = await fetchAirtable(TABLES.companies, {
      fields: ['Company', 'URL'],
      offset: companyOffset,
    });
    companyRecords.records.forEach(r => {
      companyMap.set(r.id, (r.fields['Company'] as string) || '');
      companyUrlMap.set(r.id, (r.fields['URL'] as string) || '');
    });
    companyOffset = companyRecords.offset;
  } while (companyOffset);

  const functionMap = new Map<string, string>();
  const departmentMap = new Map<string, string>();
  functionRecords.records.forEach(r => {
    functionMap.set(r.id, r.fields['Function'] || '');
    departmentMap.set(r.id, r.fields['Department (Primary)'] || '');
  });

  const investorMap = new Map<string, string>();
  investorRecords.records.forEach(r => investorMap.set(r.id, r.fields['Company'] || ''));

  const industryMap = new Map<string, string>();
  industryRecords.records.forEach(r => industryMap.set(r.id, r.fields['Industry Name'] || ''));

  const jobs = allRecordsResult.records.map(record => {
    const companyField = record.fields['Companies'];
    let companyName = 'Unknown';
    let companyUrl = '';
    if (typeof companyField === 'string') {
      companyName = companyField;
    } else if (Array.isArray(companyField) && companyField.length > 0) {
      companyName = companyMap.get(companyField[0]) || 'Unknown';
      companyUrl = companyUrlMap.get(companyField[0]) || '';
    }

    const functionIds = record.fields['Function'] || [];
    let funcName = functionIds.length > 0 ? functionMap.get(functionIds[0]) || '' : '';
    let deptName = functionIds.length > 0 ? departmentMap.get(functionIds[0]) || '' : '';
    if (!funcName) {
      funcName = inferFunction(record.fields['Title'] as string || '');
    }
    if (!deptName) {
      deptName = FUNCTION_TO_DEPARTMENT[funcName] || '';
    }

    const investorIds = record.fields['Investors'] || [];
    const investorNames = Array.isArray(investorIds)
      ? investorIds.map(id => investorMap.get(id) || '').filter(Boolean)
      : [];

    const industryIds = record.fields['Company Industry (Lookup)'] || [];
    const industryName = Array.isArray(industryIds) && industryIds.length > 0
      ? industryMap.get(industryIds[0]) || ''
      : '';

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
          }
        }
      } catch (e) {}
    }
    if (!location) {
      const airtableLocation = record.fields['Location'] as string || '';
      if (airtableLocation && !['remote', 'hybrid', 'on-site', 'onsite'].includes(airtableLocation.toLowerCase())) {
        location = airtableLocation;
      } else if (remoteFirst) {
        location = 'Remote';
      }
    }

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
      departmentName: deptName,
      industry: industryName,
      datePosted: record.fields['Created Time'] || record.createdTime || '',
      firstSeenAt: (record.fields['Created Time'] as string) || record.createdTime || '',
      jobUrl: record.fields['Job URL'] || '',
      applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
      salary: record.fields['Salary'] || '',
    };
  });

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
  // Fetch counts from each table
  const [jobRecords, companyRecords, investorRecords] = await Promise.all([
    fetchAirtable(TABLES.jobs, { fields: ['Job ID'], maxRecords: 1000 }),
    fetchAirtable(TABLES.companies, { fields: ['Company'] }),
    fetchAirtable(TABLES.investors, { fields: ['Company'] }),
  ]);

  return {
    jobCount: jobRecords.records.length,
    companyCount: companyRecords.records.length,
    investorCount: investorRecords.records.length,
  };
}
