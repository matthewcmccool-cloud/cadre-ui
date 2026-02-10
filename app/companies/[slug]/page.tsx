import { getCompanyBySlug, getJobsByCompany } from '@/lib/airtable';
import { notFound } from 'next/navigation';
import CompanyPageContent from '@/components/CompanyPageContent';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface CompanyPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const company = await getCompanyBySlug(params.slug);
  if (!company) return {};

  const parts = [`${company.name} has ${company.jobCount} open roles on Cadre.`];
  if (company.stage) parts.push(`${company.stage} startup.`);
  if (company.industry) parts.push(`Industry: ${company.industry}.`);
  if (company.investors.length > 0) parts.push(`Backed by ${company.investors.slice(0, 3).join(', ')}.`);

  const title = `${company.name} Jobs — ${company.jobCount} Open Roles | Cadre`;
  const description = parts.join(' ');

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: 'Cadre' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const company = await getCompanyBySlug(params.slug);

  if (!company) {
    notFound();
  }

  const jobs = await getJobsByCompany(company.name);

  // GEO: Company structured data for LLM citation
  const companySchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: company.about || `${company.name} is a${company.stage ? ' ' + company.stage : ''} VC-backed startup${company.industry ? ' in ' + company.industry : ''} with ${jobs.length} open roles.`,
    url: `https://cadre-ui-psi.vercel.app/companies/${params.slug}`,
    ...(company.url && { sameAs: company.url }),
    ...(company.hqLocation && { location: { '@type': 'Place', name: company.hqLocation } }),
    ...(company.stage && { additionalType: company.stage }),
    ...(company.investors.length > 0 && {
      funder: company.investors.map(inv => ({ '@type': 'Organization', name: inv })),
    }),
    numberOfEmployees: company.size ? { '@type': 'QuantitativeValue', name: 'Company Size', value: company.size } : undefined,
  };

  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(companySchema) }}
      />
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <CompanyPageContent company={company} jobs={jobs} />
      </div>
    </main>
  );
}
