import { getCompanyBySlug, getJobsByCompany, getSimilarCompanies } from '@/lib/data';
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

  const url = `https://cadre-ui-psi.vercel.app/companies/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'website', siteName: 'Cadre', url },
    twitter: { card: 'summary', title, description },
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const company = await getCompanyBySlug(params.slug);

  if (!company) {
    notFound();
  }

  const [jobs, similarCompanies] = await Promise.all([
    getJobsByCompany(company.name),
    getSimilarCompanies(company.name, company.industry, company.investors, 8).catch(() => []),
  ]);

  // Count functions for summary
  const functionCounts = new Map<string, number>();
  for (const job of jobs) {
    if (job.functionName) {
      functionCounts.set(job.functionName, (functionCounts.get(job.functionName) || 0) + 1);
    }
  }
  const topFunctions = Array.from(functionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  // GEO: Company structured data for LLM citation
  const companySchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: company.about || `${company.name} is a${company.stage ? ' ' + company.stage : ''} technology company${company.industry ? ' in ' + company.industry : ''} with ${jobs.length} open roles.`,
    url: `https://cadre-ui-psi.vercel.app/companies/${params.slug}`,
    ...(company.url && { sameAs: company.url }),
    ...(company.hqLocation && { location: { '@type': 'Place', name: company.hqLocation } }),
    ...(company.stage && { additionalType: company.stage }),
    ...(company.investors.length > 0 && {
      funder: company.investors.map(inv => ({ '@type': 'Organization', name: inv })),
    }),
    numberOfEmployees: company.size ? { '@type': 'QuantitativeValue', name: 'Company Size', value: company.size } : undefined,
  };

  // GEO: JobPosting schema for each open role (max 50 for performance)
  const jobPostingSchemas = jobs.slice(0, 50).map(job => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    ...(job.datePosted && { datePosted: job.datePosted }),
    hiringOrganization: { '@type': 'Organization', name: company.name },
    ...(job.location && { jobLocation: { '@type': 'Place', address: job.location } }),
    ...(job.applyUrl && { url: job.applyUrl }),
  }));

  // Quotable summary for AI extraction
  const quotableSummary = `${company.name} is a${company.stage ? ' ' + company.stage : ''} ${company.industry || 'technology'} company${company.investors.length > 0 ? ' backed by ' + company.investors.slice(0, 3).join(', ') : ''}, currently hiring for ${jobs.length} role${jobs.length !== 1 ? 's' : ''}${topFunctions.length > 0 ? ' across ' + topFunctions.join(', ') : ''}.`;

  return (
    <main className="min-h-screen bg-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([companySchema, ...jobPostingSchemas]) }}
      />
      {/* GEO: Quotable summary for AI search extraction */}
      <p className="sr-only">{quotableSummary}</p>
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <CompanyPageContent company={company} jobs={jobs} similarCompanies={similarCompanies} />
      </div>
    </main>
  );
}
