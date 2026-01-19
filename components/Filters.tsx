'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FilterOptions } from '@/lib/airtable';

interface FiltersProps {
  options: FilterOptions;
  currentFilters: {
    functionName?: string;
    location?: string;
    remote?: string;
  };
}

export default function Filters({ options, currentFilters }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push('/?' + params.toString());
  };

  const clearFilters = () => {
    router.push('/');
  };

  const hasActiveFilters = currentFilters.functionName || currentFilters.location || currentFilters.remote;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currentFilters.functionName || ''}
          onChange={(e) => updateFilter('functionName', e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
        >
          <option value="">All Functions</option>
          {options.functions.map(fn => (
            <option key={fn} value={fn}>{fn}</option>
          ))}
        </select>

        <select
          value={currentFilters.location || ''}
          onChange={(e) => updateFilter('location', e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
        >
          <option value="">All Locations</option>
          {options.locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        <button
          onClick={() => updateFilter('remote', currentFilters.remote ? '' : 'true')}
          className={`px-4 py-2 border rounded-lg text-sm ${
            currentFilters.remote 
              ? 'bg-gray-900 text-white border-gray-900' 
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          Remote Only
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
