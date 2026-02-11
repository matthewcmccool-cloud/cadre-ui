import { NextResponse } from 'next/server';

/**
 * Shared utilities for OpenClaw ingestion API routes.
 *
 * All /api/ingest/* routes use Bearer token auth against OPENCLAW_API_KEY.
 * The service_role Supabase client bypasses RLS for writes.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Validate the Authorization: Bearer <token> header. Returns null on success, or an error Response. */
export function requireIngestAuth(req: Request): NextResponse | null {
  const key = process.env.OPENCLAW_API_KEY;
  if (!key) {
    console.error('OPENCLAW_API_KEY is not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token || token !== key) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // auth passed
}

// ---------------------------------------------------------------------------
// Body parsing helpers
// ---------------------------------------------------------------------------

/** Safely parse JSON body. Returns [data, null] or [null, errorResponse]. */
export async function parseBody<T>(req: Request): Promise<[T, null] | [null, NextResponse]> {
  try {
    const body = await req.json();
    return [body as T, null];
  } catch {
    return [null, NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })];
  }
}

/** Validate that body contains a non-empty array at the given key. */
export function requireArray<T>(body: Record<string, unknown>, key: string): T[] | NextResponse {
  const arr = body[key];
  if (!Array.isArray(arr)) {
    return NextResponse.json(
      { error: `"${key}" must be an array` },
      { status: 400 },
    );
  }
  return arr as T[];
}

// ---------------------------------------------------------------------------
// Error collection
// ---------------------------------------------------------------------------

export interface IngestError {
  index: number;
  message: string;
}

/** Build a standard ingest response. */
export function ingestResponse(
  data: Record<string, number>,
  errors: IngestError[],
  status = 200,
) {
  return NextResponse.json({ ...data, errors }, { status });
}
