'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  multiSelect?: boolean;
}

export default function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  searchable = false,
  multiSelect = true,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search input when opening
  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, searchable]);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (value: string) => {
    if (!multiSelect) {
      // Single-select: set the value or clear it
      onChange(selected.includes(value) ? [] : [value]);
      setOpen(false);
      setQuery('');
      return;
    }
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const activeCount = selected.length;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
          activeCount > 0
            ? 'bg-[#5e6ad2]/15 text-[#5e6ad2] border border-[#5e6ad2]/30'
            : 'bg-[#1a1a1b] text-[#888] border border-transparent hover:bg-[#252526] hover:text-[#e8e8e8]'
        }`}
      >
        {label}
        {activeCount > 0 && (
          <span className="bg-[#5e6ad2]/25 text-[#5e6ad2] px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none">
            {activeCount}
          </span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown popover */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-64 max-h-72 bg-[#1a1a1b] border border-[#252526] rounded-lg shadow-xl overflow-hidden">
          {/* Search input */}
          {searchable && (
            <div className="p-2 border-b border-[#252526]">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full px-2.5 py-1.5 bg-[#0e0e0f] border border-[#252526] rounded text-xs text-[#e8e8e8] placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
              />
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto max-h-56 py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#555]">No matches</div>
            ) : (
              filtered.map(option => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggle(option.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#5e6ad2]/10 text-[#e8e8e8]'
                        : 'text-[#999] hover:bg-[#252526] hover:text-[#e8e8e8]'
                    }`}
                  >
                    {multiSelect && (
                      <span
                        className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#5e6ad2] border-[#5e6ad2]'
                            : 'border-[#444]'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    )}
                    {!multiSelect && (
                      <span
                        className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                          isSelected
                            ? 'border-[#5e6ad2] bg-[#5e6ad2]'
                            : 'border-[#444]'
                        }`}
                      >
                        {isSelected && (
                          <span className="block w-1.5 h-1.5 rounded-full bg-white m-[2.5px]" />
                        )}
                      </span>
                    )}
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-[10px] text-[#555] flex-shrink-0">{option.count}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
