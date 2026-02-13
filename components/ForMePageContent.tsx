'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useFollows } from '@/hooks/useFollows';
import { formatNumber } from '@/lib/format';
import ManageFollowsPanel from '@/components/ManageFollowsPanel';
import { CompanyChipSkeleton } from '@/components/Skeletons';
import Favicon from '@/components/Favicon';
import FollowButton from '@/components/FollowButton';
import type { FollowedDataResult as FollowedData, FollowedCompanyItem as FollowedCompany } from '@/lib/data';

const getDomain = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

function formatRelativeDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// ── Inline SVG Icons ──

function BookmarkFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

// ── State 1: Empty State (no trial, no follows) ──

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
        <BookmarkFilledIcon className="w-8 h-8 text-purple-400" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-100 mb-2">
        Your personalized dashboard
      </h2>
      <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
        Follow companies and investors to track their open roles,
        hiring activity, and portfolio moves — all in one place.
      </p>
      <Link
        href="/discover"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium transition-colors"
      >
        Start exploring
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}

// ── State 3: Expired Overlay ──

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-8 h-8'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function ExpiredOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-zinc-900/60 rounded-xl">
      <div className="text-center px-6">
        <div className="flex justify-center mb-4">
          <LockIcon className="w-8 h-8 text-zinc-500" />
        </div>
        <p className="text-lg font-semibold text-zinc-100 mb-2">
          Your trial has ended
        </p>
        <p className="text-sm text-zinc-400 mb-6 max-w-sm">
          Reactivate Pro to continue tracking your followed companies, investors, and saved jobs.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium transition-colors"
        >
          Reactivate Pro &mdash; $15/month
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}

// ── Company Pill (matching Discover style) ──

function CompanyPill({ company }: { company: FollowedCompany }) {
  const domain = getDomain(company.url);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1b] hover:bg-[#252526] rounded-lg text-sm text-[#e8e8e8] transition-colors group">
      <Link href={`/companies/${company.slug}`} className="inline-flex items-center gap-2">
        {domain ? (
          <Favicon domain={domain} size={32} className="w-4 h-4 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-4 h-4 rounded-sm bg-[#252526] flex items-center justify-center text-[8px] font-bold text-[#555]">
            {company.name.charAt(0)}
          </div>
        )}
        <span className="whitespace-nowrap">{company.name}</span>
        {company.jobCount > 0 && (
          <span className="text-[10px] text-[#555] font-medium">
            {company.jobCount} {company.jobCount === 1 ? 'job' : 'jobs'}
          </span>
        )}
      </Link>
      <FollowButton companyId={company.id} companyName={company.name} compact />
    </div>
  );
}

// ── Investor Pill ──

interface InvestorInfo {
  name: string;
  companyCount: number;
}

function InvestorPill({ investor }: { investor: InvestorInfo }) {
  const slug = investor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return (
    <Link
      href={`/investors/${slug}`}
      className="inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1b] hover:bg-[#252526] rounded-lg text-sm text-[#e8e8e8] transition-colors group"
    >
      <div className="w-4 h-4 rounded-sm bg-[#252526] flex items-center justify-center text-[8px] font-bold text-[#555]">
        {investor.name.charAt(0)}
      </div>
      <span className="whitespace-nowrap">{investor.name}</span>
      {investor.companyCount > 0 && (
        <span className="text-[10px] text-[#555] font-medium">
          {investor.companyCount} {investor.companyCount === 1 ? 'co' : 'cos'}
        </span>
      )}
    </Link>
  );
}

// ── Saved Job Row ──

function SavedJobRow({ job, companyName }: { job: FollowedCompany['recentJobs'][0]; companyName: string }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
    >
      <BriefcaseIcon className="w-4 h-4 text-zinc-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">
          {job.title}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {companyName}
          {job.location && ` \u00B7 ${job.location}`}
          {job.function && ` \u00B7 ${job.function}`}
        </p>
      </div>
      {job.postedDate && (
        <span className="text-xs text-zinc-600 flex-shrink-0">{formatRelativeDate(job.postedDate)}</span>
      )}
    </Link>
  );
}

// ── Main Component ──

interface ForMePageContentProps {
  stats: {
    companyCount: number;
    investorCount: number;
    jobCount: number;
  };
}

export default function ForMePageContent({ stats }: ForMePageContentProps) {
  const { isSignedIn } = useAuth();
  const { userStatus, isProAccess } = useUserStatus();
  const { followCount, isLoaded: followsLoaded } = useFollows();
  const [data, setData] = useState<FollowedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [managePanelOpen, setManagePanelOpen] = useState(false);

  const isExpired = userStatus === 'expired';
  const showEmptyState = followsLoaded && followCount === 0 && !isProAccess;

  // Fetch followed company data when signed in
  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/for-me')
      .then((res) => res.json())
      .then((d: FollowedData) => setData(d))
      .catch((err) => console.error('Failed to fetch followed data:', err))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  // Derive investors from followed data
  const investorList = useMemo((): InvestorInfo[] => {
    if (!data) return [];
    const map = new Map<string, number>();
    for (const company of data.companies) {
      for (const inv of company.investors) {
        map.set(inv, (map.get(inv) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, companyCount]) => ({ name, companyCount }));
  }, [data]);

  // Collect recent jobs across all followed companies
  const recentJobs = useMemo(() => {
    if (!data) return [];
    const jobs: { job: FollowedCompany['recentJobs'][0]; companyName: string }[] = [];
    for (const company of data.companies) {
      for (const job of company.recentJobs) {
        jobs.push({ job, companyName: company.name });
      }
    }
    return jobs
      .sort((a, b) => {
        const da = a.job.postedDate ? new Date(a.job.postedDate).getTime() : 0;
        const db = b.job.postedDate ? new Date(b.job.postedDate).getTime() : 0;
        return db - da;
      })
      .slice(0, 20);
  }, [data]);

  // Total open roles
  const totalRoles = data?.totalRoles || 0;

  // ── State 1: Not signed in or no follows (empty state) ──
  if (!isSignedIn || showEmptyState) {
    return (
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <EmptyState />
        </div>
      </main>
    );
  }

  // ── Loading state ──
  if (loading || !followsLoaded) {
    return (
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="h-5 bg-zinc-800 rounded animate-pulse w-64 mb-4" />
          </div>
          <div className="mb-8">
            <div className="h-4 bg-zinc-800 rounded animate-pulse w-40 mb-3" />
            <CompanyChipSkeleton count={8} />
          </div>
          <div className="mb-8">
            <div className="h-4 bg-zinc-800 rounded animate-pulse w-40 mb-3" />
            <CompanyChipSkeleton count={4} />
          </div>
        </div>
      </main>
    );
  }

  // ── State 2 & 3: Dashboard (active or expired) ──
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Summary Stats Bar */}
        <div className="flex items-center justify-between px-4 py-3 mb-6 bg-zinc-800/50 border-b border-zinc-700 rounded-lg">
          <p className="text-sm text-zinc-400">
            Following{' '}
            <span className="font-semibold text-zinc-100">{data?.totalFollowed || followCount}</span>{' '}
            companies
            {investorList.length > 0 && (
              <>
                {' '}&middot;{' '}
                <span className="font-semibold text-zinc-100">{investorList.length}</span>{' '}
                investors
              </>
            )}
            {' '}&middot;{' '}
            <span className="font-semibold text-zinc-100">{formatNumber(totalRoles)}</span>{' '}
            open roles
          </p>
          <button
            onClick={() => setManagePanelOpen(true)}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors hidden sm:block"
          >
            Manage
          </button>
        </div>

        {/* Content wrapper — relative for expired overlay */}
        <div className="relative">
          {isExpired && <ExpiredOverlay />}

          <div className={isExpired ? 'blur-sm pointer-events-none select-none' : ''}>
            {/* ── Section 1: Followed Companies ── */}
            {data && data.companies.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Followed Companies
                  </h2>
                  <Link
                    href="/discover"
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Discover more &rarr;
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[...data.companies]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((company) => (
                      <CompanyPill key={company.id} company={company} />
                    ))}
                </div>
              </section>
            )}

            {/* ── Section 2: Followed Investors ── */}
            {investorList.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Followed Investors
                  </h2>
                  <Link
                    href="/investors"
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Discover more &rarr;
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {investorList.map((investor) => (
                    <InvestorPill key={investor.name} investor={investor} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Section 3: Recent Jobs from Followed Companies ── */}
            {recentJobs.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Recent Jobs
                  </h2>
                  <Link
                    href="/jobs"
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    View all jobs &rarr;
                  </Link>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800/50">
                  {recentJobs.map(({ job, companyName }) => (
                    <SavedJobRow key={job.id} job={job} companyName={companyName} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Section 4: Activity (placeholder) ── */}
            <section className="mb-8">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Activity
              </h2>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  Hiring activity and signals coming soon.
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  We&apos;re building intelligence features to surface trends across your followed companies.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Manage Follows Panel */}
      <ManageFollowsPanel
        isOpen={managePanelOpen}
        onClose={() => setManagePanelOpen(false)}
      />
    </main>
  );
}
