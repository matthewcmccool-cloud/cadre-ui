'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { InvestorDirectoryItem } from '@/lib/data';
import Favicon from '@/components/Favicon';
import FilterDropdown, { type FilterOption } from './FilterDropdown';

interface InvestorDirectoryProps {
  investors: InvestorDirectoryItem[];
}

type SortMode = 'portfolio' | 'alpha';
const INITIAL_DISPLAY_COUNT = 54;

function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default function InvestorDirectory({ investors }: InvestorDirectoryProps) {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('portfolio');
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Build filter options from investor data
  const industryOptions = useMemo((): FilterOption[] => {
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

  const stageOptions = useMemo((): FilterOption[] => {
    const counts = new Map<string, number>();
    for (const inv of investors) {
      for (const st of inv.stages) {
        counts.set(st, (counts.get(st) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [investors]);

  const filtered = useMemo(() => {
    let result = investors;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(inv => inv.name.toLowerCase().includes(q));
    }
    if (industryFilter.length > 0) {
      result = result.filter(inv =>
        inv.industries.some(ind => industryFilter.includes(ind))
      );
    }
    if (stageFilter.length > 0) {
      result = result.filter(inv =>
        inv.stages.some(st => stageFilter.includes(st))
      );
    }
    if (sortMode === 'alpha') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [investors, search, sortMode, industryFilter, stageFilter]);

  const hasActiveFilters = industryFilter.length > 0 || stageFilter.length > 0;

  return (
    <>
      {/* Descriptor */}
      <div className="mb-4">
        <p className="text-sm text-[#888]">
          <span className="text-[#ccc] font-medium">{investors.length} VC firms</span>
          {' '}&mdash; click any to see portfolio companies and open roles.
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
            placeholder="Search investors..."
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

      {/* Filter chips + sort */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <FilterDropdown label="Industry" options={industryOptions} selected={industryFilter} onChange={setIndustryFilter} multiSelect={false} searchable />
        <FilterDropdown label="Stage" options={stageOptions} selected={stageFilter} onChange={setStageFilter} multiSelect={false} />

        <div className="ml-auto flex items-center gap-0.5">
          {([
            { key: 'portfolio' as SortMode, label: 'By portfolio size' },
            { key: 'alpha' as SortMode, label: 'A\u2013Z' },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortMode(opt.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                sortMode === opt.key
                  ? 'bg-[#252526] text-[#e8e8e8]'
                  : 'text-[#555] hover:text-[#888]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
          <button
            onClick={() => { setIndustryFilter([]); setStageFilter([]); }}
            className="text-xs text-[#555] hover:text-[#888] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-[#555] mb-4">
        {filtered.length === investors.length
          ? `${investors.length} investors`
          : `${filtered.length} of ${investors.length} investors`}
      </p>

      {/* Investor grid */}
      <div className="flex flex-wrap gap-2">
        {(expanded ? filtered : filtered.slice(0, INITIAL_DISPLAY_COUNT)).map((investor, i) => {
          const domain = getDomain(investor.url);
          const isRevealed = expanded && i >= INITIAL_DISPLAY_COUNT;
          return (
            <Link
              key={investor.slug}
              href={`/investors/${investor.slug}`}
              className={`inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1b] hover:bg-[#252526] rounded-lg text-sm text-[#e8e8e8] transition-colors group${isRevealed ? ' animate-chip-reveal' : ''}`}
              style={isRevealed ? { animationDelay: `${Math.min((i - INITIAL_DISPLAY_COUNT) * 8, 300)}ms` } : undefined}
            >
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
          );
        })}
        {filtered.length > INITIAL_DISPLAY_COUNT && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-[#5e6ad2]/40 bg-[#5e6ad2]/20 text-[#8b93e6] hover:bg-[#5e6ad2]/30"
          >
            {expanded ? 'Show less' : `View all ${filtered.length} \u2192`}
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#888]">No investors found matching your search.</p>
          <p className="text-[#999] text-sm mt-1">Try a different search term.</p>
        </div>
      )}
    </>
  );
}
