import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getIndustryBySlug, getJobsForCompanyNames } from '@/lib/airtable';
import IndustryPageContent from '@/components/IndustryPageContent';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface IndustryPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const industry = await getIndustryBySlug(params.slug);
  if (!industry) return {};

  const title = `${industry.name} Startup Jobs — ${industry.companies.length} Companies | Cadre`;
  const description = `${industry.companies.length} VC-backed ${industry.name.toLowerCase()} companies with open roles. Browse jobs at venture-funded startups in ${industry.name} on Cadre.`;

  const url = `https://cadre-ui-psi.vercel.app/industry/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'website', siteName: 'Cadre', url },
    twitter: { card: 'summary', title, description },
  };
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const industry = await getIndustryBySlug(params.slug);

  if (!industry) {
    notFound();
  }

  // Get ALL jobs for companies in this industry
  const companyNames = industry.companies.map(c => c.name);
  const jobs = await getJobsForCompanyNames(companyNames);

  return (
    <main className="min-h-screen bg-[#0e0e0f] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${industry.name} Startup Jobs`,
          description: `${industry.companies.length} VC-backed ${industry.name.toLowerCase()} companies with ${jobs.length} open roles on Cadre.`,
          url: `https://cadre-ui-psi.vercel.app/industry/${params.slug}`,
          numberOfItems: jobs.length,
        }) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="text-[#888] hover:text-white text-sm inline-flex items-center gap-1 transition-colors"
        >
          ← Back to jobs
        </Link>

        <IndustryPageContent industry={industry} jobs={jobs} />
      </div>
    </main>
  );
}
