import type { Metadata } from 'next';
import { getJobs, getFilterOptions } from '@/lib/data';
import JobTable from '@/components/JobTable';
import Pagination from '@/components/Pagination';
import SearchFilters from '@/components/SearchFilters';

const BASE_URL = 'https://cadre-ui-psi.vercel.app';

export const metadata: Metadata = {
  title: 'Browse Jobs — Open Roles at VC-Backed Companies',
  description: 'Browse 16,000+ open roles at top VC-backed companies. Filter by department, location, industry, and investor.',
  alternates: { canonical: `${BASE_URL}/jobs` },
  openGraph: {
    title: 'Browse Jobs — Open Roles at VC-Backed Companies | Cadre',
    description: 'Browse 16,000+ open roles at top VC-backed companies.',
    url: `${BASE_URL}/jobs`,
  },
  twitter: {
    title: 'Browse Jobs — Open Roles at VC-Backed Companies | Cadre',
    description: 'Browse 16,000+ open roles at top VC-backed companies.',
  },
};

// ISR: regenerate every 60 minutes
export const revalidate = 3600;

interface PageProps {
  searchParams: {
    department?: string;
    industry?: string;
    country?: string;
    workMode?: string;
    investor?: string;
    posted?: string;
    search?: string;
    page?: string;
    functionName?: string;
    remote?: string;
    location?: string;
    company?: string;
  };
}

export default async function JobsPage({ searchParams }: PageProps) {
  const [jobsResult, filterOptions] = await Promise.all([
    getJobs({
      industry: searchParams.industry,
      investor: searchParams.investor,
      search: searchParams.search,
      page: parseInt(searchParams.page || '1', 10),
      functionName: searchParams.functionName,
      remoteOnly: searchParams.remote === 'true',
      location: searchParams.location,
      company: searchParams.company,
    }),
    getFilterOptions(),
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Open Roles at VC-Backed Companies',
    description: `Browse ${jobsResult.totalCount.toLocaleString()} open roles at top VC-backed companies.`,
    url: `${BASE_URL}/jobs`,
    numberOfItems: jobsResult.totalCount,
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <SearchFilters
          companies={filterOptions.companies}
          investors={filterOptions.investors}
          industries={filterOptions.industries}
          jobs={jobsResult.jobs.map(j => ({
            location: j.location,
            remoteFirst: j.remoteFirst,
            investors: j.investors,
          }))}
          totalCount={jobsResult.totalCount}
        />

        <JobTable jobs={jobsResult.jobs} />

        <Pagination
          currentPage={jobsResult.page}
          totalPages={jobsResult.totalPages}
          searchParams={searchParams}
        />
      </div>
    </main>
  );
}
