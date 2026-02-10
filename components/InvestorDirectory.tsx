'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { InvestorDirectoryItem } from '@/lib/airtable';

interface InvestorDirectoryProps {
  investors: InvestorDirectoryItem[];
}

type SortMode = 'portfolio' | 'alpha';

export default function InvestorDirectory({ investors }: InvestorDirectoryProps) {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('portfolio');

  const filtered = useMemo(() => {
    let result = investors;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(inv => inv.name.toLowerCase().includes(q));
    }
    if (sortMode === 'alpha') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    // 'portfolio' is already the default sort from the server
    return result;
  }, [investors, search, sortMode]);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Investors</h1>
        <p className="text-sm text-[#888] mt-1">
          {investors.length} VC firms tracked on Cadre. Click any to see their portfolio companies and open roles.
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
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

      {/* Sort toggle + count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#555]">
          {filtered.length === investors.length
            ? `${investors.length} investors`
            : `${filtered.length} of ${investors.length} investors`}
        </p>
        <div className="flex items-center gap-0.5">
          {([
            { key: 'portfolio' as SortMode, label: 'By portfolio size' },
            { key: 'alpha' as SortMode, label: 'A–Z' },
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

      {/* Investor grid */}
      <div className="flex flex-wrap gap-2">
        {filtered.map((investor) => (
          <Link
            key={investor.slug}
            href={`/investors/${investor.slug}`}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1b] hover:bg-[#252526] rounded-lg text-sm text-[#e8e8e8] transition-colors group"
          >
            <span className="whitespace-nowrap">{investor.name}</span>
            {investor.companyCount > 0 && (
              <span className="text-[10px] text-[#555] font-medium">
                {investor.companyCount} {investor.companyCount === 1 ? 'co' : 'cos'}
              </span>
            )}
          </Link>
        ))}
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
