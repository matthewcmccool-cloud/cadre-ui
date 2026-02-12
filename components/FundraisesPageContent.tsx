'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toSlug } from '@/lib/data';
import type { FundraiseItem } from '@/lib/data';
import { formatAmount, formatNumber } from '@/lib/format';
import FollowButton from '@/components/FollowButton';
import Favicon from '@/components/Favicon';

type TimeFilter = 'all' | 'week' | 'month';

interface FundraisesPageContentProps {
  fundraises: FundraiseItem[];
  industries: string[];
}

const getDomain = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

const PAGE_SIZE = 20;

export default function FundraisesPageContent({ fundraises, industries }: FundraisesPageContentProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [industryFilter, setIndustryFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filter by industry
  const filtered = fundraises.filter((f) => {
    if (industryFilter && f.industry !== industryFilter) return false;
    return true;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const timeLabel = timeFilter === 'week' ? 'this week' : timeFilter === 'month' ? 'this month' : '';

  return (
    <>
      {/* Header */}
      <div className="mt-6 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Fundraises</h1>
        <p className="mt-1 text-sm text-zinc-400">
          The latest funding rounds across the venture ecosystem
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Time filter pills */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg">
          {([
            { key: 'all', label: 'All' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTimeFilter(key); setVisibleCount(PAGE_SIZE); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeFilter === key
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Industry filter */}
        <select
          value={industryFilter}
          onChange={(e) => { setIndustryFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50"
        >
          <option value="">Industry</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>

        {/* Count */}
        <span className="text-sm text-zinc-500 ml-auto">
          {formatNumber(filtered.length)} fundraise{filtered.length !== 1 ? 's' : ''}{timeLabel ? ` ${timeLabel}` : ''}
        </span>
      </div>

      {/* Fundraise cards */}
      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((f) => {
            const domain = getDomain(f.companyUrl);
            const amount = formatAmount(f.totalRaised);
            const leadInvestor = f.leadInvestors[0];
            const othersCount = f.coInvestors.length;

            return (
              <div
                key={f.companyId}
                className="bg-zinc-900 rounded-lg p-5 border border-zinc-800 hover:border-zinc-700 border-l-2 border-l-emerald-500/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Left content */}
                  <div className="flex-1 min-w-0">
                    {/* Company header: logo + name + industry chip */}
                    <div className="flex items-center gap-2.5">
                      {domain ? (
                        <Favicon domain={domain} size={32} className="w-8 h-8 rounded flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 flex-shrink-0">
                          {f.companyName.charAt(0)}
                        </div>
                      )}
                      <Link href={`/companies/${f.companySlug}`} className="text-sm font-medium text-zinc-100 hover:text-white transition-colors truncate">
                        {f.companyName}
                      </Link>
                      {f.industry && (
                        <Link
                          href={`/industry/${toSlug(f.industry)}`}
                          className="bg-zinc-800 rounded-full px-2.5 py-0.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
                        >
                          {f.industry}
                        </Link>
                      )}
                    </div>

                    {/* Data point 1: Amount + Stage */}
                    <div className="mt-2.5 sm:ml-[42px]">
                      {amount ? (
                        <span className="text-xl font-semibold text-zinc-100">{amount}</span>
                      ) : null}
                      {f.stage && (
                        <span className="text-sm text-zinc-400">
                          {amount ? ' \u00B7 ' : ''}{f.stage}
                        </span>
                      )}
                    </div>

                    {/* Data point 2: Lead investor */}
                    {leadInvestor && (
                      <p className="mt-1.5 text-sm text-zinc-400 sm:ml-[42px]">
                        Led by{' '}
                        <Link
                          href={`/investors/${toSlug(leadInvestor)}`}
                          className="text-zinc-300 hover:text-zinc-100 transition-colors"
                        >
                          {leadInvestor}
                        </Link>
                        {othersCount > 0 && (
                          <span> &middot; with {othersCount} other{othersCount !== 1 ? 's' : ''}</span>
                        )}
                      </p>
                    )}

                    {/* Data point 3: Hiring signal */}
                    <div className="mt-1.5 sm:ml-[42px]">
                      <Link
                        href={`/companies/${f.companySlug}`}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {f.jobCount > 0
                          ? `Now hiring ${formatNumber(f.jobCount)} role${f.jobCount !== 1 ? 's' : ''} \u2192`
                          : 'View company \u2192'}
                      </Link>
                    </div>
                  </div>

                  {/* Right: Follow button */}
                  <div className="flex-shrink-0">
                    <FollowButton companyId={f.companyId} companyName={f.companyName} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-sm">
            No fundraises detected{timeLabel ? ` ${timeLabel}` : ''}. Check back soon, or{' '}
            <button
              onClick={() => { setTimeFilter('all'); setIndustryFilter(''); }}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              browse all fundraises
            </button>
            .
          </p>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="px-6 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
