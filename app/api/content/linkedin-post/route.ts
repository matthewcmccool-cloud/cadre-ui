import { NextResponse } from 'next/server';
import { getInvestorBySlug, getJobsForCompanyNames, toSlug } from '@/lib/airtable';

export const revalidate = 3600;

const SITE_URL = 'https://cadre-ui-psi.vercel.app';

interface CompanyRoleSummary {
  name: string;
  slug: string;
  roleCount: number;
  url: string;
  remoteCount: number;
  topFunctions: string[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const investorSlug = searchParams.get('investor');
  const filter = searchParams.get('filter'); // 'remote', 'engineering', etc.
  const format = searchParams.get('format') || 'linkedin'; // 'linkedin' | 'json'
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  if (!investorSlug) {
    return NextResponse.json(
      { error: 'Missing required param: investor (slug)' },
      { status: 400 }
    );
  }

  try {
    const investor = await getInvestorBySlug(investorSlug);
    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    const companyNames = investor.companies.map(c => c.name);
    if (companyNames.length === 0) {
      return NextResponse.json({ error: 'No portfolio companies found' }, { status: 404 });
    }

    const allJobs = await getJobsForCompanyNames(companyNames);

    // Apply optional filter
    let filteredJobs = allJobs;
    if (filter === 'remote') {
      filteredJobs = allJobs.filter(j =>
        j.remoteFirst || /remote/i.test(j.location)
      );
    } else if (filter) {
      filteredJobs = allJobs.filter(j =>
        j.functionName?.toLowerCase().includes(filter.toLowerCase()) ||
        j.departmentName?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Group by company
    const companyMap = new Map<string, typeof filteredJobs>();
    for (const job of filteredJobs) {
      const existing = companyMap.get(job.company) || [];
      existing.push(job);
      companyMap.set(job.company, existing);
    }

    // Build summary sorted by role count descending
    const companies: CompanyRoleSummary[] = Array.from(companyMap.entries())
      .map(([name, jobs]) => {
        const fnCounts = new Map<string, number>();
        let remoteCount = 0;
        for (const j of jobs) {
          if (j.functionName) fnCounts.set(j.functionName, (fnCounts.get(j.functionName) || 0) + 1);
          if (j.remoteFirst || /remote/i.test(j.location)) remoteCount++;
        }
        const topFunctions = Array.from(fnCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([fn]) => fn);

        return {
          name,
          slug: toSlug(name),
          roleCount: jobs.length,
          url: `${SITE_URL}/companies/${toSlug(name)}`,
          remoteCount,
          topFunctions,
        };
      })
      .filter(c => c.roleCount > 0)
      .sort((a, b) => b.roleCount - a.roleCount)
      .slice(0, limit);

    const totalRoles = companies.reduce((sum, c) => sum + c.roleCount, 0);
    const totalCompanies = companies.length;

    if (format === 'json') {
      return NextResponse.json({
        investor: investor.name,
        totalRoles,
        totalCompanies,
        filter: filter || 'all',
        companies,
        generatedAt: new Date().toISOString(),
      });
    }

    // Generate LinkedIn post format (Jordan Carver style)
    const filterLabel = filter === 'remote' ? ' with REMOTE ROLES' : filter ? ` hiring for ${filter.toUpperCase()}` : '';
    let post = `${totalCompanies} ${investor.name} portfolio companies${filterLabel} — ${totalRoles.toLocaleString()} open roles!\n\n`;
    post += `Updated daily. No fluff — just direct links to verified open positions.\n\n`;

    companies.forEach((company, i) => {
      const roleLabel = company.roleCount === 1 ? 'Role' : 'Roles';
      const remoteSuffix = filter !== 'remote' && company.remoteCount > 0
        ? ` (${company.remoteCount} remote)`
        : '';
      post += `${i + 1}. ${company.name} — ${company.url} [${company.roleCount} ${roleLabel}]${remoteSuffix}\n`;
    });

    post += `\nPowered by Cadre — ${SITE_URL}\n`;
    post += `Filter by investor, function, industry & more.\n`;

    return NextResponse.json({
      investor: investor.name,
      totalRoles,
      totalCompanies,
      filter: filter || 'all',
      post,
      companies,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('LinkedIn post generation error:', error);
    return NextResponse.json({ error: 'Failed to generate post' }, { status: 500 });
  }
}
