'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';

const POPULAR_TAGS = [
  'engineering', 'product', 'design', 'sales', 'marketing',
  'data science', 'ai', 'machine learning', 'backend', 'frontend',
  'full stack', 'devops', 'mobile', 'product manager', 'analyst',
  'operations', 'finance', 'growth', 'customer success', 'recruiting',
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
}

export default function SearchFilters({ companies = [], investors = [], industries = [] }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const isRemote = searchParams.get('remote') === 'true';
  const currentSearch = searchParams.get('search') || '';

  // Match entities against current search input (2+ chars)
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

  const toggleRemote = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isRemote) {
      params.delete('remote');
    } else {
      params.set('remote', 'true');
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSearch.toLowerCase() === tag.toLowerCase()) {
      params.delete('search');
      setSearch('');
    } else {
      params.set('search', tag);
      setSearch(tag);
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

  return (
    <div className="mb-6">
      {/* Search Bar + Remote Toggle */}
      <div className="flex gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles, companies, skills..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#1a1a1b] text-[#e8e8e8] placeholder-[#666] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50 transition-all"
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

        {/* Remote Toggle */}
        <button
          onClick={toggleRemote}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isRemote
              ? 'bg-[#5e6ad2]/20 text-[#5e6ad2]'
              : 'bg-[#1a1a1b] text-[#888] hover:text-[#e8e8e8] hover:bg-[#252526]'
          }`}
        >
          <div className={`w-8 h-5 rounded-full relative transition-colors ${isRemote ? 'bg-[#5e6ad2]' : 'bg-[#333]'}`}>
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                isRemote ? 'translate-x-3.5' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span>Remote</span>
        </button>
      </div>

      {/* Entity Match Chips */}
      {entityMatches.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
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

      {/* Popular Tags */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              currentSearch.toLowerCase() === tag.toLowerCase()
                ? 'bg-[#5e6ad2] text-white'
                : 'bg-[#1a1a1b] text-[#888] hover:bg-[#252526] hover:text-[#e8e8e8]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
