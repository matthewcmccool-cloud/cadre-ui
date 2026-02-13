'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStatus } from '@/hooks/useUserStatus';
import { useBookmarks } from '@/hooks/useBookmarks';
import { formatNumber } from '@/lib/format';
import Favicon from '@/components/Favicon';
import BookmarkButton from '@/components/BookmarkButton';
import ManageFollowsPanel from '@/components/ManageFollowsPanel';

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
  newFromCompanies: HydratedJob[];
  savedJobs: HydratedJob[];
  followedCompanies: HydratedCompany[];
  followedInvestors: HydratedInvestor[];
  totalRoles: number;
  newThisWeek: number;
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

// ── Job Card (compact for For Me page) ──

function JobCard({ job }: { job: HydratedJob }) {
  const domain = getDomain(job.companyUrl);
  return (
    <div className="flex-shrink-0 w-64 sm:w-72 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:bg-zinc-800/80 transition-colors group">
      <Link href={`/jobs/${job.id}`} className="block">
        <div className="flex items-center gap-2 mb-2">
          {domain ? (
            <Favicon domain={domain} size={32} className="w-8 h-8 rounded" />
          ) : (
            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
              {job.company.charAt(0)}
            </div>
          )}
          <span className="text-xs text-zinc-500 truncate">{job.company}</span>
        </div>
        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">
          {job.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {job.location && (
            <span className="text-xs text-zinc-500 truncate">{job.location}</span>
          )}
          {job.functionName && (
            <>
              {job.location && <span className="text-zinc-700">&middot;</span>}
              <span className="text-xs text-zinc-500">{job.functionName}</span>
            </>
          )}
        </div>
        {job.datePosted && (
          <span className="text-[10px] text-zinc-600 mt-1 block">{formatRelativeDate(job.datePosted)}</span>
        )}
      </Link>
      <div className="mt-2 flex justify-end">
        <BookmarkButton itemId={job.id} itemType="job" itemName={job.title} compact />
      </div>
    </div>
  );
}

// ── Company Card ──

function CompanyCard({ company }: { company: HydratedCompany }) {
  const domain = getDomain(company.url);
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = company.recentJobs.filter(
    (j) => j.postedDate && new Date(j.postedDate).getTime() >= oneWeekAgo
  ).length;

  return (
    <div className="flex-shrink-0 w-64 sm:w-72 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:bg-zinc-800/80 transition-colors group">
      <Link href={`/companies/${company.slug}`} className="block">
        <div className="flex items-center gap-2 mb-2">
          {domain ? (
            <Favicon domain={domain} size={40} className="w-10 h-10 rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500">
              {company.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{company.name}</p>
            <div className="flex items-center gap-1.5">
              {company.stage && (
                <span className="text-[10px] text-zinc-500">{company.stage}</span>
              )}
              {company.stage && company.industry && (
                <span className="text-zinc-700">&middot;</span>
              )}
              {company.industry && (
                <span className="text-[10px] text-zinc-500 truncate">{company.industry}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-400">{company.jobCount} open roles</span>
          {newThisWeek > 0 && (
            <span className="text-xs text-green-400">{newThisWeek} new this week</span>
          )}
        </div>
      </Link>
      <div className="mt-2 flex justify-end">
        <BookmarkButton itemId={company.id} itemType="company" itemName={company.name} compact />
      </div>
    </div>
  );
}

// ── Investor Card ──

function InvestorCard({ investor }: { investor: HydratedInvestor }) {
  const domain = getDomain(investor.url);
  return (
    <div className="flex-shrink-0 w-64 sm:w-72 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:bg-zinc-800/80 transition-colors group">
      <Link href={`/investors/${investor.slug}`} className="block">
        <div className="flex items-center gap-2 mb-2">
          {domain ? (
            <Favicon domain={domain} size={40} className="w-10 h-10 rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500">
              {investor.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{investor.name}</p>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 mt-1">
          <span className="text-xs text-zinc-400">{investor.companyCount} portfolio companies</span>
          <span className="text-xs text-zinc-500">{formatNumber(investor.jobCount)} open roles</span>
        </div>
      </Link>
      <div className="mt-2 flex justify-end">
        <BookmarkButton itemId={investor.id} itemType="investor" itemName={investor.name} compact />
      </div>
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

// ── Card Scroll Row ──

function CardScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
      {children}
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
  const [managePanelOpen, setManagePanelOpen] = useState(false);

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
          newFromCompanies: d.newFromCompanies || [],
          savedJobs: d.savedJobs || [],
          followedCompanies: d.followedCompanies || d.companies || [],
          followedInvestors: d.followedInvestors || [],
          totalRoles: d.totalRoles || 0,
          newThisWeek: d.newThisWeek || 0,
        });
      })
      .catch((err) => console.error('Failed to fetch For Me data:', err))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

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
          <div className="mb-8">
            <div className="h-4 bg-zinc-800 rounded animate-pulse w-48 mb-3" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-72 h-32 bg-zinc-800 rounded-lg animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
          <div className="mb-8">
            <div className="h-4 bg-zinc-800 rounded animate-pulse w-40 mb-3" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-72 h-32 bg-zinc-800 rounded-lg animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
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

            {/* ── Section 1: New From Your Companies ── */}
            <section className="mb-10">
              <SectionHeader
                title="New From Your Companies"
                seeAllHref="/discover"
              />
              {data && data.newFromCompanies.length > 0 ? (
                <>
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      {data.newFromCompanies.length} new
                    </span>
                  </div>
                  <CardScrollRow>
                    {data.newFromCompanies.slice(0, 6).map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </CardScrollRow>
                </>
              ) : (
                <SectionEmpty
                  message="Follow companies to see their latest roles here."
                  cta="Browse Discover"
                  href="/discover"
                />
              )}
            </section>

            {/* ── Section 2: Saved Jobs ── */}
            <section className="mb-10">
              <SectionHeader
                title="Saved Jobs"
                count={counts.job}
                seeAllHref="/discover"
              />
              {data && data.savedJobs.length > 0 ? (
                <CardScrollRow>
                  {data.savedJobs.slice(0, 6).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </CardScrollRow>
              ) : (
                <SectionEmpty
                  message="Save jobs you're interested in from Discover."
                  cta="Browse jobs"
                  href="/discover"
                />
              )}
            </section>

            {/* ── Section 3: Followed Companies ── */}
            <section className="mb-10">
              <SectionHeader
                title="Followed Companies"
                count={counts.company}
                seeAllHref="/discover?view=companies"
              />
              {data && data.followedCompanies.length > 0 ? (
                <CardScrollRow>
                  {data.followedCompanies.slice(0, 6).map((company) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </CardScrollRow>
              ) : (
                <SectionEmpty
                  message="Follow companies to track their hiring activity."
                  cta="Browse companies"
                  href="/discover?view=companies"
                />
              )}
            </section>

            {/* ── Section 4: Followed Investors ── */}
            <section className="mb-10">
              <SectionHeader
                title="Followed Investors"
                count={counts.investor}
                seeAllHref="/discover?view=investors"
              />
              {data && data.followedInvestors.length > 0 ? (
                <CardScrollRow>
                  {data.followedInvestors.slice(0, 6).map((investor) => (
                    <InvestorCard key={investor.id} investor={investor} />
                  ))}
                </CardScrollRow>
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

      {/* Manage Follows Panel */}
      <ManageFollowsPanel
        isOpen={managePanelOpen}
        onClose={() => setManagePanelOpen(false)}
      />
    </main>
  );
}
