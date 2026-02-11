import { createSupabaseAdmin } from '@/lib/supabase';
import {
  requireIngestAuth,
  parseBody,
  requireArray,
  ingestResponse,
  type IngestError,
} from '@/lib/ingest';

/**
 * POST /api/ingest/investors
 *
 * Accepts: { investors: [{ name, slug, type?, location?, website?,
 *            portfolio_company_ids?: string[] }] }
 *
 * - Upserts investors by slug.
 * - Upserts company_investors junction rows for each portfolio_company_id.
 *
 * Returns: { created, updated, errors }
 */

interface InvestorPayload {
  name: string;
  slug: string;
  type?: string | null;
  logo_url?: string | null;
  location?: string | null;
  website?: string | null;
  portfolio_company_ids?: string[];
}

export async function POST(req: Request) {
  const authErr = requireIngestAuth(req);
  if (authErr) return authErr;

  const [body, parseErr] = await parseBody<Record<string, unknown>>(req);
  if (parseErr) return parseErr;

  const items = requireArray<InvestorPayload>(body!, 'investors');
  if (items instanceof Response) return items;

  const supabase = createSupabaseAdmin();
  const errors: IngestError[] = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < items.length; i++) {
    const inv = items[i];
    if (!inv.name || !inv.slug) {
      errors.push({ index: i, message: 'name and slug are required' });
      continue;
    }

    // Check if exists
    const { data: existing } = await supabase
      .from('investors')
      .select('id')
      .eq('slug', inv.slug)
      .maybeSingle();

    const row = {
      name: inv.name,
      slug: inv.slug,
      type: inv.type ?? null,
      logo_url: inv.logo_url ?? null,
      location: inv.location ?? null,
      website: inv.website ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: upserted, error } = await supabase
      .from('investors')
      .upsert(row, { onConflict: 'slug' })
      .select('id')
      .single();

    if (error) {
      errors.push({ index: i, message: error.message });
      continue;
    }

    if (existing) {
      updated++;
    } else {
      created++;
    }

    // Upsert company_investors junction rows
    const companyIds = inv.portfolio_company_ids || [];
    if (companyIds.length > 0 && upserted) {
      const junctionRows = companyIds.map((companyId) => ({
        company_id: companyId,
        investor_id: upserted.id,
        relationship: 'investor',
      }));

      const { error: jErr } = await supabase
        .from('company_investors')
        .upsert(junctionRows, { onConflict: 'company_id,investor_id' });

      if (jErr) {
        errors.push({ index: i, message: `portfolio: ${jErr.message}` });
      }
    }
  }

  return ingestResponse({ created, updated }, errors);
}
