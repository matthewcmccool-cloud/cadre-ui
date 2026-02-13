import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { FREE_LIMITS, canBookmark, type BookmarkItemType } from '@/lib/plan-gating';

// GET /api/bookmarks — fetch all bookmarks for current user
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit(`bookmarks:${userId}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get('type') as BookmarkItemType | null;

  const supabase = createSupabaseAdmin();

  // Fetch bookmarks
  let query = supabase
    .from('user_bookmarks')
    .select('id, item_id, item_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (typeFilter && ['job', 'company', 'investor'].includes(typeFilter)) {
    query = query.eq('item_type', typeFilter);
  }

  const { data: bookmarks, error } = await query;

  if (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }

  // Count by type
  const counts = { job: 0, company: 0, investor: 0 };
  for (const b of bookmarks || []) {
    if (b.item_type in counts) {
      counts[b.item_type as BookmarkItemType]++;
    }
  }

  // Determine plan
  const { data: userData } = await supabase
    .from('users')
    .select('plan, trial_ends_at')
    .eq('clerk_id', userId)
    .single();

  let plan: 'free' | 'pro' = 'free';
  if (userData) {
    const status = userData.plan || 'free';
    if (status === 'active' || status === 'trialing') {
      // Check trial expiry
      if (status === 'trialing' && userData.trial_ends_at) {
        const trialEnd = new Date(userData.trial_ends_at).getTime();
        if (trialEnd > Date.now()) {
          plan = 'pro';
        }
      } else {
        plan = 'pro';
      }
    }
  }

  const limits = plan === 'pro'
    ? { job: null, company: null, investor: null }
    : { job: FREE_LIMITS.job, company: FREE_LIMITS.company, investor: FREE_LIMITS.investor };

  return NextResponse.json(
    { bookmarks: bookmarks || [], counts, plan, limits },
    { headers: { 'Cache-Control': 'private, no-cache, no-store' } },
  );
}

// POST /api/bookmarks — save/follow an item
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit(`bookmarks:${userId}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  const body = await req.json();
  const { item_id, item_type } = body as { item_id: string; item_type: BookmarkItemType };

  if (!item_id || !item_type) {
    return NextResponse.json({ error: 'item_id and item_type are required' }, { status: 400 });
  }

  if (!['job', 'company', 'investor'].includes(item_type)) {
    return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Check for duplicate
  const { data: existing } = await supabase
    .from('user_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('item_id', item_id)
    .eq('item_type', item_type)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already bookmarked' }, { status: 409 });
  }

  // Check plan limits
  const { data: userData } = await supabase
    .from('users')
    .select('plan, trial_ends_at')
    .eq('clerk_id', userId)
    .single();

  let plan: 'free' | 'pro' = 'free';
  if (userData) {
    const status = userData.plan || 'free';
    if (status === 'active' || status === 'trialing') {
      if (status === 'trialing' && userData.trial_ends_at) {
        const trialEnd = new Date(userData.trial_ends_at).getTime();
        if (trialEnd > Date.now()) {
          plan = 'pro';
        }
      } else {
        plan = 'pro';
      }
    }
  }

  if (plan === 'free') {
    const { count } = await supabase
      .from('user_bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('item_type', item_type);

    if (!canBookmark(plan, item_type, count || 0)) {
      return NextResponse.json(
        { error: 'free_limit_reached', item_type, limit: FREE_LIMITS[item_type] },
        { status: 403 },
      );
    }
  }

  // Insert bookmark
  const { data: bookmark, error } = await supabase
    .from('user_bookmarks')
    .insert({
      user_id: userId,
      item_id,
      item_type,
    })
    .select('id, item_id, item_type, created_at')
    .single();

  if (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }

  return NextResponse.json(bookmark, { status: 201 });
}
