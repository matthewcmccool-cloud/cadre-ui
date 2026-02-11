import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

const COMPANIES_TABLE = 'tbl4dA7iDr7mjF6Gt';
const BATCH_SIZE = 15;
const RATE_LIMIT_DELAY = 1000;
const MAX_RUNTIME_MS = 8000; // Stay under Vercel's 10s timeout

interface CompanyRecord {
  id: string;
  fields: {
    Company?: string;
    Stage?: string;
    Size?: string;
  };
}

interface EnrichmentResult {
  stageText: string;
  sizeText: string;
}

// Stage mapping function
function mapStage(raw: string): string | null {
  const text = raw.toLowerCase();
  
  if (text.includes('ipo') || text.includes('public') || text.includes('nyse') || text.includes('nasdaq')) {
    return 'Public';
  }
  if (text.includes('pre-seed') || text.includes('pre seed')) return 'Early Stage';
  if (text.includes('seed')) return 'Early Stage';
  if (text.includes('series a')) return 'Early Stage';
  if (text.includes('series b') || text.includes('series c')) return 'Mid Stage';
  if (text.includes('series d') || text.includes('series e') || text.includes('series f') || text.includes('series g') || text.includes('series h')) {
    return 'Late Stage';
  }
  
  return null;
}

// Size mapping function
function mapSize(raw: string): string | null {
  const text = raw.toLowerCase();
  
  // Try to extract a numeric range like "51-200 employees"
  const rangeMatch = text.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10);
    const high = parseInt(rangeMatch[2], 10);
    
    if (low <= 50 && high <= 50) return '1-50';
    if (low >= 51 && high <= 200) return '51-200';
    if (low >= 201 && high <= 1000) return '201-1000';
    if (high > 1000) return '1000+';
  }
  
  // Fallback: single approximate number like "around 300 employees"
  const singleMatch = text.match(/(\d{1,5})\s*(\+|plus)?\s*employees?/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10);
    if (n <= 50) return '1-50';
    if (n <= 200) return '51-200';
    if (n <= 1000) return '201-1000';
    if (n > 1000) return '1000+';
  }
  
  // Heuristic keywords
  if (text.includes('fewer than 50') || text.includes('under 50')) return '1-50';
  if (text.includes('51-200')) return '51-200';
  if (text.includes('201-1000')) return '201-1000';
  if (text.includes('1000+') || text.includes('over 1000') || text.includes('over 1,000')) return '1000+';
  
  return null;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch companies from Airtable where Stage OR Size is empty
async function getCompaniesNeedingEnrichment(): Promise<CompanyRecord[]> {
  const companies: CompanyRecord[] = [];
  let offset: string | undefined;
  
  do {
    const params = new URLSearchParams();
    params.append('filterByFormula', "OR({Stage} = '', {Stage} = BLANK(), {Size} = '', {Size} = BLANK())");
    params.append('fields[]', 'Company');
    params.append('fields[]', 'Stage');
    params.append('fields[]', 'Size');
    params.append('pageSize', String(BATCH_SIZE));
    if (offset) params.append('offset', offset);
    
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}: ${text.substring(0, 200)}`);
    }

    const data = JSON.parse(text);
    companies.push(...data.records);
    offset = data.offset;
    
    // Only get one page for batch processing
    break;
  } while (offset);
  
  return companies.slice(0, BATCH_SIZE);
}

// Call Perplexity Sonar API to get company info
async function callPerplexity(companyName: string): Promise<EnrichmentResult | null> {
  const prompt = `What is the funding stage and approximate employee count for ${companyName}? Return a short JSON object like: {"funding_stage": "...", "employee_count": "..."}. Be concise.`;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });
    
    const pText = await response.text();
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}: ${pText.substring(0, 200)}`);
    }

    const data = JSON.parse(pText);
    const content = data.choices?.[0]?.message?.content || '';
    
    // Strip markdown code fences that Perplexity often wraps around JSON
    const cleaned = content.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : cleaned;
    
    try {
      const parsed = JSON.parse(jsonText);
      const stageText = parsed.funding_stage || parsed.stage || '';
      const sizeText = parsed.employee_count || parsed.employees || parsed.size || '';
      
      if (!stageText && !sizeText) return null;
      
      return { stageText, sizeText };
    } catch {
      console.error('Failed to parse Perplexity response:', content);
      return null;
    }
  } catch (err) {
    console.error('Perplexity error for', companyName, err);
    return null;
  }
}

// Update a single Airtable record
async function updateAirtableRecord(recordId: string, fields: { Stage?: string; Size?: string }): Promise<void> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}/${recordId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Airtable update error: ${response.statusText}`);
  }
}

// Main GET handler
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const summary = {
    totalFetched: 0,
    processed: 0,
    updated: 0,
    errors: [] as { id: string; company?: string; error: string }[],
  };

  try {
    // Fetch companies needing enrichment
    const companies = await getCompaniesNeedingEnrichment();
    summary.totalFetched = companies.length;

    if (companies.length === 0) {
      return NextResponse.json({
        ...summary,
        message: 'No companies found needing enrichment',
      });
    }

    // Process each company, respecting timeout
    for (const record of companies) {
      if (Date.now() - startTime > MAX_RUNTIME_MS) break;
      const companyName = record.fields.Company;
      
      if (!companyName) {
        summary.errors.push({
          id: record.id,
          error: 'Missing company name',
        });
        continue;
      }
      
      summary.processed += 1;
      
      // Call Perplexity to get company info
      const result = await callPerplexity(companyName);
      
      if (!result) {
        summary.errors.push({
          id: record.id,
          company: companyName,
          error: 'No result from Perplexity',
        });
        continue;
      }
      
      // Map the results to our standard values
      const mappedStage = result.stageText ? mapStage(result.stageText) : null;
      const mappedSize = result.sizeText ? mapSize(result.sizeText) : null;
      
      const fields: { Stage?: string; Size?: string } = {};
      
      // Only update fields that are currently empty
      if (!record.fields.Stage && mappedStage) {
        fields.Stage = mappedStage;
      }
      if (!record.fields.Size && mappedSize) {
        fields.Size = mappedSize;
      }
      
      // Update the record if we have new data
      if (Object.keys(fields).length > 0) {
        try {
          await updateAirtableRecord(record.id, fields);
          summary.updated += 1;
        } catch (err) {
          summary.errors.push({
            id: record.id,
            company: companyName,
            error: `Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
      }
      
      // Rate limiting delay between API calls
      await delay(RATE_LIMIT_DELAY);
    }
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('enrich-companies error:', error);
    return NextResponse.json(
      {
        ...summary,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
