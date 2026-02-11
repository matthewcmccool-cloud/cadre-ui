/**
 * Airtable → Supabase Data Migration Script
 * ===========================================
 *
 * MIGRATION SEQUENCE (dependencies matter — run in this order):
 *
 *   1. Industries     — no dependencies
 *   2. Investors      — no dependencies
 *   3. Companies      — no dependencies (core fields only)
 *   4. company_industries  — depends on companies + industries
 *   5. company_investors   — depends on companies + investors
 *   6. Jobs           — depends on companies
 *   7. Fundraises     — depends on companies (skipped until dedicated table exists)
 *   8. fundraise_investors — depends on fundraises + investors (skipped)
 *
 * PREREQUISITES:
 *   - Supabase core tables created (see docs/Cadre_Airtable_Supabase_Migration.md Step 1)
 *   - Environment variables set:
 *       AIRTABLE_API_KEY, AIRTABLE_BASE_ID
 *       NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * USAGE:
 *   npx tsx scripts/sync-airtable-to-supabase.ts
 *
 * IDEMPOTENCY:
 *   Every table uses upsert on a unique constraint (airtable_id or natural key).
 *   Running this script multiple times is safe — existing rows are updated, not duplicated.
 *
 * RATE LIMITS:
 *   Airtable: 5 requests/second. This script adds 200ms delay between paginated calls.
 *   Supabase: No practical rate limit for service_role key.
 */

import Airtable from 'airtable';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Airtable table names (must match Cadre's Airtable base)
const TABLES = {
  companies: 'Companies',
  investors: 'Investors',
  industries: 'Industry',
  jobs: 'Job Listings',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

/** Fetch all records from an Airtable table, handling pagination. */
async function fetchAll(tableName: string, fields?: string[]): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  const query: Record<string, unknown> = {};
  if (fields) query.fields = fields;

  await new Promise<void>((resolve, reject) => {
    base(tableName)
      .select(query)
      .eachPage(
        (page, next) => {
          for (const rec of page) {
            records.push({ id: rec.id, fields: rec.fields as Record<string, unknown> });
          }
          // Respect Airtable's 5 req/s limit
          setTimeout(next, 200);
        },
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
  });

  return records;
}

/** Upsert a batch of rows into Supabase. Logs errors but does not throw. */
async function upsertBatch<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  onConflict: string,
  batchSize = 500,
): Promise<number> {
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error, count } = await supabase
      .from(table)
      .upsert(batch, { onConflict, count: 'exact' });

    if (error) {
      console.error(`  ✗ ${table} batch ${i / batchSize + 1}: ${error.message}`);
    } else {
      inserted += count ?? batch.length;
    }
  }

  return inserted;
}

// ID mapping: airtable record ID → supabase UUID
const industryMap = new Map<string, string>();   // airtable ID → supabase UUID
const investorMap = new Map<string, string>();
const companyMap = new Map<string, string>();

// ---------------------------------------------------------------------------
// Step 1: Sync Industries
// ---------------------------------------------------------------------------

async function syncIndustries() {
  console.log('\n[1/6] Syncing industries...');
  const records = await fetchAll(TABLES.industries, ['Industry Name']);
  console.log(`  Fetched ${records.length} industries from Airtable`);

  const rows = records
    .filter((r) => r.fields['Industry Name'])
    .map((r) => {
      const name = r.fields['Industry Name'] as string;
      return {
        name,
        slug: toSlug(name),
      };
    });

  // Upsert by slug (natural key — industries don't have airtable_id in the target schema)
  const count = await upsertBatch('industries', rows, 'slug');
  console.log(`  Upserted ${count} industries`);

  // Build ID mapping: fetch back all industries to get Supabase UUIDs
  const { data: sbIndustries } = await supabase.from('industries').select('id, name');
  const nameToUuid = new Map<string, string>();
  for (const row of sbIndustries || []) {
    nameToUuid.set(row.name, row.id);
  }
  for (const r of records) {
    const name = r.fields['Industry Name'] as string;
    if (name && nameToUuid.has(name)) {
      industryMap.set(r.id, nameToUuid.get(name)!);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 2: Sync Investors
// ---------------------------------------------------------------------------

async function syncInvestors() {
  console.log('\n[2/6] Syncing investors...');
  const records = await fetchAll(TABLES.investors, [
    'Firm Name', 'Bio', 'Location', 'Website', 'LinkedIn',
  ]);
  console.log(`  Fetched ${records.length} investors from Airtable`);

  const rows = records
    .filter((r) => r.fields['Firm Name'])
    .map((r) => ({
      airtable_id: r.id,
      name: r.fields['Firm Name'] as string,
      slug: toSlug(r.fields['Firm Name'] as string),
      location: (r.fields['Location'] as string) || null,
      website: (r.fields['Website'] as string) || null,
    }));

  const count = await upsertBatch('investors', rows, 'airtable_id');
  console.log(`  Upserted ${count} investors`);

  // Build ID mapping
  const { data: sbInvestors } = await supabase
    .from('investors')
    .select('id, airtable_id');
  for (const row of sbInvestors || []) {
    if (row.airtable_id) investorMap.set(row.airtable_id, row.id);
  }
}

// ---------------------------------------------------------------------------
// Step 3: Sync Companies
// ---------------------------------------------------------------------------

async function syncCompanies() {
  console.log('\n[3/6] Syncing companies...');
  const records = await fetchAll(TABLES.companies, [
    'Company', 'URL', 'About', 'Stage', 'Size', 'HQ Location',
    'Total Raised', 'LinkedIn URL', 'Twitter URL', 'Slug',
    'VCs', 'Industry',
  ]);
  console.log(`  Fetched ${records.length} companies from Airtable`);

  const rows = records
    .filter((r) => r.fields['Company'])
    .map((r) => ({
      airtable_id: r.id,
      name: r.fields['Company'] as string,
      slug: (r.fields['Slug'] as string) || toSlug(r.fields['Company'] as string),
      website: (r.fields['URL'] as string) || null,
      description: (r.fields['About'] as string) || null,
      location: (r.fields['HQ Location'] as string) || null,
      stage: (r.fields['Stage'] as string) || null,
      status: 'active',
    }));

  const count = await upsertBatch('companies', rows, 'airtable_id');
  console.log(`  Upserted ${count} companies`);

  // Build ID mapping
  const { data: sbCompanies } = await supabase
    .from('companies')
    .select('id, airtable_id');
  for (const row of sbCompanies || []) {
    if (row.airtable_id) companyMap.set(row.airtable_id, row.id);
  }

  // Return raw records for junction table processing
  return records;
}

// ---------------------------------------------------------------------------
// Step 4: Sync company_industries junction
// ---------------------------------------------------------------------------

async function syncCompanyIndustries(companyRecords: AirtableRecord[]) {
  console.log('\n[4/6] Syncing company_industries...');
  const rows: { company_id: string; industry_id: string }[] = [];

  for (const r of companyRecords) {
    const companyUuid = companyMap.get(r.id);
    if (!companyUuid) continue;

    const industryIds = (r.fields['Industry'] || []) as string[];
    for (const airId of industryIds) {
      const industryUuid = industryMap.get(airId);
      if (industryUuid) {
        rows.push({ company_id: companyUuid, industry_id: industryUuid });
      }
    }
  }

  if (rows.length === 0) {
    console.log('  No company-industry links found');
    return;
  }

  const count = await upsertBatch(
    'company_industries',
    rows,
    'company_id,industry_id',
  );
  console.log(`  Upserted ${count} company-industry links`);
}

// ---------------------------------------------------------------------------
// Step 5: Sync company_investors junction
// ---------------------------------------------------------------------------

async function syncCompanyInvestors(companyRecords: AirtableRecord[]) {
  console.log('\n[5/6] Syncing company_investors...');
  const rows: { company_id: string; investor_id: string; relationship: string }[] = [];

  for (const r of companyRecords) {
    const companyUuid = companyMap.get(r.id);
    if (!companyUuid) continue;

    const vcIds = (r.fields['VCs'] || []) as string[];
    for (const airId of vcIds) {
      const investorUuid = investorMap.get(airId);
      if (investorUuid) {
        rows.push({
          company_id: companyUuid,
          investor_id: investorUuid,
          relationship: 'investor',
        });
      }
    }
  }

  if (rows.length === 0) {
    console.log('  No company-investor links found');
    return;
  }

  const count = await upsertBatch(
    'company_investors',
    rows,
    'company_id,investor_id',
  );
  console.log(`  Upserted ${count} company-investor links`);
}

// ---------------------------------------------------------------------------
// Step 6: Sync Jobs
// ---------------------------------------------------------------------------

async function syncJobs() {
  console.log('\n[6/6] Syncing jobs...');
  const records = await fetchAll(TABLES.jobs, [
    'Job ID', 'Title', 'Companies', 'Location', 'Job URL', 'Apply URL',
    'Salary', 'Raw JSON', 'Date Posted', 'content', 'Job Description',
  ]);
  console.log(`  Fetched ${records.length} jobs from Airtable`);

  const rows = records
    .filter((r) => r.fields['Title'])
    .map((r) => {
      // Resolve company linked record to Supabase UUID
      const companyField = r.fields['Companies'];
      let companyUuid: string | null = null;
      if (Array.isArray(companyField) && companyField.length > 0) {
        companyUuid = companyMap.get(companyField[0]) || null;
      }

      // Extract description from multiple sources
      let description = (r.fields['content'] as string) || '';
      if (!description && r.fields['Raw JSON']) {
        try {
          const raw = JSON.parse(r.fields['Raw JSON'] as string);
          description = raw?.content || raw?.description || '';
        } catch {
          // Ignore parse errors
        }
      }
      if (!description) {
        description = (r.fields['Job Description'] as string) || '';
      }

      return {
        airtable_id: r.id,
        company_id: companyUuid,
        title: r.fields['Title'] as string,
        location: (r.fields['Location'] as string) || null,
        ats_url: (r.fields['Apply URL'] as string) || (r.fields['Job URL'] as string) || null,
        ats_job_id: (r.fields['Job ID'] as string) || null,
        description: description || null,
        posted_date: (r.fields['Date Posted'] as string) || null,
        status: 'active',
      };
    })
    // Skip jobs with no resolved company (orphaned records)
    .filter((r) => r.company_id !== null);

  const count = await upsertBatch('jobs', rows, 'airtable_id');
  console.log(`  Upserted ${count} jobs`);

  const skipped = records.length - rows.length;
  if (skipped > 0) {
    console.log(`  Skipped ${skipped} jobs (no matching company in Supabase)`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Airtable → Supabase Sync ===');
  console.log(`Started at ${new Date().toISOString()}\n`);

  const start = Date.now();

  try {
    await syncIndustries();
    await syncInvestors();
    const companyRecords = await syncCompanies();
    await syncCompanyIndustries(companyRecords);
    await syncCompanyInvestors(companyRecords);
    await syncJobs();
  } catch (err) {
    console.error('\n✗ Sync failed:', err);
    process.exit(1);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== Sync complete in ${elapsed}s ===`);
  console.log('Run validation queries from docs/Cadre_Airtable_Supabase_Migration.md Step 3');
}

main();
