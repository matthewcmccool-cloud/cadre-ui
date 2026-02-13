'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { CompanyDirectoryItem, InvestorDirectoryItem, Job, JobsResult } from '@/lib/data';
import { formatNumber } from '@/lib/format';
import Favicon from '@/components/Favicon';
import FilterDropdown, { type FilterOption } from './FilterDropdown';
import FollowButton from '@/components/FollowButton';

// ── Types ────────────────────────────────────────────────────────────

type ViewKey = 'companies' | 'jobs' | 'investors';

interface DiscoverPageContentProps {
  companies: CompanyDirectoryItem[];
  investors: InvestorDirectoryItem[];
  jobs: Job[];
  jobsTotalCount: number;
  stats: { jobCount: number; companyCount: number; investorCount: number };
}

// ── Helpers ──────────────────────────────────────────────────────────

function getDomain(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(dateString: string): { text: string; isNew: boolean } {
  if (!dateString) return { text: '', isNew: false };
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) return { text: 'New', isNew: true };
  if (diffDays <= 7) return { text: `${diffDays}d ago`, isNew: false };
  if (diffDays < 30) return { text: `${Math.floor(diffDays / 7)}w ago`, isNew: false };
  return { text: '', isNew: false };
}

const AVATAR_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-pink-500/20 text-pink-400',
  'bg-orange-500/20 text-orange-400',
  'bg-teal-500/20 text-teal-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-rose-500/20 text-rose-400',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const FUNCTION_COLORS: Record<string, string> = {
  'Engineering': 'text-blue-400 border-blue-400/30',
  'Product Management': 'text-purple-400 border-purple-400/30',
  'Product Design / UX': 'text-pink-400 border-pink-400/30',
  'Sales': 'text-orange-400 border-orange-400/30',
  'Marketing': 'text-yellow-400 border-yellow-400/30',
  'AI & Research': 'text-cyan-400 border-cyan-400/30',
  'Customer Success': 'text-teal-400 border-teal-400/30',
  'People': 'text-rose-400 border-rose-400/30',
  'Finance & Accounting': 'text-emerald-400 border-emerald-400/30',
  'Business Operations': 'text-amber-400 border-amber-400/30',
  'BD & Partnerships': 'text-orange-300 border-orange-300/30',
  'Legal': 'text-slate-400 border-slate-400/30',
  'Solutions Engineering': 'text-indigo-400 border-indigo-400/30',
  'Developer Relations': 'text-violet-400 border-violet-400/30',
  'Revenue Operations': 'text-lime-400 border-lime-400/30',
};

const STAGES = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E+', 'Growth', 'Public'];
const INITIAL_DISPLAY_COUNT = 54;

const DEPARTMENTS = [
  'Sales & GTM', 'Marketing', 'Engineering', 'AI & Research', 'Product',
  'Design', 'Customer Success & Support', 'People & Talent',
  'Finance & Legal', 'Operations & Admin',
];

const WORK_MODE_OPTIONS: FilterOption[] = [
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'On-site', label: 'On-site' },
];

const POSTED_OPTIONS: FilterOption[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

const INVESTOR_TYPE_OPTIONS: FilterOption[] = [
  { value: 'Venture Capital', label: 'Venture Capital' },
  { value: 'Private Equity', label: 'Private Equity' },
  { value: 'Growth Equity', label: 'Growth Equity' },
  { value: 'Angel', label: 'Angel' },
  { value: 'Corporate', label: 'Corporate' },
];

const STAGE_FOCUS_OPTIONS: FilterOption[] = [
  { value: 'Seed', label: 'Seed' },
  { value: 'Series A', label: 'Series A' },
  { value: 'Series B', label: 'Series B' },
  { value: 'Growth', label: 'Growth' },
  { value: 'Late Stage', label: 'Late Stage' },
];


// ── Inner component (needs useSearchParams inside Suspense) ──────────

function DiscoverInner({ companies, investors, jobs, jobsTotalCount, stats }: DiscoverPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Active view from URL ──────────────────────────────────────────
  const activeView = (searchParams.get('view') as ViewKey) || 'companies';

  const setView = useCallback((view: ViewKey) => {
    const params = new URLSearchParams();
    if (view !== 'companies') {
      params.set('view', view);
    }
    const qs = params.toString();
    router.push(pathname + (qs ? `?${qs}` : ''));
  }, [router, pathname]);

  // ── Search state ──────────────────────────────────────────────────
  const [search, setSearch] = useState('');

  // ── Company filters ───────────────────────────────────────────────
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [companyInvestorFilter, setCompanyInvestorFilter] = useState<string[]>([]);
  const [companyIndustryFilter, setCompanyIndustryFilter] = useState<string[]>([]);
  const [companyExpanded, setCompanyExpanded] = useState(false);

  // ── Job filters ───────────────────────────────────────────────────
  const [jobDeptFilter, setJobDeptFilter] = useState<string[]>([]);
  const [jobLocationFilter, setJobLocationFilter] = useState<string[]>([]);
  const [jobWorkModeFilter, setJobWorkModeFilter] = useState<string[]>([]);
  const [jobPostedFilter, setJobPostedFilter] = useState<string[]>([]);

  // ── Investor filters ──────────────────────────────────────────────
  const [investorTypeFilter, setInvestorTypeFilter] = useState<string[]>([]);
  const [investorStageFocusFilter, setInvestorStageFocusFilter] = useState<string[]>([]);
  const [investorIndustryFilter, setInvestorIndustryFilter] = useState<string[]>([]);
  const [investorExpanded, setInvestorExpanded] = useState(false);

  // ── Segment counts ────────────────────────────────────────────────
  const companyCount = companies.length;
  const jobCount = jobsTotalCount > 5000 ? '5,000+' : formatNumber(jobsTotalCount);
  const investorCount = investors.length;

  // ── Heading text ──────────────────────────────────────────────────
  const heading = useMemo(() => {
    switch (activeView) {
      case 'companies':
        return {
          bold: `${formatNumber(companyCount)} exceptional technology companies`,
          rest: ' \u2014 click any to see open roles.',
        };
      case 'jobs':
        return {
          bold: `${jobCount} open roles across ${formatNumber(companyCount)} companies`,
          rest: ' \u2014 sorted by most recent.',
        };
      case 'investors':
        return {
          bold: `${formatNumber(investorCount)} investors`,
          rest: ' backing the best technology companies.',
        };
    }
  }, [activeView, companyCount, investorCount, jobCount]);

  // ── Search placeholder ────────────────────────────────────────────
  const searchPlaceholder = useMemo(() => {
    switch (activeView) {
      case 'companies': return 'Search companies, industries...';
      case 'jobs': return 'Search roles, companies, skills...';
      case 'investors': return 'Search investors, funds...';
    }
  }, [activeView]);

  // ══════════════════════════════════════════════════════════════════
  //  COMPANY filter options & filtering
  // ══════════════════════════════════════════════════════════════════

  const companyInvestorOptions = useMemo((): FilterOption[] => {
    const counts = new Map<string, number>();
    for (const c of companies) {
      for (const inv of c.investors) {
        counts.set(inv, (counts.get(inv) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [companies]);

  const companyIndustryOptions = useMemo((): FilterOption[] => {
    const counts = new Map<string, number>();
    for (const c of companies) {
      if (c.industry) {
        counts.set(c.industry, (counts.get(c.industry) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [companies]);

  const stageOptions = useMemo((): FilterOption[] =>
    STAGES.map(s => ({ value: s, label: s })),
  []);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) &&
            !c.investors.some(inv => inv.toLowerCase().includes(q)) &&
            !(c.industry && c.industry.toLowerCase().includes(q))) {
          return false;
        }
      }
      if (stageFilter.length > 0 && (!c.stage || !stageFilter.includes(c.stage))) return false;
      if (companyInvestorFilter.length > 0 && !c.investors.some(inv => companyInvestorFilter.includes(inv))) return false;
      if (companyIndustryFilter.length > 0 && (!c.industry || !companyIndustryFilter.includes(c.industry))) return false;
      return true;
    });
  }, [companies, search, stageFilter, companyInvestorFilter, companyIndustryFilter]);

  const hasCompanyFilters = stageFilter.length > 0 || companyInvestorFilter.length > 0 || companyIndustryFilter.length > 0;

  // ══════════════════════════════════════════════════════════════════
  //  JOB filter options & filtering
  // ══════════════════════════════════════════════════════════════════

  const jobDeptOptions = useMemo((): FilterOption[] =>
    DEPARTMENTS.map(d => ({ value: d, label: d })),
  []);

  const jobLocationOptions = useMemo((): FilterOption[] => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      if (j.location) {
        // Extract country or main location
        const parts = j.location.split(',').map(s => s.trim());
        const loc = parts[parts.length - 1] || j.location;
        if (loc && loc.toLowerCase() !== 'remote') {
          counts.set(loc, (counts.get(loc) || 0) + 1);
        }
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (search) {
        const q = search.toLowerCase();
        if (!j.title.toLowerCase().includes(q) &&
            !j.company.toLowerCase().includes(q) &&
            !j.functionName.toLowerCase().includes(q) &&
            !j.location.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (jobDeptFilter.length > 0) {
        if (!j.departmentName || !jobDeptFilter.includes(j.departmentName)) return false;
      }
      if (jobLocationFilter.length > 0) {
        const parts = j.location.split(',').map(s => s.trim());
        const loc = parts[parts.length - 1] || j.location;
        if (!jobLocationFilter.includes(loc)) return false;
      }
      if (jobWorkModeFilter.length > 0) {
        const mode = j.remoteFirst ? 'Remote' : (j.location.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site');
        if (!jobWorkModeFilter.includes(mode)) return false;
      }
      if (jobPostedFilter.length > 0) {
        const now = new Date();
        const posted = new Date(j.datePosted);
        const diffMs = now.getTime() - posted.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const filter = jobPostedFilter[0];
        if (filter === '24h' && diffDays > 1) return false;
        if (filter === '7d' && diffDays > 7) return false;
        if (filter === '30d' && diffDays > 30) return false;
      }
      return true;
    });
  }, [jobs, search, jobDeptFilter, jobLocationFilter, jobWorkModeFilter, jobPostedFilter]);

  const hasJobFilters = jobDeptFilter.length > 0 || jobLocationFilter.length > 0 || jobWorkModeFilter.length > 0 || jobPostedFilter.length > 0;

  // ══════════════════════════════════════════════════════════════════
  //  INVESTOR filter options & filtering
  // ══════════════════════════════════════════════════════════════════

  const investorIndustryOptions = useMemo((): FilterOption[] => {
    const counts = new Map<string, number>();
    for (const inv of investors) {
      for (const ind of inv.industries) {
        counts.set(ind, (counts.get(ind) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [investors]);

  const filteredInvestors = useMemo(() => {
    let result = investors;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(inv => inv.name.toLowerCase().includes(q));
    }
    if (investorIndustryFilter.length > 0) {
      result = result.filter(inv =>
        inv.industries.some(ind => investorIndustryFilter.includes(ind))
      );
    }
    if (investorStageFocusFilter.length > 0) {
      result = result.filter(inv =>
        inv.stages.some(st => investorStageFocusFilter.includes(st))
      );
    }
    // Type filter — no actual type data in Airtable yet, so this is a no-op for now
    return result;
  }, [investors, search, investorIndustryFilter, investorStageFocusFilter]);

  const hasInvestorFilters = investorTypeFilter.length > 0 || investorStageFocusFilter.length > 0 || investorIndustryFilter.length > 0;

  // ── Clear filters on view change ──────────────────────────────────
  const handleViewChange = useCallback((view: ViewKey) => {
    setSearch('');
    // Reset all filters
    setStageFilter([]);
    setCompanyInvestorFilter([]);
    setCompanyIndustryFilter([]);
    setCompanyExpanded(false);
    setJobDeptFilter([]);
    setJobLocationFilter([]);
    setJobWorkModeFilter([]);
    setJobPostedFilter([]);
    setInvestorTypeFilter([]);
    setInvestorStageFocusFilter([]);
    setInvestorIndustryFilter([]);
    setInvestorExpanded(false);
    setView(view);
  }, [setView]);

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════

  const views: { key: ViewKey; label: string; count: string }[] = [
    { key: 'companies', label: 'Companies', count: formatNumber(companyCount) },
    { key: 'jobs', label: 'Jobs', count: String(jobCount) },
    { key: 'investors', label: 'Investors', count: formatNumber(investorCount) },
  ];

  return (
    <>
      {/* ── Segmented Control ─────────────────────────────────────── */}
      <div className="mb-4">
        <div className="bg-zinc-800 rounded-lg p-1 inline-flex gap-0">
          {views.map((v) => {
            const isActive = activeView === v.key;
            return (
              <button
                key={v.key}
                onClick={() => handleViewChange(v.key)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {v.label}{' '}
                <span className={isActive ? 'text-zinc-500' : 'text-zinc-600'}>
                  {v.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Heading ───────────────────────────────────────────────── */}
      <div className="mb-4">
        <p className="text-sm text-[#888]">
          <span className="text-[#ccc] font-medium">{heading.bold}</span>
          {heading.rest}
        </p>
      </div>

      {/* ── Search Bar ────────────────────────────────────────────── */}
      <div className="mb-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-10 py-2.5 bg-[#1a1a1b] text-[#e8e8e8] placeholder-[#999] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#e8e8e8] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {activeView === 'companies' && (
          <>
            <FilterDropdown label="Industry" options={companyIndustryOptions} selected={companyIndustryFilter} onChange={setCompanyIndustryFilter} multiSelect={false} searchable />
            <FilterDropdown label="Stage" options={stageOptions} selected={stageFilter} onChange={setStageFilter} multiSelect={false} />
            <FilterDropdown label="Backed By" options={companyInvestorOptions} selected={companyInvestorFilter} onChange={setCompanyInvestorFilter} multiSelect={false} searchable />
          </>
        )}
        {activeView === 'jobs' && (
          <>
            <FilterDropdown label="Department" options={jobDeptOptions} selected={jobDeptFilter} onChange={setJobDeptFilter} multiSelect={false} />
            <FilterDropdown label="Location" options={jobLocationOptions} selected={jobLocationFilter} onChange={setJobLocationFilter} multiSelect={false} searchable />
            <FilterDropdown label="Work Mode" options={WORK_MODE_OPTIONS} selected={jobWorkModeFilter} onChange={setJobWorkModeFilter} multiSelect={false} />
            <FilterDropdown label="Posted" options={POSTED_OPTIONS} selected={jobPostedFilter} onChange={setJobPostedFilter} multiSelect={false} />
          </>
        )}
        {activeView === 'investors' && (
          <>
            <FilterDropdown label="Type" options={INVESTOR_TYPE_OPTIONS} selected={investorTypeFilter} onChange={setInvestorTypeFilter} multiSelect={false} />
            <FilterDropdown label="Stage Focus" options={STAGE_FOCUS_OPTIONS} selected={investorStageFocusFilter} onChange={setInvestorStageFocusFilter} multiSelect={false} />
            <FilterDropdown label="Industry" options={investorIndustryOptions} selected={investorIndustryFilter} onChange={setInvestorIndustryFilter} multiSelect={false} searchable />
          </>
        )}
      </div>

      {/* ── Active filter chips ───────────────────────────────────── */}
      {activeView === 'companies' && hasCompanyFilters && (
        <ActiveFilterChips
          filters={[
            ...companyIndustryFilter.map(f => ({ label: f, onRemove: () => setCompanyIndustryFilter([]) })),
            ...stageFilter.map(f => ({ label: f, onRemove: () => setStageFilter([]) })),
            ...companyInvestorFilter.map(f => ({ label: f, onRemove: () => setCompanyInvestorFilter([]) })),
          ]}
          onClearAll={() => { setCompanyIndustryFilter([]); setStageFilter([]); setCompanyInvestorFilter([]); }}
        />
      )}
      {activeView === 'jobs' && hasJobFilters && (
        <ActiveFilterChips
          filters={[
            ...jobDeptFilter.map(f => ({ label: f, onRemove: () => setJobDeptFilter([]) })),
            ...jobLocationFilter.map(f => ({ label: f, onRemove: () => setJobLocationFilter([]) })),
            ...jobWorkModeFilter.map(f => ({ label: f, onRemove: () => setJobWorkModeFilter([]) })),
            ...jobPostedFilter.map(f => ({ label: POSTED_OPTIONS.find(o => o.value === f)?.label || f, onRemove: () => setJobPostedFilter([]) })),
          ]}
          onClearAll={() => { setJobDeptFilter([]); setJobLocationFilter([]); setJobWorkModeFilter([]); setJobPostedFilter([]); }}
        />
      )}
      {activeView === 'investors' && hasInvestorFilters && (
        <ActiveFilterChips
          filters={[
            ...investorTypeFilter.map(f => ({ label: f, onRemove: () => setInvestorTypeFilter([]) })),
            ...investorStageFocusFilter.map(f => ({ label: f, onRemove: () => setInvestorStageFocusFilter([]) })),
            ...investorIndustryFilter.map(f => ({ label: f, onRemove: () => setInvestorIndustryFilter([]) })),
          ]}
          onClearAll={() => { setInvestorTypeFilter([]); setInvestorStageFocusFilter([]); setInvestorIndustryFilter([]); }}
        />
      )}

      {/* ── Result count ──────────────────────────────────────────── */}
      <p className="text-xs text-[#555] mb-4">
        {activeView === 'companies' && (
          filteredCompanies.length === companies.length
            ? `${formatNumber(companies.length)} companies`
            : `${formatNumber(filteredCompanies.length)} of ${formatNumber(companies.length)} companies`
        )}
        {activeView === 'jobs' && (
          filteredJobs.length === jobs.length
            ? `${formatNumber(jobs.length)} roles`
            : `${formatNumber(filteredJobs.length)} of ${formatNumber(jobs.length)} roles`
        )}
        {activeView === 'investors' && (
          filteredInvestors.length === investors.length
            ? `${formatNumber(investors.length)} investors`
            : `${formatNumber(filteredInvestors.length)} of ${formatNumber(investors.length)} investors`
        )}
      </p>

      {/* ══════════════════════════════════════════════════════════════
       *  COMPANIES VIEW
       * ══════════════════════════════════════════════════════════════ */}
      {activeView === 'companies' && (
        <>
          <div className="flex flex-wrap gap-2">
            {(companyExpanded ? filteredCompanies : filteredCompanies.slice(0, INITIAL_DISPLAY_COUNT)).map((company, i) => {
              const domain = getDomain(company.url);
              const isRevealed = companyExpanded && i >= INITIAL_DISPLAY_COUNT;
              return (
                <div
                  key={company.slug}
                  className={`inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1b] hover:bg-[#252526] rounded-lg text-sm text-[#e8e8e8] transition-colors group${isRevealed ? ' animate-chip-reveal' : ''}`}
                  style={isRevealed ? { animationDelay: `${Math.min((i - INITIAL_DISPLAY_COUNT) * 8, 300)}ms` } : undefined}
                >
                  <Link href={`/companies/${company.slug}`} className="inline-flex items-center gap-2">
                    {domain ? (
                      <Favicon domain={domain} size={32} className="w-4 h-4 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-4 h-4 rounded-sm bg-[#252526] flex items-center justify-center text-[8px] font-bold text-[#555]">
                        {company.name.charAt(0)}
                      </div>
                    )}
                    <span className="whitespace-nowrap">{company.name}</span>
                    {company.jobCount > 0 && (
                      <span className="text-[10px] text-[#555] font-medium">
                        {company.jobCount} {company.jobCount === 1 ? 'job' : 'jobs'}
                      </span>
                    )}
                  </Link>
                  <FollowButton companyId={company.id} companyName={company.name} compact />
                </div>
              );
            })}
            {filteredCompanies.length > INITIAL_DISPLAY_COUNT && (
              <button
                onClick={() => setCompanyExpanded(!companyExpanded)}
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-[#5e6ad2]/40 bg-[#5e6ad2]/20 text-[#8b93e6] hover:bg-[#5e6ad2]/30"
              >
                {companyExpanded ? 'Show less' : `View all ${formatNumber(filteredCompanies.length)} \u2192`}
              </button>
            )}
          </div>
          {filteredCompanies.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#888]">No companies found matching your filters.</p>
              <p className="text-[#999] text-sm mt-1">Try adjusting your search or clearing filters.</p>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
       *  JOBS VIEW
       * ══════════════════════════════════════════════════════════════ */}
      {activeView === 'jobs' && (
        <>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#888]">No jobs found matching your filters.</p>
              <p className="text-[#999] text-sm mt-1">Try adjusting your search or clearing filters.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-[#1a1a1b] divide-y divide-[#1a1a1b] overflow-hidden">
              {filteredJobs.slice(0, 50).map((job) => {
                const companyDomain = getDomain(job.companyUrl);
                const { text: dateText, isNew } = formatDate(job.datePosted);
                const fnStyle = FUNCTION_COLORS[job.functionName] || 'text-[#888] border-[#333]';

                return (
                  <div
                    key={job.id}
                    className="group flex items-center gap-3 px-3 py-2.5 bg-[#0e0e0f] hover:bg-[#141415] transition-colors duration-150 cursor-pointer"
                  >
                    {/* Company Logo */}
                    <div className="flex-shrink-0 relative">
                      {companyDomain ? (
                        <>
                          <div className="absolute inset-0">
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold ${getAvatarColor(job.company)}`}>
                              {job.company.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <Favicon domain={companyDomain} size={32} className="w-6 h-6 rounded relative z-10" />
                        </>
                      ) : (
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold ${getAvatarColor(job.company)}`}>
                          {job.company.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <Link
                          href={`/jobs/${toSlug(job.title)}-${toSlug(job.company)}-${job.id}`}
                          className="text-[15px] font-semibold text-white group-hover:text-[#5e6ad2] truncate transition-colors"
                        >
                          {job.title}
                        </Link>
                        {dateText && (
                          isNew ? (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500/15 text-green-400">
                              New
                            </span>
                          ) : (
                            <span className="flex-shrink-0 text-[11px] text-[#444]">{dateText}</span>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Link
                          href={`/companies/${toSlug(job.company)}`}
                          className="text-xs text-[#666] hover:text-[#e8e8e8] transition-colors"
                        >
                          {job.company}
                        </Link>
                        {job.location && (
                          <>
                            <span className="text-[#333]">&middot;</span>
                            <span className="text-xs text-[#555] truncate">{job.location}</span>
                          </>
                        )}
                        {job.functionName && (
                          <>
                            <span className="hidden md:inline text-[#333]">&middot;</span>
                            <span className={`hidden md:inline px-1.5 py-0 rounded text-[10px] border ${fnStyle}`}>
                              {job.functionName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bookmark */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FollowButton companyId={job.id} companyName={job.title} variant="save" compact />
                    </div>

                    {/* Chevron */}
                    <svg className="w-4 h-4 text-[#333] group-hover:text-[#666] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
          {filteredJobs.length > 50 && (
            <div className="text-center mt-4">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[#5e6ad2]/40 bg-[#5e6ad2]/20 text-[#8b93e6] hover:bg-[#5e6ad2]/30 transition-colors"
              >
                View all {formatNumber(filteredJobs.length)} roles &rarr;
              </Link>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
       *  INVESTORS VIEW
       * ══════════════════════════════════════════════════════════════ */}
      {activeView === 'investors' && (
        <>
          <div className="flex flex-wrap gap-2">
            {(investorExpanded ? filteredInvestors : filteredInvestors.slice(0, INITIAL_DISPLAY_COUNT)).map((investor, i) => {
              const domain = getDomain(investor.url);
              const isRevealed = investorExpanded && i >= INITIAL_DISPLAY_COUNT;
              return (
                <div
                  key={investor.slug}
                  className={`inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1b] hover:bg-[#252526] rounded-lg text-sm text-[#e8e8e8] transition-colors group${isRevealed ? ' animate-chip-reveal' : ''}`}
                  style={isRevealed ? { animationDelay: `${Math.min((i - INITIAL_DISPLAY_COUNT) * 8, 300)}ms` } : undefined}
                >
                  <Link href={`/investors/${investor.slug}`} className="inline-flex items-center gap-2">
                    {domain ? (
                      <Favicon domain={domain} size={32} className="w-4 h-4 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-4 h-4 rounded-sm bg-[#252526] flex items-center justify-center text-[8px] font-bold text-[#555]">
                        {investor.name.charAt(0)}
                      </div>
                    )}
                    <span className="whitespace-nowrap">{investor.name}</span>
                    {investor.companyCount > 0 && (
                      <span className="text-[10px] text-[#555] font-medium">
                        {investor.companyCount} {investor.companyCount === 1 ? 'co' : 'cos'}
                      </span>
                    )}
                  </Link>
                  <FollowButton companyId={investor.id} companyName={investor.name} compact />
                </div>
              );
            })}
            {filteredInvestors.length > INITIAL_DISPLAY_COUNT && (
              <button
                onClick={() => setInvestorExpanded(!investorExpanded)}
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-[#5e6ad2]/40 bg-[#5e6ad2]/20 text-[#8b93e6] hover:bg-[#5e6ad2]/30"
              >
                {investorExpanded ? 'Show less' : `View all ${formatNumber(filteredInvestors.length)} \u2192`}
              </button>
            )}
          </div>
          {filteredInvestors.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#888]">No investors found matching your search.</p>
              <p className="text-[#999] text-sm mt-1">Try a different search term.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}


// ── Active Filter Chips (inline) ─────────────────────────────────────

function ActiveFilterChips({
  filters,
  onClearAll,
}: {
  filters: { label: string; onRemove: () => void }[];
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {filters.map((f, i) => (
        <button
          key={`${f.label}-${i}`}
          onClick={f.onRemove}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#5e6ad2]/10 rounded text-xs text-[#5e6ad2]"
        >
          {f.label}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-[#555] hover:text-[#888] transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}


// ── Main export (wrapped in Suspense for useSearchParams) ────────────

export default function DiscoverPageContent(props: DiscoverPageContentProps) {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-zinc-800 rounded-lg w-80" />
        <div className="h-5 bg-zinc-800/50 rounded w-96" />
        <div className="h-10 bg-zinc-800/30 rounded-lg w-full" />
      </div>
    }>
      <DiscoverInner {...props} />
    </Suspense>
  );
}
