import { createSupabaseAdmin } from '@/lib/supabase';
import {
  requireIngestAuth,
  parseBody,
  requireArray,
  ingestResponse,
  type IngestError,
} from '@/lib/ingest';

/**
 * POST /api/ingest/fundraises
 *
 * Accepts: { fundraises: [{ company_id, round_type?, amount?, date_announced?,
 *            source_url?, source_name?, lead_investor_ids?, co_investor_ids? }] }
 *
 * - Upserts into fundraises table by (company_id, round_type, date_announced).
 * - Upserts fundraise_investors junction rows for lead and co-investors.
 *
 * Returns: { created, updated, errors }
 */

interface FundraisePayload {
  company_id: string;
  round_type?: string | null;
  amount?: number | null;
  date_announced?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  lead_investor_ids?: string[];
  co_investor_ids?: string[];
}

export async function POST(req: Request) {
  const authErr = requireIngestAuth(req);
  if (authErr) return authErr;

  const [body, parseErr] = await parseBody<Record<string, unknown>>(req);
  if (parseErr) return parseErr;

  const items = requireArray<FundraisePayload>(body!, 'fundraises');
  if (items instanceof Response) return items;

  const supabase = createSupabaseAdmin();
  const errors: IngestError[] = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < items.length; i++) {
    const f = items[i];
    if (!f.company_id) {
      errors.push({ index: i, message: 'company_id is required' });
      continue;
    }

    // Check if exists by natural key
    const { data: existing } = await supabase
      .from('fundraises')
      .select('id')
      .eq('company_id', f.company_id)
      .eq('round_type', f.round_type ?? '')
      .eq('date_announced', f.date_announced ?? '')
      .maybeSingle();

    const row = {
      company_id: f.company_id,
      round_type: f.round_type ?? null,
      amount: f.amount ?? null,
      date_announced: f.date_announced ?? null,
      source_url: f.source_url ?? null,
      source_name: f.source_name ?? null,
    };

    let fundraiseId: string | null = null;

    if (existing) {
      const { error } = await supabase
        .from('fundraises')
        .update(row)
        .eq('id', existing.id);
      if (error) {
        errors.push({ index: i, message: error.message });
        continue;
      }
      fundraiseId = existing.id;
      updated++;
    } else {
      const { data, error } = await supabase
        .from('fundraises')
        .insert(row)
        .select('id')
        .single();
      if (error) {
        errors.push({ index: i, message: error.message });
        continue;
      }
      fundraiseId = data.id;
      created++;
    }

    // Upsert fundraise_investors junction rows
    if (fundraiseId) {
      const junctionRows: { fundraise_id: string; investor_id: string; role: string }[] = [];

      for (const invId of f.lead_investor_ids || []) {
        junctionRows.push({ fundraise_id: fundraiseId, investor_id: invId, role: 'lead' });
      }
      for (const invId of f.co_investor_ids || []) {
        junctionRows.push({ fundraise_id: fundraiseId, investor_id: invId, role: 'participant' });
      }

      if (junctionRows.length > 0) {
        const { error } = await supabase
          .from('fundraise_investors')
          .upsert(junctionRows, { onConflict: 'fundraise_id,investor_id' });
        if (error) {
          errors.push({ index: i, message: `investors: ${error.message}` });
        }
      }
    }
  }

  return ingestResponse({ created, updated }, errors);
}
