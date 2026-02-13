import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getFollowedData, getJobById, getAllInvestorsForDirectory } from '@/lib/data';
import type { BookmarkItemType } from '@/lib/plan-gating';

interface BookmarkRow {
  id: string;
  item_id: string;
  item_type: BookmarkItemType;
  created_at: string;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Fetch all bookmarks for this user
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('user_bookmarks')
    .select('id, item_id, item_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (bookmarksError) {
    console.error('Error fetching bookmarks:', bookmarksError);
    // Fall back to old follows system
    const { data: followsData } = await supabase
      .from('follows')
      .select('company_id')
      .eq('user_id', userId);
    const companyIds = (followsData || []).map((f: { company_id: string }) => f.company_id);
    const data = await getFollowedData(companyIds);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-cache, no-store' },
    });
  }

  const allBookmarks = (bookmarks || []) as BookmarkRow[];

  // Split by type
  const companyIds = allBookmarks.filter((b) => b.item_type === 'company').map((b) => b.item_id);
  const jobIds = allBookmarks.filter((b) => b.item_type === 'job').map((b) => b.item_id);
  const investorIds = allBookmarks.filter((b) => b.item_type === 'investor').map((b) => b.item_id);

  // If no bookmarks, also check old follows table for backward compat
  if (allBookmarks.length === 0) {
    const { data: followsData } = await supabase
      .from('follows')
      .select('company_id')
      .eq('user_id', userId);
    const legacyCompanyIds = (followsData || []).map((f: { company_id: string }) => f.company_id);
    if (legacyCompanyIds.length > 0) {
      companyIds.push(...legacyCompanyIds);
    }
  }

  // Hydrate data in parallel
  const [followedData, savedJobs, allInvestors] = await Promise.all([
    // Companies + their jobs (reuse existing function)
    getFollowedData(companyIds),

    // Saved jobs — fetch each by ID (limited to 20 for performance)
    Promise.all(
      jobIds.slice(0, 20).map(async (id) => {
        try {
          const job = await getJobById(id);
          return job;
        } catch {
          return null;
        }
      })
    ),

    // All investors (for filtering)
    investorIds.length > 0 ? getAllInvestorsForDirectory() : Promise.resolve([]),
  ]);

  // Filter saved jobs to non-null
  const hydratedJobs = savedJobs
    .filter((j): j is NonNullable<typeof j> => j !== null)
    .map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      companyUrl: j.companyUrl,
      location: j.location,
      functionName: j.functionName,
      datePosted: j.datePosted,
      jobUrl: j.jobUrl,
      salary: j.salary,
    }));

  // Filter investors to only bookmarked ones
  const investorIdSet = new Set(investorIds);
  const hydratedInvestors = allInvestors
    .filter((inv) => investorIdSet.has(inv.id))
    .map((inv) => ({
      id: inv.id,
      name: inv.name,
      slug: inv.slug,
      url: inv.url,
      companyCount: inv.companyCount,
      jobCount: 0,
    }));

  // New jobs from followed companies (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newFromCompanies: typeof hydratedJobs = [];
  for (const company of followedData.companies) {
    for (const job of company.recentJobs) {
      if (job.postedDate && new Date(job.postedDate).getTime() >= sevenDaysAgo) {
        newFromCompanies.push({
          id: job.id,
          title: job.title,
          company: company.name,
          companyUrl: company.url || '',
          location: job.location,
          functionName: job.function || '',
          datePosted: job.postedDate || '',
          jobUrl: '',
          salary: '',
        });
      }
    }
  }
  // Sort by date, newest first
  newFromCompanies.sort((a, b) => {
    const da = a.datePosted ? new Date(a.datePosted).getTime() : 0;
    const db = b.datePosted ? new Date(b.datePosted).getTime() : 0;
    return db - da;
  });

  return NextResponse.json(
    {
      // Counts
      counts: {
        job: jobIds.length,
        company: companyIds.length,
        investor: investorIds.length,
      },
      // Hydrated sections
      newFromCompanies: newFromCompanies.slice(0, 20),
      savedJobs: hydratedJobs,
      followedCompanies: followedData.companies,
      followedInvestors: hydratedInvestors,
      // Legacy compat
      companies: followedData.companies,
      totalFollowed: followedData.totalFollowed,
      totalRoles: followedData.totalRoles,
      newThisWeek: followedData.newThisWeek,
    },
    { headers: { 'Cache-Control': 'private, no-cache, no-store' } },
  );
}
