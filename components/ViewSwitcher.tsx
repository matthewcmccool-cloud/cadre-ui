'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const VIEWS = [
  { key: 'companies', label: 'Companies' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'investors', label: 'Investors' },
] as const;

interface ViewSwitcherProps {
  counts?: { companies?: number; jobs?: number; investors?: number };
}

export default function ViewSwitcher({ counts }: ViewSwitcherProps) {
  const searchParams = useSearchParams();
  const activeView = searchParams.get('view') || 'companies';

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
                {counts[key]?.toLocaleString()}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
