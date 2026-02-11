import { createSupabaseAdmin } from '@/lib/supabase';
import {
  requireIngestAuth,
  parseBody,
  requireArray,
  ingestResponse,
  type IngestError,
} from '@/lib/ingest';

/**
 * POST /api/ingest/jobs
 *
 * Accepts: { jobs: [{ company_id, title, ats_job_id?, ats_url?, location?,
 *            remote_status?, function?, description?, posted_date?, status? }] }
 *
 * Behaviour:
 *   - Upserts each job by (ats_job_id, company_id) composite key.
 *   - Marks jobs that existed yesterday but are missing today as "closed"
 *     when the caller passes `close_missing_for_company: <company_id>`.
 *
 * Returns: { created, updated, closed, errors }
 */

interface JobPayload {
  company_id: string;
  title: string;
  ats_job_id?: string | null;
  ats_url?: string | null;
  location?: string | null;
  remote_status?: string | null;
  function?: string | null;
  description?: string | null;
  posted_date?: string | null;
  status?: string | null;
}

export async function POST(req: Request) {
  const authErr = requireIngestAuth(req);
  if (authErr) return authErr;

  const [body, parseErr] = await parseBody<Record<string, unknown>>(req);
  if (parseErr) return parseErr;

  const items = requireArray<JobPayload>(body!, 'jobs');
  if (items instanceof Response) return items;

  const supabase = createSupabaseAdmin();
  const errors: IngestError[] = [];
  let created = 0;
  let updated = 0;
  let closed = 0;

  // Track which (company_id, ats_job_id) pairs we see in this batch
  const seenByCompany = new Map<string, Set<string>>();

  for (let i = 0; i < items.length; i++) {
    const j = items[i];
    if (!j.company_id || !j.title) {
      errors.push({ index: i, message: 'company_id and title are required' });
      continue;
    }

    // Track for close-missing logic
    if (j.ats_job_id) {
      if (!seenByCompany.has(j.company_id)) seenByCompany.set(j.company_id, new Set());
      seenByCompany.get(j.company_id)!.add(j.ats_job_id);
    }

    // Check if exists (by ats_job_id + company_id if available)
    let existing = false;
    if (j.ats_job_id) {
      const { data } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', j.company_id)
        .eq('ats_job_id', j.ats_job_id)
        .maybeSingle();
      existing = !!data;
    }

    const row = {
      company_id: j.company_id,
      title: j.title,
      ats_job_id: j.ats_job_id ?? null,
      ats_url: j.ats_url ?? null,
      location: j.location ?? null,
      remote_status: j.remote_status ?? null,
      function: j.function ?? null,
      description: j.description ?? null,
      posted_date: j.posted_date ?? null,
      status: j.status ?? 'active',
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert by ats_job_id + company_id when ats_job_id is present
    const onConflict = j.ats_job_id ? 'ats_job_id,company_id' : undefined;
    const query = onConflict
      ? supabase.from('jobs').upsert(row, { onConflict })
      : supabase.from('jobs').insert(row);

    const { error } = await query;

    if (error) {
      errors.push({ index: i, message: error.message });
    } else if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  // Close missing jobs: for each company in the batch, mark jobs that
  // have an ats_job_id, are currently active, but weren't in this batch.
  const closeMissing = body!['close_missing_for_companies'];
  if (Array.isArray(closeMissing)) {
    for (const companyId of closeMissing) {
      if (typeof companyId !== 'string') continue;
      const seenIds = seenByCompany.get(companyId);

      // Fetch all active jobs with ats_job_id for this company
      const { data: activeJobs } = await supabase
        .from('jobs')
        .select('id, ats_job_id')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .not('ats_job_id', 'is', null);

      if (!activeJobs) continue;

      const toClose = activeJobs.filter(
        (j) => j.ats_job_id && (!seenIds || !seenIds.has(j.ats_job_id))
      );

      if (toClose.length > 0) {
        const ids = toClose.map((j) => j.id);
        const { error } = await supabase
          .from('jobs')
          .update({ status: 'closed', updated_at: new Date().toISOString() })
          .in('id', ids);

        if (error) {
          errors.push({ index: -1, message: `close-missing for ${companyId}: ${error.message}` });
        } else {
          closed += toClose.length;
        }
      }
    }
  }

  return ingestResponse({ created, updated, closed }, errors);
}
