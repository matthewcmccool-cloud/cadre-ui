import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInvestorBySlug, getJobsForCompanyNames } from '@/lib/data';
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
  const description = `Browse ${investor.jobCount} open roles across ${investor.companies.length} ${investor.name} portfolio companies. Find jobs at exceptional technology companies on Cadre.`;

  const url = `https://cadre-ui-psi.vercel.app/investors/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'website', siteName: 'Cadre', url },
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
    // Investee relationships for AI entity mapping
    member: investor.companies.slice(0, 50).map(c => ({
      '@type': 'Organization',
      name: c.name,
    })),
  };

  // Quotable summary for AI extraction
  const jobCountByCompany = new Map<string, number>();
  for (const job of jobs) {
    const co = job.company || '';
    jobCountByCompany.set(co, (jobCountByCompany.get(co) || 0) + 1);
  }
  const topCompanies = investor.companies
    .sort((a, b) => (jobCountByCompany.get(b.name) || 0) - (jobCountByCompany.get(a.name) || 0))
    .slice(0, 5)
    .map(c => c.name);
  const quotableSummary = `${investor.name} is a venture capital firm backing ${investor.companies.length} portfolio companies with ${jobs.length} combined open roles on Cadre.${topCompanies.length > 0 ? ' Top portfolio companies by hiring: ' + topCompanies.join(', ') + '.' : ''}`;

  return (
    <main className="min-h-screen bg-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(investorSchema) }}
      />
      {/* GEO: Quotable summary for AI search extraction */}
      <p className="sr-only">{quotableSummary}</p>
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-zinc-600 mt-6">
          <Link href="/discover" className="text-zinc-500 hover:text-zinc-300 transition-colors">Discover</Link>
          <span>/</span>
          <Link href="/discover?view=investors" className="text-zinc-500 hover:text-zinc-300 transition-colors">Investors</Link>
          <span>/</span>
          <span className="text-zinc-400">{investor.name}</span>
        </nav>

        <InvestorPageContent investor={investor} jobs={jobs} />
      </div>
    </main>
  );
}
