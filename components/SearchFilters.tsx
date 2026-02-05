'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const POPULAR_TAGS = [
  'engineering', 'product', 'design', 'sales', 'marketing',
  'data science', 'ai', 'machine learning', 'backend', 'frontend',
  'full stack', 'devops', 'mobile', 'ios', 'android',
  'product manager', 'analyst', 'operations', 'finance', 'legal',
  'customer success', 'recruiting', 'hr', 'growth', 'content',
];

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const isRemote = searchParams.get('remote') === 'true';
  const currentSearch = searchParams.get('search') || '';

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
    params.set('search', tag);
    params.delete('page');
    setSearch(tag);
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
    <div className="mb-8">
      {/* Search Bar + Remote Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6A6A6A]"
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
              className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-[#F9F9F9] placeholder-[#6A6A6A] focus:outline-none focus:border-[#5A5A5A] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6A6A6A] hover:text-[#F9F9F9]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Remote Toggle */}
        <button
          onClick={toggleRemote}
          className={`flex items-center gap-3 px-5 py-3 rounded-lg border transition-colors ${
            isRemote
              ? 'bg-[#2D3A2D] border-[#4A5A4A] text-[#9AE6B4]'
              : 'bg-[#1A1A1A] border-[#3A3A3A] text-[#A0A0A0] hover:border-[#5A5A5A]'
          }`}
        >
          <div className={`w-10 h-6 rounded-full relative transition-colors ${isRemote ? 'bg-[#9AE6B4]' : 'bg-[#3A3A3A]'}`}>
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isRemote ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </div>
          <span className="font-medium">Remote</span>
        </button>
      </div>

      {/* Popular Tags */}
      <div className="flex flex-wrap gap-2">
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`px-3 py-1.5 rounded border text-sm transition-colors ${
              currentSearch.toLowerCase() === tag.toLowerCase()
                ? 'bg-[#F9F9F9] text-[#1A1A1A] border-[#F9F9F9]'
                : 'bg-transparent border-[#3A3A3A] text-[#A0A0A0] hover:border-[#6A6A6A] hover:text-[#F9F9F9]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
