import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInvestorBySlug, getJobsForCompanyNames, toSlug } from '@/lib/airtable';
import InvestorPageContent from '@/components/InvestorPageContent';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface InvestorPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: InvestorPageProps): Promise<Metadata> {
  const investor = await getInvestorBySlug(params.slug);
  if (!investor) return {};

  const title = `${investor.name} Portfolio Jobs | Cadre`;
  const description = `Browse ${investor.jobCount} open roles across ${investor.companies.length} ${investor.name} portfolio companies. Find jobs at VC-backed startups on Cadre.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: 'Cadre' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function InvestorPage({ params }: InvestorPageProps) {
  const investor = await getInvestorBySlug(params.slug);

  if (!investor) {
    notFound();
  }

  // Get ALL jobs from companies backed by this investor
  const companyNames = investor.companies.map(c => c.name);
  const jobs = await getJobsForCompanyNames(companyNames);

  // ── Compute portfolio stats server-side ───────────────────────
  const companiesWithJobs = new Map<string, number>();
  const departmentCounts = new Map<string, number>();
  let remoteCount = 0;

  for (const job of jobs) {
    // Count jobs per company
    companiesWithJobs.set(job.company, (companiesWithJobs.get(job.company) || 0) + 1);
    // Count departments
    const dept = job.departmentName || job.functionName;
    if (dept) departmentCounts.set(dept, (departmentCounts.get(dept) || 0) + 1);
    // Count remote
    if (job.remoteFirst || /remote/i.test(job.location)) remoteCount++;
  }

  const topDepartment = Array.from(departmentCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];

  const topCompanies = Array.from(companiesWithJobs.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => {
      const company = investor.companies.find(c => c.name === name);
      return { name, slug: company?.slug || toSlug(name), roleCount: count };
    });

  const stats = {
    totalRoles: jobs.length,
    companiesHiring: companiesWithJobs.size,
    totalCompanies: investor.companies.length,
    topDepartment: topDepartment
      ? { name: topDepartment[0], count: topDepartment[1], pct: Math.round((topDepartment[1] / jobs.length) * 100) }
      : null,
    remotePct: jobs.length > 0 ? Math.round((remoteCount / jobs.length) * 100) : 0,
    topCompanies,
  };

  // GEO: Investor structured data for LLM citation
  const investorSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: investor.name,
    description: `${investor.name} is a venture capital firm with ${investor.companies.length} portfolio companies and ${jobs.length} open roles tracked on Cadre.${investor.bio ? ' ' + investor.bio : ''}`,
    url: `https://cadre-ui-psi.vercel.app/investors/${params.slug}`,
    ...(investor.website && { sameAs: investor.website }),
    ...(investor.location && { location: { '@type': 'Place', name: investor.location } }),
    numberOfEmployees: { '@type': 'QuantitativeValue', name: 'Portfolio Companies', value: investor.companies.length },
  };

  return (
    <main className="min-h-screen bg-[#0e0e0f] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(investorSchema) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="text-[#888] hover:text-white text-sm inline-flex items-center gap-1 transition-colors"
        >
          ← Back to jobs
        </Link>

        <InvestorPageContent
          investor={investor}
          jobs={jobs}
          stats={stats}
          investorSlug={params.slug}
        />
      </div>
    </main>
  );
}
