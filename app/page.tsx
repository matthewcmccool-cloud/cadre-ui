import Link from 'next/link';
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
            <span className="text-xs text-[#666]">
              <span className="text-[#e8e8e8] font-medium">{jobsResult.totalCount.toLocaleString()}</span> live roles
            </span>
            <span className="text-[#333]">·</span>
            <span className="text-xs text-[#666]">
              <span className="text-[#e8e8e8] font-medium">{filterOptions.companies.length.toLocaleString()}</span> companies
            </span>
            <span className="text-[#333]">·</span>
            <span className="text-xs text-[#666]">
              <span className="text-[#e8e8e8] font-medium">{filterOptions.investors.length}</span> investors
            </span>
          </div>
        </div>

        {/* ── Search + Filters ─────────────────────────────── */}
        <SearchFilters
          companies={filterOptions.companies}
          investors={filterOptions.investors}
          industries={filterOptions.industries}
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
