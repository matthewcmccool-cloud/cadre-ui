'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import LiveTicker from '@/components/LiveTicker';
import ManageFollowsPanel from '@/components/ManageFollowsPanel';
import { FeedCardSkeleton } from '@/components/Skeletons';
import Favicon from '@/components/Favicon';
import type { FeedDataResult as FeedData, FeedCompanyItem as FeedCompany } from '@/lib/data';

const PAGE_SIZE = 20;

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

interface StatsProps {
  companyCount: number;
  investorCount: number;
  jobCount: number;
}

// ── Signal Card (dismissable) ──
function SignalCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-400 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-2">
        This week&apos;s signal
      </p>
      <p className="text-sm text-zinc-300 leading-relaxed pr-6">
        Engineering hiring across VC-backed companies is up 18% this month.
        AI companies posted 23% more roles after recent fundraises. Series B
        companies are adding headcount fastest — particularly in engineering and product.
      </p>
      <p className="mt-3 text-xs text-zinc-500">
        <Link href="/fundraises" className="text-purple-400 hover:text-purple-300 transition-colors">
          See recent fundraises →
        </Link>
      </p>
    </div>
  );
}

// ── Company Feed Card ──
function CompanyFeedCard({ company, isPro }: { company: FeedCompany; isPro: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const domain = getDomain(company.url);
  const recentJobs = company.recentJobs || [];
  const firstJob = recentJobs[0];
  const moreCount = recentJobs.length > 1 ? recentJobs.length - 1 : 0;
  const latestDate = firstJob?.postedDate ? formatRelativeDate(firstJob.postedDate) : '';

  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 hover:border-zinc-700 transition-colors">
      {/* Header: logo + company + timestamp */}
      <div className="flex items-start gap-3">
        {domain ? (
          <Favicon domain={domain} size={32} className="w-8 h-8 rounded flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 flex-shrink-0 mt-0.5">
            {company.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Link
              href={`/companies/${company.slug}`}
              className="text-sm font-medium text-zinc-100 hover:text-white transition-colors truncate"
            >
              {company.name}
            </Link>
            {latestDate && (
              <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">{latestDate}</span>
            )}
          </div>

          {/* First job */}
          {firstJob ? (
            <div className="mt-1">
              <p className="text-sm text-zinc-400">
                Posted:{' '}
                <Link
                  href={`/jobs/${firstJob.id}`}
                  className="text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  {firstJob.title}
                </Link>
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {firstJob.location}
                {firstJob.function && ` · ${firstJob.function}`}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">
              {company.jobCount} open role{company.jobCount !== 1 ? 's' : ''}
            </p>
          )}

          {/* Collapsed more */}
          {moreCount > 0 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              and {moreCount} more →
            </button>
          )}

          {/* Expanded jobs */}
          {expanded && recentJobs.slice(1).map((job) => (
            <div key={job.id} className="mt-2 border-t border-zinc-800/50 pt-2">
              <p className="text-sm text-zinc-400">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  {job.title}
                </Link>
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {job.location}
                {job.function && ` · ${job.function}`}
              </p>
            </div>
          ))}
          {expanded && moreCount > 0 && (
            <button
              onClick={() => setExpanded(false)}
              className="mt-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              collapse
            </button>
          )}

          {/* Investor context (Pro only) */}
          {isPro && company.investors.length > 0 && (
            <p className="mt-1.5 text-xs text-zinc-500">
              Backed by{' '}
              {company.investors.slice(0, 3).map((inv, i) => (
                <span key={inv}>
                  {i > 0 && ', '}
                  <span className="text-purple-400">{inv}</span>
                </span>
              ))}
              {company.investors.length > 3 && ` +${company.investors.length - 3} more`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pro Teaser Card ──
function ProTeaserCard({ followCount }: { followCount: number }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-800">
      <p className="text-sm text-zinc-300">
        🔒 {Math.max(2, Math.floor(followCount * 0.3))} of your companies are surging in hiring
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        See hiring signals →{' '}
        <Link href="/pricing" className="text-purple-400 hover:text-purple-300 transition-colors">
          Start free trial
        </Link>
      </p>
    </div>
  );
}

// ── Right Sidebar ──
function Sidebar({ data }: { data: FeedData }) {
  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Quick Stats</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Following</span>
            <span className="text-sm font-semibold text-zinc-100">{data.totalFollowed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Open roles</span>
            <span className="text-sm font-semibold text-zinc-100">{data.totalRoles.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">New this week</span>
            <span className="text-sm font-semibold text-zinc-100">{data.newThisWeek}</span>
          </div>
        </div>
      </div>

      {/* Top Functions */}
      {data.topFunctions.length > 0 && (
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Top Functions</h3>
          <div className="space-y-2.5">
            {data.topFunctions.map((fn) => (
              <div key={fn.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-300">{fn.name}</span>
                  <span className="text-xs text-zinc-500">{fn.pct}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500/60 rounded-full"
                    style={{ width: `${fn.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Funded */}
      {data.companies.filter((c) => c.stage && /series|seed/i.test(c.stage)).length > 0 && (
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Recently Funded</h3>
          <div className="space-y-2">
            {data.companies
              .filter((c) => c.stage && /series|seed/i.test(c.stage))
              .slice(0, 5)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/companies/${c.slug}`}
                  className="flex items-center justify-between text-xs hover:bg-zinc-800/50 rounded p-1 -mx-1 transition-colors"
                >
                  <span className="text-zinc-300 truncate">{c.name}</span>
                  <span className="text-emerald-400/70 flex-shrink-0 ml-2">{c.stage}</span>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Feed Component ──
export default function FeedPageContent({ stats }: { stats: StatsProps }) {
  const { isPro } = useSubscription();
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signalVisible, setSignalVisible] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [managePanelOpen, setManagePanelOpen] = useState(false);

  // Ticker entries
  const tickerEntries = useMemo(() => [
    { text: `${stats.companyCount.toLocaleString()} companies tracked` },
    { text: `${stats.investorCount} investor portfolios` },
    { text: `${stats.jobCount.toLocaleString()}+ open roles` },
    { text: 'Updated daily from Greenhouse, Lever & Ashby' },
  ], [stats]);

  // Fetch feed data
  useEffect(() => {
    setLoading(true);
    fetch('/api/feed')
      .then((res) => res.json())
      .then((d: FeedData) => setData(d))
      .catch((err) => console.error('Failed to fetch feed:', err))
      .finally(() => setLoading(false));
  }, []);

  // Build feed items with pro teaser cards interspersed
  const feedItems = useMemo(() => {
    if (!data) return [];
    const items: { type: 'company' | 'teaser'; company?: FeedCompany }[] = [];
    const visible = data.companies.slice(0, visibleCount);
    for (let i = 0; i < visible.length; i++) {
      items.push({ type: 'company', company: visible[i] });
      if (!isPro && (i + 1) % 10 === 0 && i < visible.length - 1) {
        items.push({ type: 'teaser' });
      }
    }
    return items;
  }, [data, visibleCount, isPro]);

  const hasMore = data ? visibleCount < data.companies.length : false;

  const handleDismissSignal = useCallback(() => {
    setSignalVisible(false);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Live Ticker */}
      <LiveTicker entries={tickerEntries} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Signal card */}
        {signalVisible && (
          <div className="max-w-2xl mb-6">
            <SignalCard onDismiss={handleDismissSignal} />
          </div>
        )}

        {/* Summary bar */}
        {data && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-zinc-400">
                Following{' '}
                <span className="font-semibold text-zinc-100">{data.totalFollowed}</span>{' '}
                companies · {' '}
                <span className="font-semibold text-zinc-100">{data.totalRoles.toLocaleString()}</span>{' '}
                open roles · {' '}
                <span className="font-semibold text-zinc-100">{data.newThisWeek}</span>{' '}
                new this week
              </p>
              <Link
                href="/intelligence/compare"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                Compare
                {!isPro && <span className="text-[10px] text-purple-400 ml-1">PRO</span>}
              </Link>
            </div>
            <button
              onClick={() => setManagePanelOpen(true)}
              className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors hidden sm:block"
            >
              Manage
            </button>
          </div>
        )}

        {/* Main content + sidebar */}
        <div className="flex gap-6">
          {/* Feed */}
          <div className="flex-1 max-w-2xl">
            {loading ? (
              <FeedCardSkeleton count={4} />
            ) : data && data.companies.length === 0 ? (
              <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 text-center">
                <p className="text-sm text-zinc-400">You&apos;re not following any companies yet.</p>
                <Link
                  href="/discover"
                  className="mt-3 inline-block rounded-md bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  Discover companies →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {feedItems.map((item, idx) =>
                  item.type === 'teaser' ? (
                    <ProTeaserCard key={`teaser-${idx}`} followCount={data?.totalFollowed || 0} />
                  ) : (
                    <CompanyFeedCard
                      key={item.company!.id}
                      company={item.company!}
                      isPro={isPro}
                    />
                  )
                )}

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setVisibleCount((p) => p + PAGE_SIZE)}
                      className="px-6 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar (desktop only) */}
          {data && data.companies.length > 0 && (
            <div className="hidden lg:block w-72 flex-shrink-0">
              <Sidebar data={data} />
            </div>
          )}
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
