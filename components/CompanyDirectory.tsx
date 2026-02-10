'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { CompanyDirectoryItem } from '@/lib/airtable';
import FilterDropdown, { type FilterOption } from './FilterDropdown';

interface CompanyDirectoryProps {
  companies: CompanyDirectoryItem[];
}

const STAGES = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E+', 'Growth', 'Public'];

function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default function CompanyDirectory({ companies }: CompanyDirectoryProps) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [investorFilter, setInvestorFilter] = useState<string[]>([]);
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);

  // Build investor options from data
  const investorOptions = useMemo((): FilterOption[] => {
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

  // Build industry options from data
  const industryOptions = useMemo((): FilterOption[] => {
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

  const filtered = useMemo(() => {
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
      if (investorFilter.length > 0 && !c.investors.some(inv => investorFilter.includes(inv))) return false;
      if (industryFilter.length > 0 && (!c.industry || !industryFilter.includes(c.industry))) return false;
      return true;
    });
  }, [companies, search, stageFilter, investorFilter, industryFilter]);

  const hasActiveFilters = stageFilter.length > 0 || investorFilter.length > 0 || industryFilter.length > 0;

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Companies</h1>
        <p className="text-sm text-[#888] mt-1">
          {companies.length.toLocaleString()} VC-backed companies tracked on Cadre. Click any to see open roles.
        </p>
      </div>

      {/* Search */}
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
            placeholder="Search companies, investors, industries..."
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

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <FilterDropdown label="Industry" options={industryOptions} selected={industryFilter} onChange={setIndustryFilter} multiSelect={false} searchable />
        <FilterDropdown label="Stage" options={stageOptions} selected={stageFilter} onChange={setStageFilter} multiSelect={false} />
        <FilterDropdown label="Backed By" options={investorOptions} selected={investorFilter} onChange={setInvestorFilter} multiSelect={false} searchable />
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-3">
          {industryFilter.map(f => (
            <button
              key={f}
              onClick={() => setIndustryFilter([])}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#5e6ad2]/10 rounded text-xs text-[#5e6ad2]"
            >
              {f}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          ))}
          {stageFilter.map(f => (
            <button
              key={f}
              onClick={() => setStageFilter([])}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#5e6ad2]/10 rounded text-xs text-[#5e6ad2]"
            >
              {f}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          ))}
          {investorFilter.map(f => (
            <button
              key={f}
              onClick={() => setInvestorFilter([])}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#5e6ad2]/10 rounded text-xs text-[#5e6ad2]"
            >
              {f}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          ))}
          <button
            onClick={() => { setStageFilter([]); setInvestorFilter([]); setIndustryFilter([]); }}
            className="text-xs text-[#555] hover:text-[#888] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-[#555] mb-4">
        {filtered.length === companies.length
          ? `${companies.length.toLocaleString()} companies`
          : `${filtered.length.toLocaleString()} of ${companies.length.toLocaleString()} companies`}
      </p>

      {/* Company grid */}
      <div className="flex flex-wrap gap-2">
        {filtered.map((company) => {
          const domain = getDomain(company.url);
          return (
            <Link
              key={company.slug}
              href={`/companies/${company.slug}`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1b] hover:bg-[#252526] rounded-lg text-sm text-[#e8e8e8] transition-colors group"
            >
              {domain ? (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                  alt=""
                  className="w-4 h-4 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="w-4 h-4 rounded-sm bg-[#252526] flex items-center justify-center text-[8px] font-bold text-[#555]">
                  {company.name.charAt(0)}
                </div>
              )}
              <span className="whitespace-nowrap">{company.name}</span>
              {company.stage && (
                <span className="text-[10px] text-[#555] font-medium">{company.stage}</span>
              )}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#888]">No companies found matching your filters.</p>
          <p className="text-[#999] text-sm mt-1">Try adjusting your search or clearing filters.</p>
        </div>
      )}
    </>
  );
}
