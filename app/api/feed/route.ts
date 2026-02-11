import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getFeedDataForCompanyIds } from '@/lib/data';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Get user's followed company IDs
  const { data: followsData, error: followsError } = await supabase
    .from('follows')
    .select('company_id')
    .eq('user_id', userId);

  if (followsError) {
    console.error('Error fetching follows:', followsError);
    return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 });
  }

  const companyIds = (followsData || []).map((f) => f.company_id);
  const feedData = await getFeedDataForCompanyIds(companyIds);

  return NextResponse.json(feedData, {
    headers: { 'Cache-Control': 'private, no-cache, no-store' },
  });
}
