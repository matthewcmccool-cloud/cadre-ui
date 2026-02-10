import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInvestorBySlug, getJobsForCompanyNames } from '@/lib/airtable';
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
  };

  return (
    <main className="min-h-screen bg-[#0e0e0f] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(investorSchema) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-[#555]">
          <Link href="/" className="text-[#888] hover:text-white transition-colors">Jobs</Link>
          <span>/</span>
          <Link href="/investors" className="text-[#888] hover:text-white transition-colors">Investors</Link>
          <span>/</span>
          <span className="text-[#999]">{investor.name}</span>
        </nav>

        <InvestorPageContent investor={investor} jobs={jobs} />
      </div>
    </main>
  );
}
