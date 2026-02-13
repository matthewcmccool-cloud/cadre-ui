import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getJobsForCompanyIds } from '@/lib/data';

// GET /api/bookmarks/new-jobs — fetch recent jobs from followed companies
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Get user's followed company IDs from bookmarks
  const { data: companyBookmarks, error } = await supabase
    .from('user_bookmarks')
    .select('item_id')
    .eq('user_id', userId)
    .eq('item_type', 'company');

  if (error) {
    console.error('Error fetching company bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }

  const companyIds = (companyBookmarks || []).map((b: { item_id: string }) => b.item_id);

  if (companyIds.length === 0) {
    return NextResponse.json({ jobs: [], count: 0 });
  }

  // Fetch recent jobs from those companies (last 7 days)
  const allJobs = await getJobsForCompanyIds(companyIds);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const recentJobs = allJobs
    .filter((job) => {
      if (!job.datePosted) return false;
      return new Date(job.datePosted).getTime() >= sevenDaysAgo;
    })
    .sort((a, b) => {
      const da = a.datePosted ? new Date(a.datePosted).getTime() : 0;
      const db = b.datePosted ? new Date(b.datePosted).getTime() : 0;
      return db - da;
    })
    .slice(0, 20);

  return NextResponse.json(
    { jobs: recentJobs, count: recentJobs.length },
    { headers: { 'Cache-Control': 'private, no-cache, no-store' } },
  );
}
