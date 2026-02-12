'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatNumber } from '@/lib/format';

const VIEWS = [
  { key: 'jobs', label: 'Jobs' },
  { key: 'companies', label: 'Companies' },
  { key: 'investors', label: 'Investors' },
] as const;

function formatCount(count: number): string {
  if (count > 5000) return '5,000+';
  return formatNumber(count);
}

interface ViewSwitcherProps {
  counts?: { companies?: number; jobs?: number; investors?: number };
}

export default function ViewSwitcher({ counts }: ViewSwitcherProps) {
  const searchParams = useSearchParams();
  const activeView = searchParams.get('view') || 'jobs';

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg w-fit">
      {VIEWS.map(({ key, label }) => {
        const isActive = activeView === key;
        return (
          <Link
            key={key}
            href={`/discover?view=${key}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
            {counts?.[key] !== undefined && (
              <span className={`ml-1.5 text-xs ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {formatCount(counts[key]!)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
