import { createSupabaseAdmin } from '@/lib/supabase';
import {
  requireIngestAuth,
  parseBody,
  requireArray,
  ingestResponse,
  type IngestError,
} from '@/lib/ingest';

/**
 * POST /api/ingest/companies
 *
 * Accepts: { companies: [{ name, slug, website?, description?, location?,
 *            stage?, ats_platform?, ats_slug?, careers_url?, status? }] }
 * Returns: { created, updated, errors }
 */

interface CompanyPayload {
  name: string;
  slug: string;
  website?: string | null;
  logo_url?: string | null;
  description?: string | null;
  location?: string | null;
  stage?: string | null;
  ats_platform?: string | null;
  ats_slug?: string | null;
  careers_url?: string | null;
  status?: string | null;
}

export async function POST(req: Request) {
  const authErr = requireIngestAuth(req);
  if (authErr) return authErr;

  const [body, parseErr] = await parseBody<Record<string, unknown>>(req);
  if (parseErr) return parseErr;

  const items = requireArray<CompanyPayload>(body!, 'companies');
  if (items instanceof Response) return items;

  const supabase = createSupabaseAdmin();
  const errors: IngestError[] = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < items.length; i++) {
    const c = items[i];
    if (!c.name || !c.slug) {
      errors.push({ index: i, message: 'name and slug are required' });
      continue;
    }

    // Check if exists
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', c.slug)
      .maybeSingle();

    const row = {
      name: c.name,
      slug: c.slug,
      website: c.website ?? null,
      logo_url: c.logo_url ?? null,
      description: c.description ?? null,
      location: c.location ?? null,
      stage: c.stage ?? null,
      ats_platform: c.ats_platform ?? null,
      ats_slug: c.ats_slug ?? null,
      careers_url: c.careers_url ?? null,
      status: c.status ?? 'active',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('companies')
      .upsert(row, { onConflict: 'slug' });

    if (error) {
      errors.push({ index: i, message: error.message });
    } else if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  return ingestResponse({ created, updated }, errors);
}
