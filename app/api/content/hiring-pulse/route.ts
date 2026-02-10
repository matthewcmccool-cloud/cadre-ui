import { NextResponse } from 'next/server';
import { getJobs, getFilterOptions } from '@/lib/airtable';

export const revalidate = 3600;

/**
 * GET /api/content/hiring-pulse
 *
 * Generates structured hiring pulse data for the weekly email digest.
 * Designed to be consumed by Loops.so transactional email or any automation.
 *
 * Returns: summary stats, top hiring companies, department breakdown,
 * new-this-week highlights, and a pre-formatted text version.
 */
export async function GET() {
  try {
    // Fetch recent jobs (last 7 days) and all jobs for totals
    const [recentResult, allResult, filterOptions] = await Promise.all([
      getJobs({ posted: '7d', sort: 'recent', page: 1 }),
      getJobs({ sort: 'recent', page: 1 }),
      getFilterOptions(),
    ]);

    const recentJobs = recentResult.jobs;

    // ── Top hiring companies this week ──
    const companyRoleCounts = new Map<string, number>();
    for (const job of recentJobs) {
      companyRoleCounts.set(job.company, (companyRoleCounts.get(job.company) || 0) + 1);
    }
    const topCompanies = Array.from(companyRoleCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, newRoles: count }));

    // ── Department breakdown ──
    const deptCounts = new Map<string, number>();
    for (const job of recentJobs) {
      const dept = job.functionName || 'Other';
      deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1);
    }
    const departments = Array.from(deptCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: recentJobs.length > 0 ? Math.round((count / recentJobs.length) * 100) : 0,
      }));

    // ── Remote vs on-site breakdown ──
    const remoteCount = recentJobs.filter(j => j.remoteFirst || /remote/i.test(j.location)).length;
    const remotePct = recentJobs.length > 0 ? Math.round((remoteCount / recentJobs.length) * 100) : 0;

    // ── Investor activity (which portfolios are hiring most) ──
    const investorActivity = new Map<string, number>();
    for (const job of recentJobs) {
      for (const inv of job.investors || []) {
        investorActivity.set(inv, (investorActivity.get(inv) || 0) + 1);
      }
    }
    const topInvestors = Array.from(investorActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, newRoles: count }));

    // ── Build structured response ──
    const pulse = {
      generatedAt: new Date().toISOString(),
      period: '7d',
      summary: {
        totalOpenRoles: allResult.totalCount,
        newRolesThisWeek: recentJobs.length,
        totalCompanies: filterOptions.companies.length,
        totalInvestors: filterOptions.investors.length,
        remotePct,
      },
      topCompanies,
      topInvestors,
      departments,
    };

    // ── Pre-formatted text for email / LinkedIn ──
    let text = `VC Hiring Pulse — Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;
    text += `${pulse.summary.newRolesThisWeek.toLocaleString()} new roles this week across ${pulse.summary.totalCompanies.toLocaleString()} VC-backed companies.\n`;
    text += `${pulse.summary.totalOpenRoles.toLocaleString()} total open roles. ${remotePct}% remote-friendly.\n\n`;

    text += `Top hiring companies:\n`;
    topCompanies.forEach((c, i) => {
      text += `${i + 1}. ${c.name} (+${c.newRoles} roles)\n`;
    });

    text += `\nHottest departments:\n`;
    departments.slice(0, 5).forEach((d) => {
      text += `- ${d.name}: ${d.count} new roles (${d.pct}%)\n`;
    });

    if (topInvestors.length > 0) {
      text += `\nMost active portfolios:\n`;
      topInvestors.forEach((inv) => {
        text += `- ${inv.name}: ${inv.newRoles} new roles\n`;
      });
    }

    text += `\nFull data: https://cadre-ui-psi.vercel.app\n`;

    return NextResponse.json({ ...pulse, text });
  } catch (error) {
    console.error('Hiring pulse generation error:', error);
    return NextResponse.json({ error: 'Failed to generate pulse' }, { status: 500 });
  }
}
