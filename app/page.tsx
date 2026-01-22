import { getJobs, getFilterOptions } from '@/lib/airtable';
import JobTable from '@/components/JobTable';
import QueryBuilder from '@/components/QueryBuilder';
import Header from '@/components/Header';
import Pagination from '@/components/Pagination';

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

  const [jobsResult, filterOptions] = await Promise.all([
    getJobs({
      functionName: searchParams.functionName,
      industry: searchParams.industry,
      location: searchParams.location,
      remoteOnly: searchParams.remote === 'true',
      search: searchParams.search,
      company: searchParams.company,
      investor: searchParams.investor,     
      page: currentPage,
    }),
    getFilterOptions(),
  ]);

  return (
    <main className="min-h-screen bg-[#262626]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-[#A0A0A0] text-lg mb-8">
          The career graph for VC-backed tech talent.
        </p>

        <QueryBuilder
          options={filterOptions}
          currentFilters={searchParams}
        />

        <div className="mt-8 mb-4 flex justify-between items-center">
          <p className="text-sm text-[#A0A0A0]">
            {jobsResult.totalCount} {jobsResult.totalCount === 1 ? 'job' : 'jobs'} found
          </p>
          {jobsResult.totalPages > 1 && (
            <p className="text-sm text-[#A0A0A0]">
              Page {jobsResult.page} of {jobsResult.totalPages}
            </p>
          )}
        </div>

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
