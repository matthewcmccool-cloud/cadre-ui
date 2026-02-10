import { getJobs, getFilterOptions, getRecentCompanies } from '@/lib/airtable';
import JobTable from '@/components/JobTable';
import Pagination from '@/components/Pagination';
import SearchFilters from '@/components/SearchFilters';
import RecentRounds from '@/components/RecentRounds';
import CompanyTicker from '@/components/CompanyTicker';
import EmailCapture from '@/components/EmailCapture';

// ISR: regenerate page every 60 minutes in the background
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
    sort?: string;
    // Legacy params (backward compat)
    functionName?: string;
    remote?: string;
    location?: string;
    company?: string;
  };
}

export default async function Home({ searchParams }: PageProps) {
  const currentPage = parseInt(searchParams.page || '1', 10);
  const sortMode = (searchParams.sort === 'recent' ? 'recent' : 'featured') as 'featured' | 'recent';

  const filters = {
    // New multi-select params
    department: searchParams.department,
    industry: searchParams.industry,
    country: searchParams.country,
    workMode: searchParams.workMode,
    investor: searchParams.investor,
    posted: searchParams.posted,
    search: searchParams.search,
    page: currentPage,
    sort: sortMode,
    // Legacy support
    functionName: searchParams.functionName,
    remoteOnly: searchParams.remote === 'true',
    location: searchParams.location,
    company: searchParams.company,
  };

  const [jobsResult, filterOptions, recentCompanies] = await Promise.all([
    getJobs(filters),
    getFilterOptions(),
    getRecentCompanies(8).catch(() => []),
  ]);

  // GEO: WebSite + ItemList structured data for LLM citation
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cadre',
    url: 'https://cadre-ui-psi.vercel.app',
    description: `Job discovery platform for VC-backed companies. ${jobsResult.totalCount.toLocaleString()} open roles across ${filterOptions.companies.length.toLocaleString()} companies backed by ${filterOptions.investors.length} investors. Updated daily from Greenhouse, Lever, and Ashby.`,
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
    description: `Live database of ${jobsResult.totalCount.toLocaleString()} open roles at ${filterOptions.companies.length.toLocaleString()} venture-backed startups, sourced from ${filterOptions.investors.length} VC portfolios. Covers AI, crypto, fintech, healthtech, and more. Updated daily.`,
    url: 'https://cadre-ui-psi.vercel.app',
    keywords: ['VC jobs', 'startup jobs', 'AI startup hiring', 'venture capital portfolio jobs', 'remote startup jobs', 'tech startup careers'],
    creator: { '@type': 'Organization', name: 'Cadre' },
    temporalCoverage: new Date().toISOString().split('T')[0],
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Total Open Roles', value: jobsResult.totalCount },
      { '@type': 'PropertyValue', name: 'Companies Tracked', value: filterOptions.companies.length },
      { '@type': 'PropertyValue', name: 'Investors Tracked', value: filterOptions.investors.length },
    ],
  };

  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([websiteSchema, datasetSchema]) }}
      />
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6">
        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
            Every open role at VC-backed startups
          </h1>
          <p className="text-sm text-[#888] mt-1.5">
            Discover jobs at companies backed by the world&apos;s top investors. Updated daily.
          </p>
        </div>

        {/* ── Company Ticker ─────────────────────────────── */}
        <CompanyTicker companies={filterOptions.companyData} />

        {/* ── Recently Added Companies ────────────────────── */}
        <RecentRounds companies={recentCompanies} />

        {/* ── Subscribe ──────────────────────────────────── */}
        <EmailCapture />

        {/* ── Search + Filters ─────────────────────────────── */}
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

        {/* ── Job List ─────────────────────────────────────── */}
        <JobTable jobs={jobsResult.jobs} />

        {/* ── Pagination ───────────────────────────────────── */}
        <Pagination
          currentPage={jobsResult.page}
          totalPages={jobsResult.totalPages}
          searchParams={searchParams}
        />

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="mt-6 pt-4 border-t border-[#1a1a1b] flex items-center justify-between">
          <p className="text-xs text-[#555]">
            Cadre · VC-backed startup jobs, updated daily
          </p>
          <p className="text-xs text-[#444]">
            Page {jobsResult.page} of {jobsResult.totalPages}
          </p>
        </div>
      </div>
    </main>
  );
}
