'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Job } from '@/lib/airtable';

// ── Types ────────────────────────────────────────────────────────
interface InvestorStats {
  totalRoles: number;
  companiesHiring: number;
  totalCompanies: number;
  topDepartment: { name: string; count: number; pct: number } | null;
  remotePct: number;
  topCompanies: Array<{ name: string; slug: string; roleCount: number }>;
}

interface InvestorPageContentProps {
  investor: {
    name: string;
    bio: string;
    location: string;
    website?: string;
    linkedinUrl?: string;
    jobCount: number;
    companies: Array<{ id: string; name: string; slug: string }>;
  };
  jobs: Job[];
  stats: InvestorStats;
  investorSlug: string;
}

// ── Post generator types ─────────────────────────────────────────
interface PostResult {
  investor: string;
  totalRoles: number;
  totalCompanies: number;
  filter: string;
  post: string;
  companies: Array<{
    name: string;
    slug: string;
    roleCount: number;
    remoteCount: number;
    topFunctions: string[];
  }>;
}

const POST_FILTERS = [
  { value: '', label: 'All Roles' },
  { value: 'remote', label: 'Remote' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'ai', label: 'AI' },
  { value: 'sales', label: 'Sales' },
];

// ── Job search tags ──────────────────────────────────────────────
const POPULAR_TAGS = [
  'engineering', 'product', 'design', 'sales', 'marketing',
  'data science', 'ai', 'machine learning', 'backend', 'frontend',
  'full stack', 'devops', 'mobile', 'product manager', 'analyst',
  'operations', 'finance', 'growth', 'customer success', 'recruiting',
];

const getDomain = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

const PAGE_SIZE = 25;
const COLLAPSED_HEIGHT = 80;

// ── Component ────────────────────────────────────────────────────
export default function InvestorPageContent({ investor, jobs, stats, investorSlug }: InvestorPageContentProps) {
  // Job list state
  const [search, setSearch] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);
  const [companiesExpanded, setCompaniesExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const companiesRef = useRef<HTMLDivElement>(null);

  // Post generator state
  const [postFilter, setPostFilter] = useState('');
  const [postResult, setPostResult] = useState<PostResult | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [postCopied, setPostCopied] = useState(false);
  const [postError, setPostError] = useState('');
  const [postOpen, setPostOpen] = useState(false);

  useEffect(() => {
    if (companiesRef.current) {
      setNeedsExpand(companiesRef.current.scrollHeight > COLLAPSED_HEIGHT + 8);
    }
  }, [investor.companies]);

  // ── Job filtering ──────────────────────────────────────────────
  const filteredJobs = jobs.filter((job) => {
    const searchLower = search.toLowerCase();
    const tagLower = activeTag.toLowerCase();

    const matchesSearch = !search ||
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      (job.location && job.location.toLowerCase().includes(searchLower));

    const matchesTag = !activeTag ||
      job.title.toLowerCase().includes(tagLower) ||
      (job.departmentName && job.departmentName.toLowerCase().includes(tagLower));

    const matchesRemote = !isRemote || job.remoteFirst;

    return matchesSearch && matchesTag && matchesRemote;
  });

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const paginatedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTagClick = (tag: string) => {
    setPage(1);
    setActiveTag(activeTag === tag ? '' : tag);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  // ── Post generator ─────────────────────────────────────────────
  const generatePost = async () => {
    setPostLoading(true);
    setPostError('');
    setPostResult(null);

    try {
      const params = new URLSearchParams({ investor: investorSlug });
      if (postFilter) params.set('filter', postFilter);

      const res = await fetch(`/api/content/linkedin-post?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setPostError(data.error || 'Failed to generate post');
        return;
      }

      setPostResult(data);
    } catch {
      setPostError('Network error — please try again');
    } finally {
      setPostLoading(false);
    }
  };

  const copyPost = async () => {
    if (!postResult?.post) return;
    await navigator.clipboard.writeText(postResult.post);
    setPostCopied(true);
    setTimeout(() => setPostCopied(false), 2000);
  };

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mt-8 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{investor.name}</h1>
        <p className="text-sm text-[#888] mt-1">
          {stats.totalCompanies} portfolio companies · {stats.totalRoles.toLocaleString()} open roles · Updated daily
        </p>
        {(investor.website || investor.linkedinUrl) && (
          <div className="flex gap-3 mt-2">
            {investor.website && (
              <a href={investor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#888] hover:text-[#e8e8e8] transition-colors">
                Website ↗
              </a>
            )}
            {investor.linkedinUrl && (
              <a href={investor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#888] hover:text-[#e8e8e8] transition-colors">
                LinkedIn ↗
              </a>
            )}
          </div>
        )}
        {investor.bio && (
          <p className="mt-3 text-sm text-[#999] leading-relaxed max-w-2xl">
            {investor.bio}
          </p>
        )}
      </div>

      {/* ── Portfolio Pulse — 4 stat cards ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <div className="bg-[#5e6ad2] rounded-lg px-4 py-3">
          <div className="text-xl font-bold text-white">{stats.totalRoles.toLocaleString()}</div>
          <div className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">OPEN ROLES</div>
        </div>
        <div className="bg-[#1a1a1b] rounded-lg px-4 py-3 border border-[#252526]">
          <div className="text-xl font-bold text-white">
            {stats.companiesHiring}
            <span className="text-sm font-normal text-[#888]"> / {stats.totalCompanies}</span>
          </div>
          <div className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">COS. HIRING</div>
        </div>
        {stats.topDepartment && (
          <div className="bg-[#1a1a1b] rounded-lg px-4 py-3 border border-[#252526]">
            <div className="text-lg font-bold text-white truncate">{stats.topDepartment.name}</div>
            <div className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">{stats.topDepartment.pct}% OF ROLES</div>
          </div>
        )}
        <div className="bg-[#1a1a1b] rounded-lg px-4 py-3 border border-[#252526]">
          <div className="text-xl font-bold text-white">{stats.remotePct}%</div>
          <div className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">REMOTE</div>
        </div>
      </div>

      {/* ── Content Studio — Inline Post Generator ───────────────── */}
      <section className="mb-6">
        <div className="bg-[#1a1a1b] rounded-lg border border-[#252526] overflow-hidden">
          <button
            onClick={() => setPostOpen(!postOpen)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#252526] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider">PORTFOLIO CONTENT</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#5e6ad2]/15 text-[#5e6ad2]">
                LinkedIn
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-[#888] transition-transform ${postOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {postOpen && (
            <div className="px-4 pb-4 border-t border-[#252526]">
              <p className="text-xs text-[#888] mt-3 mb-3">
                Generate a portfolio hiring post for LinkedIn. One click, copy, share.
              </p>

              {/* Filter chips + generate button */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {POST_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => { setPostFilter(f.value); setPostResult(null); }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      postFilter === f.value
                        ? 'bg-[#5e6ad2] text-white'
                        : 'bg-[#252526] text-[#888] hover:text-[#e8e8e8]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <button
                  onClick={generatePost}
                  disabled={postLoading}
                  className="ml-auto px-4 py-1.5 bg-[#5e6ad2] hover:bg-[#6e7ae2] disabled:opacity-40 text-white text-xs font-semibold rounded transition-colors"
                >
                  {postLoading ? 'Generating...' : 'Generate Post'}
                </button>
              </div>

              {/* Error */}
              {postError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-2 mb-3">
                  <p className="text-xs text-red-400">{postError}</p>
                </div>
              )}

              {/* Result */}
              {postResult && (
                <div className="space-y-3">
                  {/* Stats bar */}
                  <div className="flex items-center gap-3 text-xs text-[#888]">
                    <span><span className="text-white font-medium">{postResult.totalCompanies}</span> companies</span>
                    <span className="text-[#333]">·</span>
                    <span><span className="text-white font-medium">{postResult.totalRoles.toLocaleString()}</span> roles</span>
                    {postFilter && (
                      <>
                        <span className="text-[#333]">·</span>
                        <span className="text-[#5e6ad2]">{POST_FILTERS.find(f => f.value === postFilter)?.label}</span>
                      </>
                    )}
                  </div>

                  {/* Post preview */}
                  <div className="bg-[#0e0e0f] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#252526]">
                      <span className="text-[10px] text-[#888] uppercase tracking-wider">Post Preview</span>
                      <button
                        onClick={copyPost}
                        className="px-3 py-1 bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-[10px] font-semibold rounded transition-colors"
                      >
                        {postCopied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>
                    </div>
                    <pre className="p-3 text-xs text-[#e8e8e8] whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                      {postResult.post}
                    </pre>
                  </div>

                  {/* Company breakdown */}
                  <div className="bg-[#0e0e0f] rounded-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#252526]">
                      <span className="text-[10px] text-[#888] uppercase tracking-wider">Company Breakdown</span>
                    </div>
                    <div className="divide-y divide-[#1a1a1b] max-h-48 overflow-y-auto">
                      {postResult.companies.map((company) => (
                        <div key={company.slug} className="flex items-center justify-between px-3 py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-[#e8e8e8] truncate">{company.name}</span>
                            {company.topFunctions.length > 0 && (
                              <span className="text-[10px] text-[#555] truncate hidden sm:inline">
                                {company.topFunctions.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {company.remoteCount > 0 && (
                              <span className="text-[10px] text-green-400/70 px-1.5 py-0.5 bg-green-400/10 rounded">
                                {company.remoteCount} remote
                              </span>
                            )}
                            <span className="text-xs text-[#e8e8e8] font-medium w-12 text-right">
                              {company.roleCount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Top Hiring Companies ──────────────────────────────────── */}
      {stats.topCompanies.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">TOP HIRING</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stats.topCompanies.map((company) => (
              <Link
                key={company.slug}
                href={`/companies/${company.slug}`}
                className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1b] hover:bg-[#252526] rounded-lg border border-[#252526] transition-colors shrink-0"
              >
                <span className="text-sm text-white font-medium">{company.name}</span>
                <span className="text-xs text-[#5e6ad2] font-medium">{company.roleCount}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Portfolio Companies (collapsible chips) ────────────────── */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">
          ALL PORTFOLIO COMPANIES
        </h2>
        {investor.companies.length > 0 ? (
          <div className="relative">
            <div
              ref={companiesRef}
              className="flex flex-wrap gap-1.5 overflow-hidden transition-all duration-300"
              style={{ maxHeight: companiesExpanded ? companiesRef.current?.scrollHeight : COLLAPSED_HEIGHT }}
            >
              {investor.companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.slug}`}
                  className="px-2.5 py-1 bg-[#1a1a1b] hover:bg-[#252526] rounded text-xs text-[#e8e8e8] transition-colors"
                >
                  {company.name}
                </Link>
              ))}
            </div>
            {needsExpand && (
              <button
                onClick={() => setCompaniesExpanded(!companiesExpanded)}
                className="mt-2 text-xs text-[#5e6ad2] hover:text-[#7b83e0] transition-colors"
              >
                {companiesExpanded ? 'Show less' : `Show all ${investor.companies.length}`}
              </button>
            )}
          </div>
        ) : (
          <p className="text-[#999] text-sm">No portfolio companies listed.</p>
        )}
      </section>

      {/* ── Search + Filters for Job List ──────────────────────────── */}
      <section>
        <h2 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">
          ALL OPEN ROLES
        </h2>

        <div className="flex gap-3 mb-4">
          <form onSubmit={(e) => e.preventDefault()} className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]"
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
                placeholder="Search roles, companies, skills..."
                className="w-full pl-10 pr-10 py-2.5 bg-[#1a1a1b] text-[#e8e8e8] placeholder-[#999] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#e8e8e8] transition-colors"
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
        <div className="flex flex-wrap gap-1.5 mb-5">
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

        {/* Job count */}
        <p className="text-xs text-[#888] mb-3">
          {filteredJobs.length === jobs.length
            ? `${filteredJobs.length.toLocaleString()} roles`
            : `${filteredJobs.length.toLocaleString()} of ${jobs.length.toLocaleString()} roles`}
        </p>

        {/* Job List */}
        {paginatedJobs.length > 0 ? (
          <div className="rounded-lg border border-[#1a1a1b] divide-y divide-[#1a1a1b] overflow-hidden">
            {paginatedJobs.map((job) => {
              const companyDomain = getDomain(job.companyUrl);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#0e0e0f] hover:bg-[#141415] transition-colors"
                >
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    {companyDomain ? (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${companyDomain}&sz=32`}
                        alt=""
                        className="w-7 h-7 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded bg-[#252526] flex items-center justify-center text-[10px] font-semibold text-[#888]">
                        {job.company.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{job.title}</h3>
                    <p className="text-xs text-[#888] mt-0.5">{job.company}</p>
                  </div>

                  {/* Function + Location */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {job.departmentName && (
                      <span className="px-2 py-0.5 bg-[#252526] rounded text-xs text-[#aaa] hidden sm:inline-block">
                        {job.departmentName}
                      </span>
                    )}
                    <span className="text-xs text-[#999] w-36 text-right truncate hidden sm:block">
                      {job.location || 'Remote'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-[#999] text-sm py-8 text-center">No jobs found matching your filters.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1">
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
