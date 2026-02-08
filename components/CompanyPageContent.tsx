'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Job } from '@/lib/airtable';
import CompanyLogo from '@/components/CompanyLogo';

const POPULAR_TAGS = [
  'engineering', 'product', 'design', 'sales', 'marketing',
  'data science', 'ai', 'machine learning', 'backend', 'frontend',
  'full stack', 'devops', 'mobile', 'product manager', 'analyst',
  'operations', 'finance', 'growth', 'customer success', 'recruiting',
];

interface CompanyPageContentProps {
  company: {
    name: string;
    url?: string;
    about?: string;
    stage?: string;
    size?: string;
    hqLocation?: string;
    totalRaised?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    investors: string[];
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

const PAGE_SIZE = 25;

export default function CompanyPageContent({ company, jobs }: CompanyPageContentProps) {
  const [search, setSearch] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);

  const companyDomain = getDomain(company.url);

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const searchLower = search.toLowerCase();
    const tagLower = activeTag.toLowerCase();

    const matchesSearch = !search ||
      job.title.toLowerCase().includes(searchLower) ||
      (job.location && job.location.toLowerCase().includes(searchLower));

    const matchesTag = !activeTag ||
      job.title.toLowerCase().includes(tagLower) ||
      (job.departmentName && job.departmentName.toLowerCase().includes(tagLower));

    const matchesRemote = !isRemote ||
      job.remoteFirst ||
      (job.location && job.location.toLowerCase().includes('remote'));

    return matchesSearch && matchesTag && matchesRemote;
  });

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const paginatedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTagClick = (tag: string) => {
    setPage(1);
    if (activeTag === tag) {
      setActiveTag('');
    } else {
      setActiveTag(tag);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <>
      {/* Company header */}
      <div className="mt-8 mb-6">
        <div className="flex items-center gap-4 mb-3">
          {companyDomain && (
            <CompanyLogo
              src={`https://www.google.com/s2/favicons?domain=${companyDomain}&sz=64`}
              alt={company.name}
              className="w-12 h-12 rounded-lg"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
            {(company.url || company.linkedinUrl || company.twitterUrl) && (
              <div className="flex gap-3 mt-1">
                {company.url && (
                  <a href={company.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#888] hover:text-[#e8e8e8] transition-colors">
                    Website
                  </a>
                )}
                {company.linkedinUrl && (
                  <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#888] hover:text-[#e8e8e8] transition-colors">
                    LinkedIn
                  </a>
                )}
                {company.twitterUrl && (
                  <a href={company.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#888] hover:text-[#e8e8e8] transition-colors">
                    X / Twitter
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
            {filteredJobs.length} open positions
          </span>
          {company.hqLocation && (
            <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
              {company.hqLocation}
            </span>
          )}
          {company.investors.length > 0 && (
            <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
              Backed by {company.investors.slice(0, 3).join(', ')}
              {company.investors.length > 3 && ` +${company.investors.length - 3} more`}
            </span>
          )}
        </div>

        {company.about && (
          <p className="mt-3 text-sm text-[#999] leading-relaxed max-w-2xl">
            {company.about}
          </p>
        )}
      </div>

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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search roles, skills..."
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
          onClick={() => { setIsRemote(!isRemote); setPage(1); }}
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
        {paginatedJobs.length > 0 ? (
          <div className="space-y-0.5">
            {paginatedJobs.map((job, index) => {
              const jobCompanyDomain = getDomain(job.companyUrl);
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
                    {jobCompanyDomain ? (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${jobCompanyDomain}&sz=32`}
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

                  {/* Job Info — left side */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{job.title}</h3>
                    <p className="text-xs text-[#888] mt-0.5">{job.company}</p>
                  </div>

                  {/* Function badge + Location — right side */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {job.departmentName && (
                      <span className="px-2 py-0.5 bg-[#252526] rounded text-xs text-[#aaa] hidden sm:inline-block">
                        {job.departmentName}
                      </span>
                    )}
                    <span className="text-xs text-[#666] w-36 text-right truncate hidden sm:block">
                      {job.location || 'Remote'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-[#666] text-sm py-8 text-center">No jobs found matching your filters.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1b] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 text-sm rounded transition-colors ${
                      pageNum === page
                        ? 'bg-[#5e6ad2] text-white'
                        : 'text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1b]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1b] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </>
  );
}
