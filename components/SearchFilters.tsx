'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import FilterDropdown, { type FilterOption } from './FilterDropdown';
import ActiveFilters from './ActiveFilters';
import { parseCountry, parseWorkMode } from '@/lib/location-parser';

const DEPARTMENTS = [
  'Sales & GTM', 'Marketing', 'Engineering', 'AI & Research', 'Product',
  'Design', 'Customer Success & Support', 'People & Talent',
  'Finance & Legal', 'Operations & Admin',
];

const POSTED_OPTIONS: FilterOption[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

const WORK_MODE_OPTIONS: FilterOption[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'in-office', label: 'In-Office' },
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface SearchFiltersProps {
  companies?: string[];
  investors?: string[];
  industries?: string[];
  jobs?: Array<{ location: string; remoteFirst: boolean; investors: string[] }>;
  totalCount?: number;
}

export default function SearchFilters({
  companies = [],
  investors = [],
  industries = [],
  jobs = [],
  totalCount = 0,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Read current filter state from URL ──────────────────────────
  const getMulti = useCallback((key: string): string[] => {
    const val = searchParams.get(key);
    return val ? val.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const selectedDepts = getMulti('department');
  const selectedCountries = getMulti('country');
  const selectedIndustries = getMulti('industry');
  const selectedWorkModes = getMulti('workMode');
  const selectedInvestors = getMulti('investor');
  const selectedPosted = getMulti('posted');
  const currentSort = searchParams.get('sort') || 'featured';

  // ── Build URL and navigate ──────────────────────────────────────
  const updateParams = useCallback((key: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (values.length > 0) {
      params.set(key, values.join(','));
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  }, [searchParams, router]);

  // ── Build dropdown options with counts from job data ────────────
  const countryOptions = useMemo((): FilterOption[] => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      const country = parseCountry(job.location);
      if (country && country !== 'Remote') {
        counts.set(country, (counts.get(country) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ value: country, label: country, count }));
  }, [jobs]);

  const investorOptions = useMemo((): FilterOption[] => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      for (const inv of job.investors) {
        counts.set(inv, (counts.get(inv) || 0) + 1);
      }
    }
    // Sort by count, then alphabetically
    return investors
      .map(name => ({ value: name, label: name, count: counts.get(name) || 0 }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [investors, jobs]);

  const deptOptions = useMemo((): FilterOption[] =>
    DEPARTMENTS.map(d => ({ value: d, label: d })),
  []);

  const industryOptions = useMemo((): FilterOption[] =>
    industries.map(i => ({ value: i, label: i })),
  [industries]);

  // ── Entity autocomplete for search box ──────────────────────────
  const entityMatches = useMemo(() => {
    if (search.length < 2) return [];
    const q = search.toLowerCase();
    const matches: Array<{ name: string; type: 'company' | 'investor' | 'industry'; href: string }> = [];

    for (const name of companies) {
      if (name.toLowerCase().includes(q)) {
        matches.push({ name, type: 'company', href: `/companies/${toSlug(name)}` });
      }
      if (matches.length >= 5) break;
    }
    for (const name of investors) {
      if (name.toLowerCase().includes(q)) {
        matches.push({ name, type: 'investor', href: `/investors/${toSlug(name)}` });
      }
      if (matches.length >= 8) break;
    }
    for (const name of industries) {
      if (name.toLowerCase().includes(q)) {
        matches.push({ name, type: 'industry', href: `/industry/${toSlug(name)}` });
      }
      if (matches.length >= 10) break;
    }
    return matches;
  }, [search, companies, investors, industries]);

  // ── Search handlers ─────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('page');
    setSearch('');
    router.push(`/?${params.toString()}`);
  };

  const setSort = (mode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', mode);
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  // ── Active filters for chip row ─────────────────────────────────
  const activeFilters = useMemo(() => {
    const filters: Array<{ param: string; value: string; label: string }> = [];
    for (const d of selectedDepts) filters.push({ param: 'department', value: d, label: d });
    for (const c of selectedCountries) filters.push({ param: 'country', value: c, label: c });
    for (const i of selectedIndustries) filters.push({ param: 'industry', value: i, label: i });
    for (const w of selectedWorkModes) {
      const opt = WORK_MODE_OPTIONS.find(o => o.value === w);
      filters.push({ param: 'workMode', value: w, label: opt?.label || w });
    }
    for (const inv of selectedInvestors) filters.push({ param: 'investor', value: inv, label: inv });
    for (const p of selectedPosted) {
      const opt = POSTED_OPTIONS.find(o => o.value === p);
      filters.push({ param: 'posted', value: p, label: opt?.label || p });
    }
    if (searchParams.get('search')) {
      filters.push({ param: 'search', value: searchParams.get('search')!, label: `"${searchParams.get('search')}"` });
    }
    return filters;
  }, [selectedDepts, selectedCountries, selectedIndustries, selectedWorkModes, selectedInvestors, selectedPosted, searchParams]);

  const handleRemoveFilter = useCallback((param: string, value: string) => {
    if (param === 'search') {
      clearSearch();
      return;
    }
    const current = getMulti(param);
    updateParams(param, current.filter(v => v !== value));
  }, [getMulti, updateParams, clearSearch]);

  const handleClearAll = useCallback(() => {
    setSearch('');
    router.push('/');
  }, [router]);

  // ── Count active filters for mobile button ──────────────────────
  const activeCount = activeFilters.length;

  // ── Filter dropdowns (shared between desktop and mobile) ────────
  const filterDropdowns = (
    <>
      <FilterDropdown label="Department" options={deptOptions} selected={selectedDepts} onChange={v => updateParams('department', v)} />
      <FilterDropdown label="Location" options={countryOptions} selected={selectedCountries} onChange={v => updateParams('country', v)} searchable />
      <FilterDropdown label="Industry" options={industryOptions} selected={selectedIndustries} onChange={v => updateParams('industry', v)} />
      <FilterDropdown label="Work Mode" options={WORK_MODE_OPTIONS} selected={selectedWorkModes} onChange={v => updateParams('workMode', v)} />
      <FilterDropdown label="Backed By" options={investorOptions} selected={selectedInvestors} onChange={v => updateParams('investor', v)} searchable />
      <FilterDropdown label="Posted" options={POSTED_OPTIONS} selected={selectedPosted} onChange={v => updateParams('posted', v)} multiSelect={false} />
    </>
  );

  return (
    <div className="mb-4">
      {/* ── Search Bar ──────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="mb-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]"
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
            placeholder="Search roles, companies, skills..."
            className="w-full pl-10 pr-10 py-2 bg-[#1a1a1b] text-[#e8e8e8] placeholder-[#666] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#e8e8e8] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Entity autocomplete chips */}
      {entityMatches.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {entityMatches.map((match) => (
            <Link
              key={`${match.type}-${match.name}`}
              href={match.href}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#5e6ad2]/10 hover:bg-[#5e6ad2]/20 rounded text-xs text-[#5e6ad2] transition-colors"
            >
              {match.name}
              <span className="text-[#5e6ad2]/50">{match.type}</span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Filter Dropdowns — Desktop ──────────────────────── */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 mb-2">
        {filterDropdowns}
      </div>

      {/* ── Filter Button — Mobile ──────────────────────────── */}
      <div className="sm:hidden mb-2">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeCount > 0
              ? 'bg-[#5e6ad2]/15 text-[#5e6ad2] border border-[#5e6ad2]/30'
              : 'bg-[#1a1a1b] text-[#888]'
          }`}
        >
          Filters
          {activeCount > 0 && (
            <span className="bg-[#5e6ad2]/25 text-[#5e6ad2] px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none">
              {activeCount}
            </span>
          )}
          <svg
            className={`w-3 h-3 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mobileOpen && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {filterDropdowns}
          </div>
        )}
      </div>

      {/* ── Active Filter Chips ─────────────────────────────── */}
      <ActiveFilters
        filters={activeFilters}
        totalCount={totalCount}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      {/* ── Sort Toggle ─────────────────────────────────────── */}
      <div className="flex items-center gap-0.5">
        {[
          { key: 'featured', label: 'Featured' },
          { key: 'recent', label: 'Most recent' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              currentSort === opt.key
                ? 'bg-[#252526] text-[#e8e8e8]'
                : 'text-[#555] hover:text-[#888]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
