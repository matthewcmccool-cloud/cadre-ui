'use client';

interface ActiveFilter {
  param: string;    // URL param name
  value: string;    // raw value
  label: string;    // display label
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  totalCount: number;
  onRemove: (param: string, value: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilters({ filters, totalCount, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3">
      <span className="text-[10px] text-[#555] uppercase tracking-wide mr-0.5">Active:</span>
      {filters.map((f, i) => (
        <button
          key={`${f.param}-${f.value}-${i}`}
          onClick={() => onRemove(f.param, f.value)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#5e6ad2]/10 text-[#5e6ad2] text-xs transition-colors hover:bg-[#5e6ad2]/20 group"
        >
          {f.label}
          <svg
            className="w-3 h-3 text-[#5e6ad2]/50 group-hover:text-[#5e6ad2]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-[10px] text-[#555] hover:text-[#888] transition-colors ml-1"
      >
        Clear all
      </button>
      <span className="ml-auto text-[10px] text-[#555]">
        {totalCount.toLocaleString()} roles match
      </span>
    </div>
  );
}
