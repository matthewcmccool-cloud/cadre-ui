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
  options: {
    filterByFormula?: string;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
    maxRecords?: number;
    fields?: string[];
    offset?: string;
  } = {}
): Promise<{ records: AirtableRecord[]; offset?: string }> {
  const params = new URLSearchParams()
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Missing Airtable environment variables');
  }

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

  if (options.offset) {
    params.append('offset', options.offset);
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${params}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    console.error('Airtable error:', response.status);
    throw new Error('Airtable error: ' + response.status);
  }

  const data: AirtableResponse = await response.json();
  return { records: data.records, offset: data.offset };
}

export interface Job {
  id: string;
  jobId: string;
  title: string;
  company: string;
  investors: string[];
  location: string;
  remoteFirst: boolean;
  functionName: string;
  industry: string;
  datePosted: string;
  jobUrl: string;
  applyUrl: string;
  salary: string;
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
  location?: string;
  remoteOnly?: boolean;
  search?: string;
  company?: string;
  investor?: string;
  industry?: string;
  page?: number;
}): Promise<JobsResult> {
  const pageSize = 25;
  const page = filters?.page || 1;

  const formulaParts: string[] = [];

  if (filters?.remoteOnly) {
    formulaParts.push('{Remote First} = 1');
  }

    const filterByFormula = formulaParts.length > 0 ? `AND(${formulaParts.join(',')})` : undefined;

    const allRecordsResult = await fetchAirtable(TABLES.jobs, { 
          filterByFormula,
    sort: [{ field: 'Date Posted', direction: 'desc' }],
    maxRecords: 500,
    fields: [
      'Job ID',
      'Title',
      'Company',
      'Function',
      'Location',
      'Remote First',
      'Date Posted',
      'Job URL',
      'Apply URL',
      'Salary',
      'Investors',
      'Company Industry (Loopup)',
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

  const companyRecords = await fetchAirtable(TABLES.companies, {
    fields: ['Company'],
  });
  const companyMap = new Map<string, string>();
  companyRecords.records.forEach(r => {
    companyMap.set(r.id, r.fields['Company'] || '');
  });

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
    const companyIds = record.fields['Company'] || [];
    const companyName = companyIds.length > 0 ? companyMap.get(companyIds[0]) || 'Unknown' : 'Unknown';

    const functionIds = record.fields['Function'] || [];
    const funcName = functionIds.length > 0 ? functionMap.get(functionIds[0]) || '' : '';

    const investorIds = record.fields['Investors'] || [];
    const investorNames = Array.isArray(investorIds)
      ? investorIds.map(id => investorMap.get(id) || '').filter(Boolean)
      : [];

    const industryIds = record.fields['Company Industry (Loopup)'] || [];
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

    // If no location found from Raw JSON, show 'Remote' if remote-first job, otherwise try Location field
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

  // Filter by function if specified
  if (filters?.functionName) {
    jobs = jobs.filter(job =>
      job.functionName.toLowerCase().includes(filters.functionName!.toLowerCase())
    );
  }

  // Filter by investor if specified
  if (filters?.investor) {
    jobs = jobs.filter(job =>
      job.investors.some(inv => inv.toLowerCase().includes(filters.investor!.toLowerCase()))
    );
  }

  // Filter by company if specified
  if (filters?.company) {
    jobs = jobs.filter(job =>
      job.company.toLowerCase().includes(filters.company!.toLowerCase())
    );
  }

  // Filter by industry if specified
  if (filters?.industry) {
    jobs = jobs.filter(job =>
      job.industry.toLowerCase().includes(filters.industry!.toLowerCase())
    );
  }

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
    maxRecords: 500,
  });

  const locationSet = new Set<string>();
  jobRecords.records.forEach(r => {
    const country = r.fields['Location'];
    if (country) locationSet.add(country);
  });

  const locations = Array.from(locationSet).sort();

  return { functions, locations, investors, industries };
}
