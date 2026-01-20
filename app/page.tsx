import { getJobs, getFilterOptions } from '@/lib/airtable';
import JobTable from '@/components/JobTable';
import Filters from '@/components/Filters';
import Header from '@/components/Header';
import Pagination from '@/components/Pagination';

export const revalidate = 0;

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
    <main className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500 text-lg mb-8">
          The career graph for tech talent. Find jobs at 250+ venture-backed companies.
        </p>

        <Filters
          options={filterOptions}
          currentFilters={searchParams}
        />

        <div className="mt-8 mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {jobsResult.totalCount} jobs found
          </p>
        </div>

        <JobTable jobs={jobsResult.jobs} />

        <Pagination
          currentPage={jobsResult.page}
          totalPages={jobsResult.totalPages}
          totalCount={jobsResult.totalCount}
        />
      </div>
    </main>
  );
}
