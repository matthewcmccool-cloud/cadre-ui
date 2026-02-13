'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useBookmarks } from '@/hooks/useBookmarks';
import { formatNumber } from '@/lib/format';
import Favicon from '@/components/Favicon';
import BookmarkButton from '@/components/BookmarkButton';

// ── Types ──

interface HydratedJob {
  id: string;
  title: string;
  company: string;
  companyUrl: string;
  location: string;
  functionName: string;
  datePosted: string;
  jobUrl: string;
  salary: string;
  isActive?: boolean;
}

interface HydratedCompany {
  id: string;
  name: string;
  slug: string;
  url?: string;
  stage?: string;
  industry?: string;
  investors: string[];
  jobCount: number;
  recentJobs: { id: string; title: string; location: string; function?: string; postedDate?: string }[];
}

interface HydratedInvestor {
  id: string;
  name: string;
  slug: string;
  url?: string;
  companyCount: number;
  jobCount: number;
}

interface ForMeData {
  counts: { job: number; company: number; investor: number };
  savedJobs: HydratedJob[];
  followedCompanies: HydratedCompany[];
  followedInvestors: HydratedInvestor[];
}

// ── Helpers ──

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
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

const FUNCTION_COLORS: Record<string, string> = {
  'Engineering': 'text-blue-400 bg-blue-400/10',
  'Product Management': 'text-purple-400 bg-purple-400/10',
  'Product Design / UX': 'text-pink-400 bg-pink-400/10',
  'Sales': 'text-orange-400 bg-orange-400/10',
  'Marketing': 'text-yellow-400 bg-yellow-400/10',
  'AI & Research': 'text-cyan-400 bg-cyan-400/10',
  'Customer Success': 'text-teal-400 bg-teal-400/10',
  'People': 'text-rose-400 bg-rose-400/10',
  'Finance & Accounting': 'text-emerald-400 bg-emerald-400/10',
  'Business Operations': 'text-amber-400 bg-amber-400/10',
  'BD & Partnerships': 'text-orange-300 bg-orange-300/10',
  'Legal': 'text-slate-400 bg-slate-400/10',
  'Solutions Engineering': 'text-indigo-400 bg-indigo-400/10',
  'Developer Relations': 'text-violet-400 bg-violet-400/10',
  'Revenue Operations': 'text-lime-400 bg-lime-400/10',
};

// ── Inline SVG Icons ──

function BookmarkFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-8 h-8'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

// ── Empty State ──

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
        Save jobs, follow companies, and track investors to build your
        personalized hiring intelligence hub.
      </p>
      <Link
        href="/discover"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium transition-colors"
      >
        Browse Discover
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}

// ── Expired Overlay ──

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

// ── Section: Empty Block ──

function SectionEmpty({ message, cta, href }: { message: string; cta: string; href: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
      <p className="text-sm text-zinc-500 mb-2">{message}</p>
      <Link href={href} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
        {cta} &rarr;
      </Link>
    </div>
  );
}

// ── Section Header ──

function SectionHeader({ title, count, seeAllHref }: { title: string; count?: number; seeAllHref?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {title}
        {count !== undefined && count > 0 && (
          <span className="ml-1.5 text-zinc-600">({count})</span>
        )}
      </h2>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          See all &rarr;
        </Link>
      )}
    </div>
  );
}

// ── Job Card (grid layout) ──

function JobCard({ job }: { job: HydratedJob }) {
  const domain = getDomain(job.companyUrl);
  const inactive = job.isActive === false;
  const fnStyle = job.functionName
    ? FUNCTION_COLORS[job.functionName] || 'text-zinc-500 bg-zinc-800'
    : '';

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 transition-colors group ${
      inactive ? 'opacity-50' : 'hover:bg-zinc-800/80'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/jobs/${job.id}`} className="flex items-center gap-2.5 min-w-0">
          {domain ? (
            <Favicon domain={domain} size={32} className="w-8 h-8 rounded flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 flex-shrink-0">
              {job.company.charAt(0)}
            </div>
          )}
          <span className="text-xs text-zinc-500 truncate">{job.company}</span>
        </Link>
        <BookmarkButton itemId={job.id} itemType="job" itemName={job.title} compact />
      </div>
      <Link href={`/jobs/${job.id}`} className="block mt-2">
        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">
          {job.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {job.location && (
            <span className="text-xs text-zinc-500 truncate max-w-[140px]">{job.location}</span>
          )}
          {job.functionName && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${fnStyle}`}>
              {job.functionName}
            </span>
          )}
          {job.datePosted && (
            <span className="text-[10px] text-zinc-600">{formatRelativeDate(job.datePosted)}</span>
          )}
        </div>
        {inactive && (
          <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
            No longer active
          </span>
        )}
      </Link>
    </div>
  );
}

// ── Company Card ──

function CompanyCard({ company }: { company: HydratedCompany }) {
  const domain = getDomain(company.url);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/80 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/companies/${company.slug}`} className="flex items-center gap-2.5 min-w-0">
          {domain ? (
            <Favicon domain={domain} size={40} className="w-10 h-10 rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500 flex-shrink-0">
              {company.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{company.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {company.stage && (
                <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 bg-zinc-800 rounded">{company.stage}</span>
              )}
              {company.industry && (
                <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 bg-zinc-800 rounded truncate max-w-[120px]">{company.industry}</span>
              )}
            </div>
          </div>
        </Link>
        <BookmarkButton itemId={company.id} itemType="company" itemName={company.name} compact />
      </div>
      <Link href={`/companies/${company.slug}`} className="block mt-3">
        <span className="text-xs text-zinc-400">{company.jobCount} open roles</span>
      </Link>
    </div>
  );
}

// ── Investor Card ──

function InvestorCard({ investor }: { investor: HydratedInvestor }) {
  const domain = getDomain(investor.url);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/80 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/investors/${investor.slug}`} className="flex items-center gap-2.5 min-w-0">
          {domain ? (
            <Favicon domain={domain} size={40} className="w-10 h-10 rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500 flex-shrink-0">
              {investor.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{investor.name}</p>
          </div>
        </Link>
        <BookmarkButton itemId={investor.id} itemType="investor" itemName={investor.name} compact />
      </div>
      <Link href={`/investors/${investor.slug}`} className="block mt-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-400">{investor.companyCount} portfolio companies</span>
          <span className="text-xs text-zinc-500">{formatNumber(investor.jobCount)} active roles</span>
        </div>
      </Link>
    </div>
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
  const { userStatus } = useUserStatus();
  const { counts: bookmarkCounts, isLoaded: bookmarksLoaded } = useBookmarks();
  const [data, setData] = useState<ForMeData | null>(null);
  const [loading, setLoading] = useState(true);

  const isExpired = userStatus === 'expired';
  const totalBookmarks = bookmarkCounts.job + bookmarkCounts.company + bookmarkCounts.investor;

  // Update last visited timestamp for nav badge
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cadre_last_visited_for_me', new Date().toISOString());
    }
  }, []);

  // Fetch data when signed in
  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/for-me')
      .then((res) => res.json())
      .then((d) => {
        setData({
          counts: d.counts || { job: 0, company: 0, investor: 0 },
          savedJobs: d.savedJobs || [],
          followedCompanies: d.followedCompanies || d.companies || [],
          followedInvestors: d.followedInvestors || [],
        });
      })
      .catch((err) => console.error('Failed to fetch For Me data:', err))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  // Sort saved jobs: active first, inactive last (already ordered by most recently saved from API)
  const sortedJobs = useMemo(() => {
    if (!data) return [];
    const active = data.savedJobs.filter((j) => j.isActive !== false);
    const inactive = data.savedJobs.filter((j) => j.isActive === false);
    return [...active, ...inactive].slice(0, 6);
  }, [data]);

  // Sort companies by most recent hiring activity
  const sortedCompanies = useMemo(() => {
    if (!data) return [];
    return [...data.followedCompanies]
      .sort((a, b) => {
        const aLatest = a.recentJobs.reduce((max, j) => {
          if (!j.postedDate) return max;
          return Math.max(max, new Date(j.postedDate).getTime());
        }, 0);
        const bLatest = b.recentJobs.reduce((max, j) => {
          if (!j.postedDate) return max;
          return Math.max(max, new Date(j.postedDate).getTime());
        }, 0);
        return bLatest - aLatest;
      })
      .slice(0, 6);
  }, [data]);

  // Sort investors by portfolio size (largest first)
  const sortedInvestors = useMemo(() => {
    if (!data) return [];
    return [...data.followedInvestors]
      .sort((a, b) => b.companyCount - a.companyCount)
      .slice(0, 6);
  }, [data]);

  // Determine empty state
  const showEmptyState = bookmarksLoaded && totalBookmarks === 0 && !data?.followedCompanies?.length;

  // ── Not signed in or empty ──
  if (!isSignedIn || (!loading && showEmptyState)) {
    return (
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <EmptyState />
        </div>
      </main>
    );
  }

  // ── Loading ──
  if (loading || !bookmarksLoaded) {
    return (
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="h-8 bg-zinc-800 rounded animate-pulse w-48 mb-2" />
          <div className="h-4 bg-zinc-800/50 rounded animate-pulse w-64 mb-8" />
          {[1, 2, 3].map((section) => (
            <div key={section} className="mb-10">
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-48 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-zinc-800 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const counts = data?.counts || bookmarkCounts;

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Page Header + Stat Bar ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100 mb-1">For Me</h1>
          <p className="text-sm text-zinc-500">
            {counts.job > 0 && (
              <>{counts.job} saved {counts.job === 1 ? 'job' : 'jobs'}</>
            )}
            {counts.job > 0 && counts.company > 0 && <> &middot; </>}
            {counts.company > 0 && (
              <>{counts.company} {counts.company === 1 ? 'company' : 'companies'}</>
            )}
            {(counts.job > 0 || counts.company > 0) && counts.investor > 0 && <> &middot; </>}
            {counts.investor > 0 && (
              <>{counts.investor} {counts.investor === 1 ? 'investor' : 'investors'}</>
            )}
            {counts.job === 0 && counts.company === 0 && counts.investor === 0 && (
              <>No saved items yet</>
            )}
          </p>
        </div>

        {/* Content wrapper — relative for expired overlay */}
        <div className="relative">
          {isExpired && <ExpiredOverlay />}

          <div className={isExpired ? 'blur-sm pointer-events-none select-none' : ''}>

            {/* ── Saved Jobs ── */}
            <section className="mb-10">
              <SectionHeader
                title="Saved Jobs"
                count={counts.job}
                seeAllHref="/discover"
              />
              {sortedJobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <SectionEmpty
                  message="Save jobs you're interested in from Discover."
                  cta="Browse jobs"
                  href="/discover"
                />
              )}
            </section>

            {/* ── Followed Companies ── */}
            <section className="mb-10">
              <SectionHeader
                title="Followed Companies"
                count={counts.company}
                seeAllHref="/discover?view=companies"
              />
              {sortedCompanies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedCompanies.map((company) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </div>
              ) : (
                <SectionEmpty
                  message="Follow companies to track their hiring activity."
                  cta="Browse companies"
                  href="/discover?view=companies"
                />
              )}
            </section>

            {/* ── Followed Investors ── */}
            <section className="mb-10">
              <SectionHeader
                title="Followed Investors"
                count={counts.investor}
                seeAllHref="/discover?view=investors"
              />
              {sortedInvestors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedInvestors.map((investor) => (
                    <InvestorCard key={investor.id} investor={investor} />
                  ))}
                </div>
              ) : (
                <SectionEmpty
                  message="Follow investors to monitor hiring across their portfolios."
                  cta="Browse investors"
                  href="/discover?view=investors"
                />
              )}
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
