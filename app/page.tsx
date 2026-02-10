import Link from 'next/link';
import { getJobs, getFilterOptions, getRecentCompanies } from '@/lib/airtable';
import JobTable from '@/components/JobTable';
import Pagination from '@/components/Pagination';
import SearchFilters from '@/components/SearchFilters';
import RecentRounds from '@/components/RecentRounds';

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
        <div className="mb-5">
          <h1 className="text-lg sm:text-xl font-semibold text-white leading-tight">
            Jobs at VC-backed startups
          </h1>
          <p className="text-sm text-[#888] mt-1">
            Discover roles at companies backed by top investors. Updated daily.
          </p>
          <div className="flex items-center gap-4 mt-2.5">
            <span className="text-xs text-[#999]">
              <span className="text-[#e8e8e8] font-medium">{jobsResult.totalCount.toLocaleString()}</span> live roles
            </span>
            <span className="text-[#333]">·</span>
            <span className="text-xs text-[#999]">
              <span className="text-[#e8e8e8] font-medium">{filterOptions.companies.length.toLocaleString()}</span> companies
            </span>
            <span className="text-[#333]">·</span>
            <span className="text-xs text-[#999]">
              <span className="text-[#e8e8e8] font-medium">{filterOptions.investors.length}</span> investors
            </span>
          </div>
        </div>

        {/* ── Recently Added Companies ────────────────────── */}
        <RecentRounds companies={recentCompanies} />

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

        {/* ── Footer CTA ───────────────────────────────────── */}
        <div className="mt-6 pt-4 border-t border-[#1a1a1b] flex items-center justify-between">
          <p className="text-xs text-[#555]">
            Are you an investor?{' '}
            <Link href="/for-investors" className="text-[#5e6ad2] hover:text-[#7b83e0] transition-colors">
              Learn about Cadre for Investors
            </Link>
          </p>
          <p className="text-xs text-[#444]">
            Page {jobsResult.page} of {jobsResult.totalPages}
          </p>
        </div>
      </div>
    </main>
  );
}
