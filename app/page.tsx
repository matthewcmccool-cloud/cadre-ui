import { getJobs, getFilterOptions } from '@/lib/airtable';
import JobTable from '@/components/JobTable';
import Header from '@/components/Header';
import Pagination from '@/components/Pagination';
import SearchFilters from '@/components/SearchFilters';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    functionName?: string;
    industry?: string;
    location?: string;
    remote?: string;
    search?: string;
    company?: string;
    investor?: string;
    page?: string;
  };
}

export default async function Home({ searchParams }: PageProps) {
  const currentPage = parseInt(searchParams.page || '1', 10);

  const filters = {
    functionName: searchParams.functionName,
    industry: searchParams.industry,
    location: searchParams.location,
    remoteOnly: searchParams.remote === 'true',
    search: searchParams.search,
    company: searchParams.company,
    investor: searchParams.investor,
    page: currentPage,
  };

  const [jobsResult, filterOptions] = await Promise.all([
    getJobs(filters),
    getFilterOptions(),
  ]);

  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <Header />

      <div className="max-w-6xl mx-auto px-4 pt-6 pb-8">
        <SearchFilters
          companies={filterOptions.companies}
          investors={filterOptions.investors}
          industries={filterOptions.industries}
        />

        {/* Pagination info */}
        {jobsResult.totalPages > 1 && (
          <div className="flex items-center justify-end mb-3">
            <p className="text-xs text-[#666]">
              Page {jobsResult.page} of {jobsResult.totalPages}
            </p>
          </div>
        )}

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
