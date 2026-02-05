import { getJobs, getFilterOptions } from '@/lib/airtable';
import JobTable from '@/components/JobTable';
import QueryBuilder from '@/components/QueryBuilder';
import Header from '@/components/Header';
import Pagination from '@/components/Pagination';
import SearchBar from '@/components/SearchBar';

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

  // Calculate stats from available data
  const jobCount = jobsResult.totalCount;
  const investorCount = filterOptions.investors?.length || 0;
  // Get unique company count from jobs
  const uniqueCompanies = new Set(jobsResult.jobs.map(job => job.company));
  const companyCount = uniqueCompanies.size;

  return (
    <main className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Compact */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#F9F9F9] mb-3">
            Find your next role at a VC-backed company
          </h1>
          <p className="text-[#A0A0A0] text-lg mb-4">
            High signal jobs at the world's leading technology companies.
          </p>
          <div className="flex justify-center gap-6 text-sm text-[#A0A0A0]">
            <span><strong className="text-[#F9F9F9]">{jobCount.toLocaleString()}</strong> jobs</span>
            <span><strong className="text-[#F9F9F9]">{companyCount.toLocaleString()}</strong> companies</span>
            <span><strong className="text-[#F9F9F9]">{investorCount.toLocaleString()}</strong> investors</span>
          </div>
        </div>

        <SearchBar
          initialSearch={searchParams.search}
          initialLocation={searchParams.location}
        />

        <QueryBuilder
          options={filterOptions}
          currentFilters={searchParams}
          defaultOpen={true}
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
