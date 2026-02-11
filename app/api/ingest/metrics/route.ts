import { createSupabaseAdmin } from '@/lib/supabase';
import {
  requireIngestAuth,
  parseBody,
  requireArray,
  ingestResponse,
  type IngestError,
} from '@/lib/ingest';

/**
 * POST /api/ingest/metrics
 *
 * Accepts: { date: "YYYY-MM-DD", metrics: [{ company_id, active_roles,
 *            new_roles, closed_roles, roles_by_function? }] }
 *
 * Upserts into company_daily_metrics by (company_id, date) composite key.
 *
 * Returns: { inserted, errors }
 */

interface MetricPayload {
  company_id: string;
  active_roles?: number;
  new_roles?: number;
  closed_roles?: number;
  roles_by_function?: Record<string, number>;
}

export async function POST(req: Request) {
  const authErr = requireIngestAuth(req);
  if (authErr) return authErr;

  const [body, parseErr] = await parseBody<Record<string, unknown>>(req);
  if (parseErr) return parseErr;

  const date = body!['date'];
  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return ingestResponse({ inserted: 0 }, [{ index: -1, message: '"date" must be YYYY-MM-DD' }], 400);
  }

  const items = requireArray<MetricPayload>(body!, 'metrics');
  if (items instanceof Response) return items;

  const supabase = createSupabaseAdmin();
  const errors: IngestError[] = [];
  let inserted = 0;

  // Build rows and batch upsert for efficiency
  const rows: {
    company_id: string;
    date: string;
    active_roles: number;
    new_roles: number;
    closed_roles: number;
    roles_by_function: Record<string, number> | null;
  }[] = [];

  for (let i = 0; i < items.length; i++) {
    const m = items[i];
    if (!m.company_id) {
      errors.push({ index: i, message: 'company_id is required' });
      continue;
    }

    rows.push({
      company_id: m.company_id,
      date,
      active_roles: m.active_roles ?? 0,
      new_roles: m.new_roles ?? 0,
      closed_roles: m.closed_roles ?? 0,
      roles_by_function: m.roles_by_function ?? null,
    });
  }

  // Batch upsert in chunks of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from('company_daily_metrics')
      .upsert(batch, { onConflict: 'company_id,date', count: 'exact' });

    if (error) {
      errors.push({ index: i, message: error.message });
    } else {
      inserted += count ?? batch.length;
    }
  }

  return ingestResponse({ inserted }, errors);
}
