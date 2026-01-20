'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FilterOptions } from '@/lib/airtable';

interface FiltersProps {
  options: FilterOptions;
  currentFilters: {
    functionName?: string;
    location?: string;
    remote?: string;
    industry?: string;
    investor?: string;
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

  const hasActiveFilters = currentFilters.functionName || currentFilters.location || currentFilters.remote || currentFilters.industry || currentFilters.investor;

  const selectClasses = "px-4 py-2 bg-[#333333] border border-[#3A3A3A] rounded-md text-sm text-[#F9F9F9] focus:outline-none focus:border-[#525252] hover:bg-[#404040] cursor-pointer transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currentFilters.functionName || ''}
          onChange={(e) => updateFilter('functionName', e.target.value)}
          className={selectClasses}
        >
          <option value="">All Functions</option>
          {options.functions.map(fn => (
            <option key={fn} value={fn}>{fn}</option>
          ))}
        </select>

{/* Location filter - temporarily disabled until location data is fixed
                  <select
          value={currentFilters.location || ''}
          onChange={(e) => updateFilter('location', e.target.value)}
          className={selectClasses}
        >
          <option value="">All Locations</option>
          {options.locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
          */}

        <select
          value={currentFilters.industry || ''}
          onChange={(e) => updateFilter('industry', e.target.value)}
          className={selectClasses}
        >
          <option value="">All Industries</option>
          {options.industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>

        <select
          value={currentFilters.investor || ''}
          onChange={(e) => updateFilter('investor', e.target.value)}
          className={selectClasses}
        >
          <option value="">All Investors</option>
          {options.investors.map(inv => (
            <option key={inv} value={inv}>{inv}</option>
          ))}
        </select>

        <button
          onClick={() => updateFilter('remote', currentFilters.remote ? '' : 'true')}
          className={`px-4 py-2 border rounded-md text-sm transition-colors ${
            currentFilters.remote
              ? 'bg-[#F9F9F9] text-[#262626] border-[#F9F9F9]'
              : 'bg-[#333333] border-[#3A3A3A] text-[#F9F9F9] hover:bg-[#404040]'
          }`}
        >
          Remote Only
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-[#A0A0A0] hover:text-[#F9F9F9] underline transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
