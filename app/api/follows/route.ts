import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/follows — returns array of company_ids the current user follows
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 30 requests per user per minute
  const rl = rateLimit(`follows:${userId}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('follows')
    .select('company_id, source, portfolio_investor_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 });
  }

  return NextResponse.json(
    { companyIds: data.map((f) => f.company_id), follows: data },
    { headers: { 'Cache-Control': 'private, no-cache, no-store' } },
  );
}

// POST /api/follows — body: { companyId, source?, portfolioInvestorId? }
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 30 requests per user per minute (shared with GET)
  const rl = rateLimit(`follows:${userId}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  const body = await req.json();
  const { companyId, source, portfolioInvestorId } = body;

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('follows')
    .upsert(
      {
        user_id: userId,
        company_id: companyId,
        source: source || 'direct',
        portfolio_investor_id: portfolioInvestorId || null,
      },
      { onConflict: 'user_id,company_id' }
    );

  if (error) {
    console.error('Error creating follow:', error);
    return NextResponse.json({ error: 'Failed to follow company' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
