import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

const INVESTORS_TABLE = 'tblH6MmoXCn3Ve0K2';
const COMPANIES_TABLE = 'tbl4dA7iDr7mjF6Gt';
const RATE_LIMIT_DELAY = 600;
const TIMEOUT_MS = 55000;

interface Investor {
  id: string;
  fields: {
    Company?: string;
    'Portfolio URL'?: string;
    'Portfolio Companies'?: string[];
  };
}

interface Company {
  id: string;
  fields: {
    Company: string;
    VCs?: string[];
  };
}

interface ScrapeResult {
  investor: string;
  companiesFound: number;
  newCompanies: number;
  duplicates: number;
}

interface ScrapeError {
  investor: string;
  error: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchInvestors(): Promise<Investor[]> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${INVESTORS_TABLE}`;
  let investors: Investor[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.append('offset', offset);
      params.append('filterByFormula', "NOT({Portfolio URL} = '')");
    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();
    investors = investors.concat(data.records);
    offset = data.offset;
  } while (offset);

  return investors;
}

async function fetchExistingCompanies(): Promise<Map<string, Company>> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}`;
  let companies: Company[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.append('offset', offset);

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();
    companies = companies.concat(data.records);
    offset = data.offset;
  } while (offset);

  const companyMap = new Map<string, Company>();
  companies.forEach(company => {
    if (company.fields.Company) {
      companyMap.set(company.fields.Company.toLowerCase(), company);
    }
  });

  return companyMap;
}

async function extractCompaniesFromPortfolio(portfolioUrl: string): Promise<string[]> {
  const prompt = `Visit this VC portfolio page: ${portfolioUrl}\n\nList ALL portfolio company names from this page. Return ONLY a JSON array of company names, nothing else. Example format:\n["Company A", "Company B", "Company C"]\n\nIf the page is inaccessible or has no companies listed, return an empty array: []`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
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

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '[]';

  try {
    const companies = JSON.parse(content);
    return Array.isArray(companies) ? companies : [];
  } catch (error) {
    console.error('Failed to parse Perplexity response:', content);
    return [];
  }
}

async function addCompanyToAirtable(
  companyName: string,
  investorId: string,
  existingCompanies: Map<string, Company>
): Promise<{ isNew: boolean; companyId: string }> {
  const normalizedName = companyName.toLowerCase();
  const existingCompany = existingCompanies.get(normalizedName);

  if (existingCompany) {
    const currentVCs = existingCompany.fields.VCs || [];
    if (!currentVCs.includes(investorId)) {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}/${existingCompany.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
        body: JSON.stringify({
          fields: {
            VCs: [...currentVCs, investorId],
          },
        }),
      });
    }
    return { isNew: false, companyId: existingCompany.id };
  }

  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMPANIES_TABLE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    body: JSON.stringify({
      fields: {
        Company: companyName,
        VCs: [investorId],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create company: ${response.statusText}`);
  }

  const newCompany = await response.json();
  existingCompanies.set(normalizedName, newCompany);
  return { isNew: true, companyId: newCompany.id };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let processed = 0;
  let companiesAdded = 0;
  let companiesSkipped = 0;
  const errors: ScrapeError[] = [];
  const results: ScrapeResult[] = [];

  try {
    const investors = await fetchInvestors();
    const existingCompanies = await fetchExistingCompanies();

    for (const investor of investors) {
      if (Date.now() - startTime > TIMEOUT_MS) {
        break;
      }

      const investorName = investor.fields.Company || 'Unknown';
      const portfolioUrl = investor.fields['Portfolio URL'];

      if (!portfolioUrl) {
        continue;
      }

      try {
        await delay(RATE_LIMIT_DELAY);

        const companies = await extractCompaniesFromPortfolio(portfolioUrl);
        let newCompanies = 0;
        let duplicates = 0;

        for (const companyName of companies) {
          try {
            const result = await addCompanyToAirtable(companyName, investor.id, existingCompanies);
            if (result.isNew) {
              newCompanies++;
              companiesAdded++;
            } else {
              duplicates++;
              companiesSkipped++;
            }
          } catch (error) {
            console.error(`Failed to add company ${companyName}:`, error);
          }
        }

        results.push({
          investor: investorName,
          companiesFound: companies.length,
          newCompanies,
          duplicates,
        });

        processed++;
      } catch (error) {
        errors.push({
          investor: investorName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      companiesAdded,
      companiesSkipped,
      errors,
      results,
      runtime: Date.now() - startTime,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed,
        companiesAdded,
        companiesSkipped,
        errors,
        results,
        runtime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
