
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
  return data.records;
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

export async function getJobs(filters?: {
  functionName?: string;
  location?: string;
  remoteOnly?: boolean;
  search?: string;
}): Promise<Job[]> {
  const formulaParts: string[] = [];
  
  if (filters?.remoteOnly) {
    formulaParts.push('{Remote First} = 1');
  }
  
  if (filters?.search) {
    const s = filters.search.replace(/'/g, "\\'");
    formulaParts.push('OR(FIND(LOWER(\'' + s + '\'), LOWER({Title})), FIND(LOWER(\'' + s + '\'), LOWER(ARRAYJOIN({Company}))))');
  }

  if (filters?.location) {
    const loc = filters.location.replace(/'/g, "\\'");
    formulaParts.push('FIND(\'' + loc + '\', {Country})');
  }
  
  const filterByFormula = formulaParts.length > 0 
    ? 'AND(' + formulaParts.join(', ') + ')' 
    : '';

  const records = await fetchAirtable(TABLES.jobs, {
    filterByFormula,
    sort: [{ field: 'Date Posted', direction: 'desc' }],
    maxRecords: 100,
    fields: [
      'Job ID',
      'Title',
      'Company',
      'Function',
      'Country',
      'Remote First',
      'Date Posted',
      'Job URL',
      'Apply URL',
      'Salary',
      'Investors',
      'Company Industry (Loopup)',
    ],
  });

  const functionRecords = await fetchAirtable(TABLES.functions, {
    fields: ['Function'],
  });
  const functionMap = new Map<string, string>();
  functionRecords.forEach(r => {
    functionMap.set(r.id, r.fields['Function'] || '');
  });

  const companyRecords = await fetchAirtable(TABLES.companies, {
    fields: ['Company'],
  });
  const companyMap = new Map<string, string>();
  companyRecords.forEach(r => {
    companyMap.set(r.id, r.fields['Company'] || '');
  });

  return records.map(record => {
    const companyIds = record.fields['Company'] || [];
    const companyName = companyIds.length > 0 
      ? companyMap.get(companyIds[0]) || 'Unknown'
      : 'Unknown';

    const functionIds = record.fields['Function'] || [];
    const funcName = functionIds.length > 0 
      ? functionMap.get(functionIds[0]) || ''
      : '';

    const investors = record.fields['Investors'] || [];
    const industries = record.fields['Company Industry (Loopup)'] || [];

    return {
      id: record.id,
      jobId: record.fields['Job ID'] || '',
      title: record.fields['Title'] || '',
      company: companyName,
      investors: Array.isArray(investors) ? investors : [],
      location: record.fields['Country'] || '',
      remoteFirst: record.fields['Remote First'] || false,
      functionName: funcName,
      industry: Array.isArray(industries) ? industries[0] || '' : '',
      datePosted: record.fields['Date Posted'] || '',
      jobUrl: record.fields['Job URL'] || '',
      applyUrl: record.fields['Apply URL'] || record.fields['Job URL'] || '',
      salary: record.fields['Salary'] || '',
    };
  });
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [functionRecords, investorRecords, industryRecords] = await Promise.all([
    fetchAirtable(TABLES.functions, { fields: ['Function'] }),
    fetchAirtable(TABLES.investors, { fields: ['Company'] }),
    fetchAirtable(TABLES.industries, { fields: ['Industry Name'] }),
  ]);

  const functions = functionRecords
    .map(r => r.fields['Function'])
    .filter(Boolean)
    .sort();

  const investors = investorRecords
    .map(r => r.fields['Company'])
    .filter(Boolean)
    .sort();

  const industries = industryRecords
    .map(r => r.fields['Industry Name'])
    .filter(Boolean)
    .sort();

  const jobRecords = await fetchAirtable(TABLES.jobs, {
    fields: ['Country'],
    maxRecords: 500,
  });
  
  const locationSet = new Set<string>();
  jobRecords.forEach(r => {
    const country = r.fields['Country'];
    if (country) locationSet.add(country);
  });
  const locations = Array.from(locationSet).sort();

  return { functions, locations, investors, industries };
}
