import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getJobs } from '@/lib/data';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check subscription status server-side
  const supabase = createSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('plan')
    .eq('clerk_id', userId)
    .single();

  const plan = user?.plan || 'free';
  const isPro = plan === 'active' || plan === 'trialing';

  if (!isPro) {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
  }

  try {
    // Fetch first page of jobs (Airtable pagination limits apply)
    const result = await getJobs({ page: 1 });
    const jobs = result.jobs;

    // Build CSV
    const headers = ['Title', 'Company', 'Location', 'Department', 'Posted Date', 'Job URL'];
    const rows = jobs.map((job) => [
      escapeCsv(job.title),
      escapeCsv(job.company),
      escapeCsv(job.location || ''),
      escapeCsv(job.departmentName || ''),
      escapeCsv(job.datePosted || ''),
      escapeCsv(job.jobUrl || ''),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cadre-jobs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
