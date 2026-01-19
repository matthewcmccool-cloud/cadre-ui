// lib/airtable.ts
// Airtable API client for fetching jobs, companies, and filters

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const TABLES = {
  jobs: 'Job Listings',
  companies: 'Companies',
  investors: 'Investors',
  functions: 'Function',
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
  options: {
    filterByFormula?: string;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
    maxRecords?: number;
    fields?: string[];
  } = {}
): Promise<AirtableRecord[]> {
  const params = new URLSearchParams();
  
  if (options.filterByFormula) {
    params.append('filterByFormula', options.filterByFormula);
  }
  
  if (options.sort) {
    options.sort.forEach((s, i) => {
      params.append(`sort[${i}][field]`, s.field);
      params.append(`sort[${i}][direction]`, s.direction);
    });
  }
  
  if (options.maxRecords) {
    params.append('maxRecords', String(options.maxRecords));
  }
  
  if (options.fields) {
    options.fields.forEach(f => params.append('fields[]', f));
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${params}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Airtable error: ${response.status}`);
  }

  const data: AirtableResponse = await response.json();
  return data.records;
}

// Types
export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  investors: string[];
  location: string;
  remoteFirst: boolean;
  function: string;
  industry: string;
  datePosted: string;
  jobUrl: string;
  applyUrl: string;
  description: string;
  about: string;
  keywords: string[];
}

export interface Company {
  id: string;
  name: string;
  investors: string[];
  industry: string;
  totalRaised: string;
  about: string;
  url: string;
  jobCount: number;
}

export interface FilterOptions {
  functions: string[];
  locations: string[];
  investors: string[];
  industries: string[];
}

// Fetch jobs with optional filters
export async function getJobs(filters?: {
  function?: string;
  location?: string;
  investor?: string;
  industry?: string;
  remoteOnly?: boolean;
  search?: string;
}): Promise<Job[]> {
  const formulaParts: string[] = [];
  
  // Only show active jobs
  formulaParts.push("{Status} = 'Active'");
  
  if (filters?.function) {
    formulaParts.push(`FIND('${filters.function}', ARRAYJOIN({Function}))`);
  }
  
  if (filters?.location) {
    formulaParts.push(`FIND('${filters.location}', {Location})`);
  }
  
  if (filters?.remoteOnly) {
    formulaParts.push("{Remote First} = 1");
  }
  
  if (filters?.search) {
    const searchTerm = filters.search.replace(/'/g, "\\'");
    formulaParts.push(`OR(FIND(LOWER('${searchTerm}'), LOWER({Title})), FIND(LOWER('${searchTerm}'), LOWER(ARRAYJOIN({Company}))))`);
  }
  
  const filterByFormula = formulaParts.length > 0 
    ? `AND(${formulaParts.join(', ')})` 
    : '';

  const records = await fetchAirtable(TABLES.jobs, {
    filterByFormula,
    sort: [{ field: 'Date Posted', direction: 'desc' }],
    maxRecords: 100,
    fields: [
      'Title',
      'Company',
      'Location',
      'Remote First',
      'Function',
      'Date Posted',
      'Job URL',
      'Apply URL',
      'About',
      'Matched Keyword',
      'Job Description',
    ],
  });

  return records.map(record => ({
    id: record.id,
    title: record.fields['Title'] || '',
    company: Array.isArray(record.fields['Company']) 
      ? record.fields['Company'][0] 
      : record.fields['Company'] || '',
    companyId: '', // Will populate if needed
    investors: [], // Will join from company
    location: record.fields['Location'] || '',
    remoteFirst: record.fields['Remote First'] || false,
    function: Array.isArray(record.fields['Function']) 
      ? record.fields['Function'][0] 
      : record.fields['Function'] || '',
    industry: '',
    datePosted: record.fields['Date Posted'] || '',
    jobUrl: record.fields['Job URL'] || '',
    applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
    description: record.fields['Job Description'] || '',
    about: record.fields['About'] || '',
    keywords: record.fields['Matched Keyword'] 
      ? record.fields['Matched Keyword'].split(',').map((k: string) => k.trim())
      : [],
  }));
}

// Fetch all jobs with company and investor data joined
export async function getJobsWithDetails(): Promise<Job[]> {
  // First, get all companies with their investors
  const companyRecords = await fetchAirtable(TABLES.companies, {
    fields: ['Company', 'VCs', 'Industry'],
  });
  
  const companyMap = new Map<string, { investors: string[]; industry: string }>();
  companyRecords.forEach(record => {
    const name = record.fields['Company'];
    if (name) {
      companyMap.set(record.id, {
        investors: record.fields['VCs'] || [],
        industry: Array.isArray(record.fields['Industry']) 
          ? record.fields['Industry'][0] 
          : record.fields['Industry'] || '',
      });
    }
  });

  // Get jobs
  const jobRecords = await fetchAirtable(TABLES.jobs, {
    filterByFormula: "{Status} = 'Active'",
    sort: [{ field: 'Date Posted', direction: 'desc' }],
    maxRecords: 200,
  });

  // Get investor names
  const investorRecords = await fetchAirtable(TABLES.investors, {
    fields: ['Name'],
  });
  
  const investorMap = new Map<string, string>();
  investorRecords.forEach(record => {
    investorMap.set(record.id, record.fields['Name'] || '');
  });

  return jobRecords.map(record => {
    const companyLinkIds = record.fields['Company'] || [];
    const companyId = companyLinkIds[0] || '';
    const companyData = companyMap.get(companyId);
    
    const investorNames = companyData?.investors
      ?.map(id => investorMap.get(id))
      .filter(Boolean) || [];

    return {
      id: record.id,
      title: record.fields['Title'] || '',
      company: record.fields['Company']?.[0] || '',
      companyId,
      investors: investorNames as string[],
      location: record.fields['Location'] || '',
      remoteFirst: record.fields['Remote First'] || false,
      function: Array.isArray(record.fields['Function']) 
        ? record.fields['Function'][0] 
        : record.fields['Function'] || '',
      industry: companyData?.industry || '',
      datePosted: record.fields['Date Posted'] || '',
      jobUrl: record.fields['Job URL'] || '',
      applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
      description: record.fields['Job Description'] || '',
      about: record.fields['About'] || '',
      keywords: record.fields['Matched Keyword'] 
        ? record.fields['Matched Keyword'].split(',').map((k: string) => k.trim())
        : [],
    };
  });
}

// Get filter options
export async function getFilterOptions(): Promise<FilterOptions> {
  const [functionRecords, investorRecords] = await Promise.all([
    fetchAirtable(TABLES.functions, { fields: ['Name'] }),
    fetchAirtable(TABLES.investors, { fields: ['Name'] }),
  ]);

  const functions = functionRecords
    .map(r => r.fields['Name'])
    .filter(Boolean)
    .sort();

  const investors = investorRecords
    .map(r => r.fields['Name'])
    .filter(Boolean)
    .sort();

  // Hardcoded locations for now (can make dynamic later)
  const locations = [
    'Remote',
    'San Francisco, CA',
    'New York, NY',
    'Los Angeles, CA',
    'Seattle, WA',
    'Austin, TX',
    'Boston, MA',
    'Denver, CO',
    'Chicago, IL',
  ];

  const industries = [
    'AI',
    'Fintech',
    'Enterprise Software',
    'Consumer',
    'Climate',
    'Healthcare',
    'Crypto',
    'Developer Tools',
  ];

  return {
    functions,
    locations,
    investors,
    industries,
  };
}

// Get single job by ID
export async function getJobById(id: string): Promise<Job | null> {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.jobs)}/${id}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const record: AirtableRecord = await response.json();
    
    return {
      id: record.id,
      title: record.fields['Title'] || '',
      company: Array.isArray(record.fields['Company']) 
        ? record.fields['Company'][0] 
        : record.fields['Company'] || '',
      companyId: '',
      investors: [],
      location: record.fields['Location'] || '',
      remoteFirst: record.fields['Remote First'] || false,
      function: Array.isArray(record.fields['Function']) 
        ? record.fields['Function'][0] 
        : record.fields['Function'] || '',
      industry: '',
      datePosted: record.fields['Date Posted'] || '',
      jobUrl: record.fields['Job URL'] || '',
      applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
      description: record.fields['Job Description'] || '',
      about: record.fields['About'] || '',
      keywords: record.fields['Matched Keyword'] 
        ? record.fields['Matched Keyword'].split(',').map((k: string) => k.trim())
        : [],
    };
  } catch {
    return null;
  }
}
