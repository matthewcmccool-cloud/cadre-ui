import type { Metadata } from 'next';
import { getJobs, getFilterOptions, getRecentCompanies, getAllCompaniesForDirectory, getAllInvestorsForDirectory } from '@/lib/data';
import JobTable from '@/components/JobTable';
import Pagination from '@/components/Pagination';
import SearchFilters from '@/components/SearchFilters';
import CompanyDirectory from '@/components/CompanyDirectory';
import InvestorDirectory from '@/components/InvestorDirectory';
import ViewSwitcher from '@/components/ViewSwitcher';

export const metadata: Metadata = {
  title: 'Discover 1,300+ VC-Backed Companies & Their Open Roles',
  description: 'Explore 1,300+ VC-backed companies, 200+ investors, and 16,000+ open roles.',
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app/discover' },
  openGraph: {
    title: 'Discover 1,300+ VC-Backed Companies & Their Open Roles | Cadre',
    description: 'Explore 1,300+ VC-backed companies, 200+ investors, and 16,000+ open roles.',
    url: 'https://cadre-ui-psi.vercel.app/discover',
  },
};

// ISR: regenerate every 60 minutes
export const revalidate = 3600;

interface PageProps {
  searchParams: {
    view?: string;
    department?: string;
    industry?: string;
    country?: string;
    workMode?: string;
    investor?: string;
    posted?: string;
    search?: string;
    page?: string;
    sort?: string;
    functionName?: string;
    remote?: string;
    location?: string;
    company?: string;
  };
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const view = searchParams.view === 'jobs'
    ? 'jobs'
    : searchParams.view === 'investors'
      ? 'investors'
      : 'companies';

  // Always fetch filter options (needed for counts across views)
  const filterOptions = await getFilterOptions();

  // Fetch view-specific data in parallel
  const [jobsResult, recentCompanies, companiesData, investorsData] = await Promise.all([
    view === 'jobs'
      ? getJobs({
          industry: searchParams.industry,
          investor: searchParams.investor,
          search: searchParams.search,
          page: parseInt(searchParams.page || '1', 10),
          functionName: searchParams.functionName,
          remoteOnly: searchParams.remote === 'true',
          location: searchParams.location,
          company: searchParams.company,
        })
      : Promise.resolve(null),
    view === 'jobs'
      ? getRecentCompanies(8).catch(() => [])
      : Promise.resolve([]),
    view === 'companies'
      ? getAllCompaniesForDirectory()
      : Promise.resolve([]),
    view === 'investors'
      ? getAllInvestorsForDirectory()
      : Promise.resolve([]),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        {/* View Switcher */}
        <div className="mb-6">
          <ViewSwitcher
            counts={{
              companies: filterOptions.companies.length,
              jobs: jobsResult?.totalCount,
              investors: filterOptions.investors?.length,
            }}
          />
        </div>

        {/* ── Companies View ── */}
        {view === 'companies' && (
          <CompanyDirectory companies={companiesData} />
        )}

        {/* ── Jobs View ── */}
        {view === 'jobs' && jobsResult && (
          <>
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
          </>
        )}

        {/* ── Investors View ── */}
        {view === 'investors' && (
          <InvestorDirectory investors={investorsData} />
        )}
      </div>
    </main>
  );
}
