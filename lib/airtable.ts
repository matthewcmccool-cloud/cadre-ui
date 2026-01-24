const TABLES = {
  jobs: 'Job Listings',
  companies: 'Companies',
  investors: 'Investors',
  functions: 'tbl94EXkSIEmhqyYy',
  industries: 'Industry',
};

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
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
  companyUrl?: string;
  investors: string[];
  location: string;
  remoteFirst: boolean;
  functionName: string;
  industry: string;
  datePosted: string;
  jobUrl: string;
  applyUrl: string;
  salary: string;
  description?: string;
}

export interface FilterOptions {
  functions: string[];
  locations: string[];
  investors: string[];
  industries: string[];
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

  const formulaParts: string[] = [];

  if (filters?.remoteOnly) {
    formulaParts.push('{Remote First} = 1');
  }

  if (filters?.search) {
    const s = filters.search.replace(/'/g, "\\'");
    formulaParts.push('OR(FIND(LOWER(\'' + s + '\'), LOWER({Title})), FIND(LOWER(\'' + s + '\'), LOWER(ARRAYJOIN({Companies}))))');
  }

  if (filters?.location) {
    const loc = filters.location.replace(/'/g, "\\'");
    formulaParts.push('FIND(\'' + loc + '\', {Location})');
  }

  const filterByFormula = formulaParts.length > 0
    ? 'AND(' + formulaParts.join(', ') + ')'
    : '';

  const allRecordsResult = await fetchAirtable(TABLES.jobs, { 
    filterByFormula,
    sort: [{ field: 'Date Posted', direction: 'desc' }],
    maxRecords: 100,
    fields: [
      'Job ID',
      'Title',
      'Companies',
      'Function',
      'Location',
      'Remote First',
      'Date Posted',
      'Job URL',
      'Apply URL',
      'Salary',
      'Investors',
      'Company Industry (Lookup)',
      'Raw JSON',
    ],
  });

  const allRecords = allRecordsResult.records;

  const functionRecords = await fetchAirtable(TABLES.functions, {
    fields: ['Function'],
  });
  const functionMap = new Map<string, string>();
  functionRecords.records.forEach(r => {
    functionMap.set(r.id, r.fields['Function'] || '');
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
    const funcName = functionIds.length > 0 ? functionMap.get(functionIds[0]) || '' : '';

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
      industry: industryName,
      datePosted: record.fields['Date Posted'] || '',
      jobUrl: record.fields['Job URL'] || '',
      applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
      salary: record.fields['Salary'] || '',
    };
  });

  // Multi-select filter: functionName (OR logic within, comma-separated)
  if (filters?.functionName) {
    const selectedFunctions = filters.functionName.split(',').map(f => f.trim().toLowerCase());
    jobs = jobs.filter(job =>
      selectedFunctions.some(fn => job.functionName.toLowerCase() === fn)
    );
  }

  // Multi-select filter: industry (OR logic within, comma-separated)
  if (filters?.industry) {
    const selectedIndustries = filters.industry.split(',').map(i => i.trim().toLowerCase());
    jobs = jobs.filter(job =>
      selectedIndustries.some(ind => job.industry.toLowerCase() === ind)
    );
  }

  // Multi-select filter: investor (OR logic within, comma-separated)
  if (filters?.investor) {
    const selectedInvestors = filters.investor.split(',').map(inv => inv.trim().toLowerCase());
    jobs = jobs.filter(job =>
      job.investors.some(inv =>
        selectedInvestors.some(selected => inv.toLowerCase() === selected)
      )
    );
  }

  // Filter by company if specified
  if (filters?.company) {
    jobs = jobs.filter(job =>
      job.company.toLowerCase().includes(filters.company!.toLowerCase())
    );
  }

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

export async function getFilterOptions(): Promise<FilterOptions> {
  const [functionRecords, investorRecords, industryRecords] = await Promise.all([
    fetchAirtable(TABLES.functions, { fields: ['Function'] }),
    fetchAirtable(TABLES.investors, { fields: ['Company'] }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
  ]);

  const functions = functionRecords.records
    .map(r => r.fields['Function'])
    .filter(Boolean)
    .sort();

  const investors = investorRecords.records
    .map(r => r.fields['Company'])
    .filter(Boolean)
    .sort();

  const industries = industryRecords.records
    .map(r => r.fields['Industry Name'])
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

  return { functions, locations, investors, industries };
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

  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.status}`);
  }

  const text = await response.text();
  const record = JSON.parse(text);
  // Check if record exists and has fields
  if (!record || !record.fields) {
    return null;
  }

  // Fetch related data (companies, investors, industries, functions)
  const [companyRecords, investorRecords, industryRecords, functionRecords] = await Promise.all([
    fetchAirtable(TABLES.companies, { fields: ['Company', 'URL'] }),
    fetchAirtable(TABLES.investors, { fields: ['Company'] }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
    fetchAirtable(TABLES.functions, { fields: ['Function'] }),
  ]);

  const companyMap = new Map<string, string>();
  const companyUrlMap = new Map<string, string>();
  companyRecords.records.forEach(r => {
    companyMap.set(r.id, (r.fields['Company'] as string) || '');
    companyUrlMap.set(r.id, (r.fields['URL'] as string) || '');
  });

  const investorMap = new Map<string, string>();
  investorRecords.records.forEach(r => {
    investorMap.set(r.id, r.fields['Company'] || '');
  });

  const industryMap = new Map<string, string>();
  industryRecords.records.forEach(r => {
    industryMap.set(r.id, r.fields['Industry Name'] || '');
  });

  const functionMap = new Map<string, string>();
  functionRecords.records.forEach(r => {
    functionMap.set(r.id, r.fields['Function'] || '');
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
  const funcName = functionIds.length > 0 ? functionMap.get(functionIds[0]) || '' : '';

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

  // Extract job description from Raw JSON
  let description = '';
  if (record.fields['Raw JSON']) {
    try {
      const rawData = JSON.parse(record.fields['Raw JSON'] as string);
      description = rawData?.content || rawData?.description || '';
    } catch (e) {
      // Ignore parse errors
    }
  }

  // If no description from Raw JSON, try direct Job Description field
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
    industry: industryName,
    datePosted: record.fields['Date Posted'] || '',
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
  description?: string;
  industry?: string;
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

  // Fetch all companies and find by slug (company name lowercased and hyphenated)
  const companyRecords = await fetchAirtable(TABLES.companies, {
        fields: ['Company', 'URL'],
  });

  const company = companyRecords.records.find(r => {
    const name = r.fields['Company'] as string || '';
    const companySlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return companySlug === slug;
  });

  if (!company) {
    return null;
  }

    const companyId = company.id;
  const companyName = (company.fields['Company'] as string) || '';

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

    // Filter jobs to only those linked to this company
  const jobsForCompany = jobRecords.records.filter(job => {
    const companyIds = job.fields['Companies'] || [];
    return Array.isArray(companyIds) && companyIds.includes(companyId);
  });

    const investorSet = new Set<string>();
  jobsForCompany.forEach(job => {
    const invIds = job.fields['Investors'] || [];
    if (Array.isArray(invIds)) {
      invIds.forEach(id => {
        
        const name = investorMap.get(id);
        if (name) investorSet.add(name);
      });
    }
  });
  return {
    id: company.id,
    name: companyName,
    slug: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    url: company.fields['URL'] as string || undefined,
    description: company.fields['Description'] as string || undefined,
    investors: Array.from(investorSet),
    jobCount: jobsForCompany.length,
  };
}

// Get jobs by company name - fetches all jobs and dedupes by title+location
export async function getJobsByCompany(companyName: string): Promise<Job[]> {
  // Fetch all jobs for this company (not paginated)
  const allJobs: Job[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const result = await getJobs({ company: companyName, page });
    allJobs.push(...result.jobs);
    hasMore = page < result.totalPages;
    page++;
  }
  
  // Dedupe by title + location
  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter(job => {
    const key = `${job.title}|${job.location}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return uniqueJobs;
}

// Investor interface
export interface Investor {
  id: string;
  name: string;
  slug: string;
  companies: Array<{ id: string; name: string; slug: string }>;
  jobCount: number;
}

// Fetch a single investor by slug
export async function getInvestorBySlug(slug: string): Promise<Investor | null> {
  // Fetch all investors
 
    const investorRecords = await fetchAirtable(TABLES.investors, {
    fields: ['Company'],
  });

  const investor = investorRecords.records.find(r => {
    const name = r.fields['Company'] as string || '';
    const investorSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return investorSlug === slug;
  });

  if (!investor) {
    return null;
  }

  const investorName = investor.fields['Company'] as string || '';
  const investorId = investor.id;

  // Fetch all jobs to find companies backed by this investor
  const jobRecords = await fetchAirtable(TABLES.jobs, {
    fields: ['Companies', 'Investors'],
  });

  // Fetch company records for name lookup
  const companyRecords = await fetchAirtable(TABLES.companies, {
    fields: ['Company'],
  });

  const companyMap = new Map<string, string>();
  companyRecords.records.forEach(r => {
    companyMap.set(r.id, r.fields['Company'] as string || '');
  });

  // Find companies that have jobs with this investor
  const companySet = new Map<string, { id: string; name: string; slug: string }>();
  let jobCount = 0;

  jobRecords.records.forEach(job => {
    const investorIds = job.fields['Investors'] || [];
    if (Array.isArray(investorIds) && investorIds.includes(investorId)) {
      jobCount++;
      const companyIds = job.fields['Companies'] || [];
      if (Array.isArray(companyIds)) {
        companyIds.forEach(companyId => {
          const companyName = companyMap.get(companyId) || '';
          if (companyName && !companySet.has(companyId)) {
            companySet.set(companyId, {
              id: companyId,
              name: companyName,
              slug: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            });
          }
        });
      }
    }
  });

  return {
    id: investorId,
    name: investorName,
    slug: investorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    companies: Array.from(companySet.values()),
    jobCount,
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
    const industrySlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return industrySlug === slug;
  });

  if (!industry) {
    return null;
  }

  const industryName = industry.fields['Industry Name'] as string || '';
  const industryId = industry.id;

  // Fetch jobs to find companies in this industry and count jobs
  const jobRecords = await fetchAirtable(TABLES.jobs, {
    fields: ['Companies', 'Company Industry (Lookup)'],
  });

  // Fetch company records for name lookup
  const companyRecords = await fetchAirtable(TABLES.companies, {
    fields: ['Company'],
  });

  const companyMap = new Map<string, string>();
  companyRecords.records.forEach(r => {
    companyMap.set(r.id, r.fields['Company'] as string || '');
  });

  // Find companies in this industry
  const companySet = new Map<string, { id: string; name: string; slug: string }>();
  let jobCount = 0;

  jobRecords.records.forEach(job => {
    const industryIds = job.fields['Company Industry (Lookup)'] || [];
    if (Array.isArray(industryIds) && industryIds.includes(industryId)) {
      jobCount++;
      const companyIds = job.fields['Companies'] || [];
      if (Array.isArray(companyIds)) {
        companyIds.forEach(companyId => {
          const companyName = companyMap.get(companyId) || '';
          if (companyName && !companySet.has(companyId)) {
            companySet.set(companyId, {
              id: companyId,
              name: companyName,
              slug: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            });
          }
        });
      }
    }
  });

  return {
    id: industryId,
    name: industryName,
    slug: industryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    jobCount,
    companies: Array.from(companySet.values()),
  };
}

// Get featured jobs (jobs marked as featured in Airtable)
export async function getFeaturedJobs(): Promise<Job[]> {
  const allRecordsResult = await fetchAirtable(TABLES.jobs, {
    filterByFormula: 'AND({is_featured} = TRUE(), {featured_status} = "approved", {featured_end} > TODAY())',
      sort: [{ field: 'featured_start', direction: 'desc' }],
    maxRecords: 10,
    fields: [
      'Job ID', 'Title', 'Companies', 'Function', 'Location', 'Remote First',
      'Date Posted', 'Job URL', 'Apply URL', 'Salary', 'Investors',
      'Company Industry (Lookup)', 'Raw JSON',
    ],
  });

  const [functionRecords, investorRecords, industryRecords] = await Promise.all([
    fetchAirtable(TABLES.functions, { fields: ['Function'] }),
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
  functionRecords.records.forEach(r => functionMap.set(r.id, r.fields['Function'] || ''));

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
    const funcName = functionIds.length > 0 ? functionMap.get(functionIds[0]) || '' : '';

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
      industry: industryName,
      datePosted: record.fields['Date Posted'] || '',
      jobUrl: record.fields['Job URL'] || '',
      applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
      salary: record.fields['Salary'] || '',
    };
  });
}

  // Get organic jobs sorted by Date Posted
export async function getOrganicJobs(page: number = 1, pageSize: number = 25): Promise<JobsResult> {
  const allRecordsResult = await fetchAirtable(TABLES.jobs, {
    sort: [{ field: 'Date Posted', direction: 'desc' }],
    maxRecords: 100,
    fields: [
      'Job ID', 'Title', 'Companies', 'Function', 'Location', 'Remote First',
      'Date Posted', 'Job URL', 'Apply URL', 'Salary', 'Investors',
      'Company Industry (Lookup)', 'Raw JSON',
    ],
  });

  const [functionRecords, investorRecords, industryRecords] = await Promise.all([
    fetchAirtable(TABLES.functions, { fields: ['Function'] }),
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
  functionRecords.records.forEach(r => functionMap.set(r.id, r.fields['Function'] || ''));

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
    const funcName = functionIds.length > 0 ? functionMap.get(functionIds[0]) || '' : '';

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
      industry: industryName,
      datePosted: record.fields['Date Posted'] || '',
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
