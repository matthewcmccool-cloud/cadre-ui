import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase admin client (service_role key).
 * Use in API routes for full read/write access without RLS.
 */
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

