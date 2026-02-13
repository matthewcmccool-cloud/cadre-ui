'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Job } from '@/lib/data';
import { formatNumber } from '@/lib/format';
import Favicon from '@/components/Favicon';
import FollowPortfolioButton from '@/components/FollowPortfolioButton';
import { useFollows } from '@/hooks/useFollows';
import { useSubscription } from '@/hooks/useSubscription';
import { trackViewInvestor } from '@/lib/analytics';

interface InvestorPageContentProps {
  investor: {
    id: string;
    name: string;
    slug: string;
    bio: string;
    location: string;
    website?: string;
    linkedinUrl?: string;
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

const COLLAPSED_HEIGHT = 80;

export default function InvestorPageContent({ investor, jobs }: InvestorPageContentProps) {
  const [search, setSearch] = useState('');
  const [companiesExpanded, setCompaniesExpanded] = useState(false);

  useEffect(() => {
    trackViewInvestor(investor.slug);
  }, [investor.slug]);
  const [needsExpand, setNeedsExpand] = useState(false);
  const companiesRef = useRef<HTMLDivElement>(null);
  const { isFollowing } = useFollows();
  const { isPro } = useSubscription();

  useEffect(() => {
    if (companiesRef.current) {
      setNeedsExpand(companiesRef.current.scrollHeight > COLLAPSED_HEIGHT + 8);
    }
  }, [investor.companies]);

  // Count new roles this week
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = jobs.filter(j => j.datePosted && new Date(j.datePosted).getTime() > oneWeekAgo).length;

  // Filter jobs by search
  const filteredJobs = jobs.filter((job) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      (job.location && job.location.toLowerCase().includes(q)) ||
      (job.departmentName && job.departmentName.toLowerCase().includes(q))
    );
  });

  // Sort portfolio companies by job count (descending)
  const sortedCompanies = [...investor.companies].sort((a, b) => {
    const aJobs = jobs.filter(j => j.company === a.name).length;
    const bJobs = jobs.filter(j => j.company === b.name).length;
    return bJobs - aJobs;
  });

  const portfolioCompanyIds = investor.companies.map((c) => c.id);

  return (
    <>
      {/* ── Top Section ── */}
      <div className="mt-6 mb-8">
        {/* Name + Follow Portfolio */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{investor.name}</h1>
          <FollowPortfolioButton
            investorSlug={investor.slug}
            investorName={investor.name}
            companyCount={investor.companies.length}
            portfolioCompanyIds={portfolioCompanyIds}
          />
        </div>

        {/* Subtitle */}
        <p className="mt-1 text-sm text-zinc-400">
          Venture Capital{investor.location ? ` · ${investor.location}` : ''}
        </p>

        {/* Links */}
        {(investor.website || investor.linkedinUrl) && (
          <div className="flex gap-3 mt-2">
            {investor.website && (
              <a href={investor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Website ↗
              </a>
            )}
            {investor.linkedinUrl && (
              <a href={investor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                LinkedIn ↗
              </a>
            )}
          </div>
        )}

        {/* Bio */}
        {investor.bio && (
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-2xl">
            {investor.bio}
          </p>
        )}
      </div>

      {/* ── Portfolio Overview ── */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-800">
          <div className="text-xl font-semibold text-zinc-100">{formatNumber(investor.companies.length)}</div>
          <div className="text-xs text-zinc-500 mt-0.5">portfolio companies</div>
        </div>
        <div className="bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-800">
          <div className="text-xl font-semibold text-zinc-100">{formatNumber(jobs.length)}</div>
          <div className="text-xs text-zinc-500 mt-0.5">open roles</div>
        </div>
        <div className="bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-800">
          <div className="text-xl font-semibold text-zinc-100">{formatNumber(newThisWeek)}</div>
          <div className="text-xs text-zinc-500 mt-0.5">new roles this week</div>
        </div>
      </div>

      {/* ── Portfolio Companies ── */}
      <section className="mb-10">
        <h2 className="text-lg font-medium text-zinc-100 mb-4">Portfolio Companies</h2>
        {sortedCompanies.length > 0 ? (
          <div className="relative">
            <div
              ref={companiesRef}
              className="flex flex-wrap gap-2 overflow-hidden transition-all duration-300"
              style={{ maxHeight: companiesExpanded ? companiesRef.current?.scrollHeight : COLLAPSED_HEIGHT }}
            >
              {sortedCompanies.map((company) => {
                const followed = isFollowing(company.id);
                const companyJobCount = jobs.filter(j => j.company === company.name).length;
                return (
                  <Link
                    key={company.id}
                    href={`/companies/${company.slug}`}
                    className={`inline-flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-200 border transition-colors ${
                      followed
                        ? 'border-l-2 border-l-purple-500 border-t-zinc-800 border-r-zinc-800 border-b-zinc-800'
                        : 'border-zinc-800'
                    }`}
                  >
                    <span>{company.name}</span>
                    {companyJobCount > 0 && (
                      <span className="text-xs text-zinc-500">{formatNumber(companyJobCount)} roles</span>
                    )}
                  </Link>
                );
              })}
            </div>
            {needsExpand && (
              <button
                onClick={() => setCompaniesExpanded(!companiesExpanded)}
                className="mt-3 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                {companiesExpanded ? 'Show less' : `Show all ${investor.companies.length} companies`}
              </button>
            )}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No portfolio companies listed.</p>
        )}
      </section>

      {/* ── Portfolio Hiring Activity (Pro-gated) ── */}
      <section className="mb-10">
        <h2 className="text-lg font-medium text-zinc-100 mb-4">Portfolio Hiring Activity</h2>
        {isPro ? (
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <p className="text-sm text-zinc-400">Portfolio analytics coming soon.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Blurred placeholder content */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 select-none pointer-events-none blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800 rounded-lg p-4 h-32">
                  <div className="h-3 w-24 bg-zinc-700 rounded mb-2" />
                  <div className="h-6 w-16 bg-zinc-700 rounded" />
                </div>
                <div className="bg-zinc-800 rounded-lg p-4 h-32">
                  <div className="h-3 w-20 bg-zinc-700 rounded mb-2" />
                  <div className="h-6 w-12 bg-zinc-700 rounded" />
                </div>
              </div>
              <div className="mt-4 bg-zinc-800 rounded-lg p-4 h-48">
                <div className="h-3 w-32 bg-zinc-700 rounded mb-3" />
                <div className="h-full w-full bg-zinc-700/30 rounded" />
              </div>
            </div>
            {/* Overlay CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-[1px] rounded-xl">
              <p className="text-sm font-medium text-zinc-200 mb-1">Unlock portfolio hiring intelligence</p>
              <Link
                href="/pricing"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Start free trial →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── Open Roles ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-zinc-100">
            Open Roles
            <span className="ml-2 text-sm font-normal text-zinc-500">{formatNumber(filteredJobs.length)}</span>
          </h2>
        </div>

        {/* Search */}
        {jobs.length > 5 && (
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter roles, companies..."
              className="w-full pl-10 pr-10 py-2 bg-zinc-900 text-zinc-100 placeholder-zinc-500 rounded-lg text-sm border border-zinc-800 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Role list */}
        {filteredJobs.length > 0 ? (
          <div className="divide-y divide-zinc-800/50">
            {filteredJobs.map((job) => {
              const companyDomain = getDomain(job.companyUrl);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-zinc-900/50 -mx-2 px-2 rounded transition-colors"
                >
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    {companyDomain ? (
                      <Favicon domain={companyDomain} size={32} className="w-6 h-6 rounded" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-zinc-800" />
                    )}
                  </div>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-100">{job.title}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                      <span>{job.company}</span>
                      {job.location && (
                        <>
                          <span>·</span>
                          <span>{job.location}</span>
                        </>
                      )}
                      {job.departmentName && (
                        <>
                          <span>·</span>
                          <span>{job.departmentName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <svg className="w-4 h-4 text-zinc-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm py-8 text-center">
            {search ? 'No roles match your search.' : 'No open roles at this time.'}
          </p>
        )}
      </section>
    </>
  );
}
