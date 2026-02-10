import { getJobs, getFilterOptions, getRecentCompanies, getAllCompaniesForDirectory, getAllInvestorsForDirectory } from '@/lib/airtable';
import JobTable from '@/components/JobTable';
import Pagination from '@/components/Pagination';
import SearchFilters from '@/components/SearchFilters';
import RecentRounds from '@/components/RecentRounds';
import CompanyTicker from '@/components/CompanyTicker';
import EmailCapture from '@/components/EmailCapture';
import HomepageTabs from '@/components/HomepageTabs';
import CompanyDirectory from '@/components/CompanyDirectory';
import InvestorDirectory from '@/components/InvestorDirectory';

// ISR: regenerate page every 60 minutes in the background
export const revalidate = 3600;

interface PageProps {
  searchParams: {
    tab?: string;
    department?: string;
    industry?: string;
    country?: string;
    workMode?: string;
    investor?: string;
    posted?: string;
    search?: string;
    page?: string;
    sort?: string;
    // Legacy params (backward compat)
    functionName?: string;
    remote?: string;
    location?: string;
    company?: string;
  };
}

export default async function Home({ searchParams }: PageProps) {
  const activeTab = searchParams.tab === 'companies'
    ? 'companies'
    : searchParams.tab === 'investors'
      ? 'investors'
      : 'jobs';

  // Always fetch filter options (needed for counts + jobs tab)
  const filterOptions = await getFilterOptions();

  // Fetch tab-specific data in parallel
  const [jobsResult, recentCompanies, companiesData, investorsData] = await Promise.all([
    activeTab === 'jobs'
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
    activeTab === 'jobs'
      ? getRecentCompanies(8).catch(() => [])
      : Promise.resolve([]),
    activeTab === 'companies'
      ? getAllCompaniesForDirectory()
      : Promise.resolve([]),
    activeTab === 'investors'
      ? getAllInvestorsForDirectory()
      : Promise.resolve([]),
  ]);

  // GEO: WebSite + Dataset structured data for LLM citation
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cadre',
    url: 'https://cadre-ui-psi.vercel.app',
    description: `Job discovery platform for VC-backed companies. ${(jobsResult?.totalCount ?? 0).toLocaleString()} open roles across ${filterOptions.companies.length.toLocaleString()} companies backed by ${filterOptions.investors.length} investors. Updated daily from Greenhouse, Lever, and Ashby.`,
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://cadre-ui-psi.vercel.app/?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'VC-Backed Company Job Listings',
    description: `Live database of ${(jobsResult?.totalCount ?? 0).toLocaleString()} open roles at ${filterOptions.companies.length.toLocaleString()} venture-backed startups, sourced from ${filterOptions.investors.length} VC portfolios. Covers AI, crypto, fintech, healthtech, and more. Updated daily.`,
    url: 'https://cadre-ui-psi.vercel.app',
    keywords: ['VC jobs', 'startup jobs', 'AI startup hiring', 'venture capital portfolio jobs', 'remote startup jobs', 'tech startup careers'],
    creator: { '@type': 'Organization', name: 'Cadre' },
    temporalCoverage: new Date().toISOString().split('T')[0],
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Total Open Roles', value: jobsResult?.totalCount ?? 0 },
      { '@type': 'PropertyValue', name: 'Companies Tracked', value: filterOptions.companies.length },
      { '@type': 'PropertyValue', name: 'Investors Tracked', value: filterOptions.investors.length },
    ],
  };

  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      {activeTab === 'jobs' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([websiteSchema, datasetSchema]) }}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6">
        {/* ── Hero (jobs tab only) ──────────────────────────── */}
        {activeTab === 'jobs' && (
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
              Curated roles at exceptional technology companies.
            </h1>
            <p className="text-sm text-[#888] mt-1.5">
              Curated by the investors who back them.
            </p>
          </div>
        )}

        {/* ── Company Ticker (jobs tab only) ────────────────── */}
        {activeTab === 'jobs' && (
          <CompanyTicker companies={filterOptions.companyData} />
        )}

        {/* ── Tab Bar ───────────────────────────────────────── */}
        <HomepageTabs
          activeTab={activeTab}
          counts={{
            companies: filterOptions.companies.length,
            investors: filterOptions.investors.length,
          }}
        />

        {/* ── Jobs Tab Content ──────────────────────────────── */}
        {activeTab === 'jobs' && jobsResult && (
          <>
            <RecentRounds companies={recentCompanies} />
            <EmailCapture />

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

            <div className="mt-6 pt-4 border-t border-[#1a1a1b] flex items-center justify-between">
              <p className="text-xs text-[#555]">
                Cadre · VC-backed startup jobs, updated daily
              </p>
              <p className="text-xs text-[#444]">
                Page {jobsResult.page} of {jobsResult.totalPages}
              </p>
            </div>
          </>
        )}

        {/* ── Companies Tab Content ─────────────────────────── */}
        {activeTab === 'companies' && (
          <CompanyDirectory companies={companiesData} />
        )}

        {/* ── Investors Tab Content ─────────────────────────── */}
        {activeTab === 'investors' && (
          <InvestorDirectory investors={investorsData} />
        )}
      </div>
    </main>
  );
}
