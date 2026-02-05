'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Job } from '@/lib/airtable';

const POPULAR_TAGS = [
  'engineering', 'product', 'design', 'sales', 'marketing',
  'data science', 'ai', 'machine learning', 'backend', 'frontend',
  'full stack', 'devops', 'mobile', 'product manager', 'analyst',
  'operations', 'finance', 'growth', 'customer success', 'recruiting',
];

interface InvestorPageContentProps {
  investor: {
    name: string;
    jobCount: number;
    companies: Array<{ id: string; name: string; slug: string }>;
  };
  jobs: Job[];
}

const getDomain = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

export default function InvestorPageContent({ investor, jobs }: InvestorPageContentProps) {
  const [search, setSearch] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [activeTag, setActiveTag] = useState('');

  // Filter jobs based on search, remote, and tag
  const filteredJobs = jobs.filter((job) => {
    const searchLower = search.toLowerCase();
    const tagLower = activeTag.toLowerCase();

    // Search filter
    const matchesSearch = !search ||
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      (job.location && job.location.toLowerCase().includes(searchLower));

    // Tag filter
    const matchesTag = !activeTag ||
      job.title.toLowerCase().includes(tagLower) ||
      (job.functionName && job.functionName.toLowerCase().includes(tagLower));

    // Remote filter
    const matchesRemote = !isRemote || job.remoteFirst;

    return matchesSearch && matchesTag && matchesRemote;
  });

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      setActiveTag('');
    } else {
      setActiveTag(tag);
    }
  };

  const clearSearch = () => {
    setSearch('');
  };

  return (
    <>
      {/* Investor header */}
      <div className="mt-8 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{investor.name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
            {filteredJobs.length} open positions
          </span>
          <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
            {investor.companies.length} portfolio companies
          </span>
        </div>
      </div>

      {/* Portfolio Companies */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-[#888] uppercase tracking-wide mb-3">Portfolio Companies</h2>
        {investor.companies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {investor.companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.slug}`}
                className="px-3 py-1.5 bg-[#1a1a1b] hover:bg-[#252526] rounded text-sm text-[#e8e8e8] transition-colors"
              >
                {company.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[#666] text-sm">No portfolio companies listed.</p>
        )}
      </section>

      {/* Search Bar + Remote Toggle */}
      <div className="flex gap-3 mb-5">
        <form onSubmit={(e) => e.preventDefault()} className="flex-1">
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
          onClick={() => setIsRemote(!isRemote)}
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

      {/* Popular Tags */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              activeTag === tag
                ? 'bg-[#5e6ad2] text-white'
                : 'bg-[#1a1a1b] text-[#888] hover:bg-[#252526] hover:text-[#e8e8e8]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Open Positions */}
      <section>
        <h2 className="text-sm font-medium text-[#888] uppercase tracking-wide mb-3">Open Positions</h2>
        {filteredJobs.length > 0 ? (
          <div className="space-y-0.5">
            {filteredJobs.map((job, index) => {
              const companyDomain = getDomain(job.companyUrl);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#252526] transition-colors ${
                    index % 2 === 0 ? 'bg-[#1a1a1b]' : 'bg-[#151516]'
                  }`}
                >
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    {companyDomain ? (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${companyDomain}&sz=32`}
                        alt=""
                        className="w-8 h-8 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-[#252526]" />
                    )}
                  </div>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{job.title}</h3>
                    <p className="text-xs text-[#888] mt-0.5">
                      {job.company} · {job.location || 'Remote'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-[#666] text-sm py-8 text-center">No jobs found matching your filters.</p>
        )}
      </section>
    </>
  );
}
