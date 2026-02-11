'use client';

import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';

interface HiringActivityProps {
  totalRoles: number;
  newThisWeek: number;
  dailyData?: number[];
}

function Sparkline({ data }: { data: number[] }) {
  const width = 120;
  const height = 24;
  const padding = 2;

  if (data.length < 2) {
    // Flat line placeholder
    return (
      <svg width={width} height={height} className="shrink-0" role="img" aria-label="Hiring activity — historical data available soon">
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="rgb(168 85 247 / 0.4)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <title>Historical data available soon</title>
      </svg>
    );
  }

  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (v / max) * (height - padding * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const fillPoints = `${padding},${height - padding} ${polyline} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="shrink-0" role="img" aria-label="30-day hiring activity sparkline">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(168 85 247 / 0.2)" />
          <stop offset="100%" stopColor="rgb(168 85 247 / 0)" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#sparkFill)" />
      <polyline points={polyline} fill="none" stroke="rgb(168 85 247)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function HiringActivity({ totalRoles, newThisWeek, dailyData = [] }: HiringActivityProps) {
  const { isPro } = useSubscription();

  return (
    <section className="mt-8">
      <h2 className="text-lg font-medium text-zinc-100 mb-4">Hiring Activity</h2>

      {/* Stats + sparkline */}
      <div className="flex items-center gap-6">
        <div>
          <span className="text-2xl font-semibold tabular-nums text-zinc-100">{totalRoles}</span>
          <span className="ml-1.5 text-xs text-zinc-500">open roles</span>
        </div>
        <div>
          <span className="text-2xl font-semibold tabular-nums text-zinc-100">{newThisWeek}</span>
          <span className="ml-1.5 text-xs text-zinc-500">new this week</span>
        </div>
        <Sparkline data={dailyData} />
      </div>

      {/* Pro: full 90-day chart area, function breakdown, MoM comparison */}
      {isPro ? (
        <div className="mt-6 space-y-4">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">90-Day Hiring Trend</h3>
            <p className="text-xs text-zinc-500">Full hiring chart coming soon.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Function Breakdown</h3>
              <p className="text-xs text-zinc-500">Breakdown coming soon.</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Month-over-Month</h3>
              <p className="text-xs text-zinc-500">MoM comparison coming soon.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 relative">
          <div className="bg-zinc-900 rounded-lg h-48 flex items-center justify-center overflow-hidden">
            {/* Blurred placeholder bars */}
            <div className="absolute inset-0 flex items-end justify-center gap-1 px-8 pb-8 blur-sm opacity-30">
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-purple-500 rounded-t"
                  style={{ height: `${20 + Math.random() * 60}%` }}
                />
              ))}
            </div>
            <div className="relative z-10 text-center">
              <p className="text-sm text-zinc-400">
                See full hiring history →{' '}
                <Link href="/pricing" className="text-purple-400 hover:text-purple-300 transition-colors">
                  Start free trial
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
