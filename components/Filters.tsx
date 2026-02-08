'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FilterOptions } from '@/lib/airtable';
import { useState, useRef, useEffect } from 'react';

interface FiltersProps {
  options: FilterOptions;
  currentFilters: {
    functionName?: string;
    industry?: string;
    investor?: string;
    remote?: string;
  };
}

type FilterType = 'function' | 'industry' | 'investor';

const filterConfigs: Record<FilterType, {
  paramName: string;
  label: string;
  optionsKey: keyof FilterOptions;
  colors: { bg: string; text: string; border: string };
}> = {
  function: {
    paramName: 'functionName',
    label: 'Department',
    optionsKey: 'departments',
    colors: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  },
  industry: {
    paramName: 'industry',
    label: 'Industry',
    optionsKey: 'industries',
    colors: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  },
  investor: {
    paramName: 'investor',
    label: 'Investor',
    optionsKey: 'investors',
    colors: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  },
};

export default function Filters({ options, currentFilters }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Parse comma-separated values from URL
  const selectedFunctions = currentFilters.functionName?.split(',').filter(Boolean) || [];
  const selectedIndustries = currentFilters.industry?.split(',').filter(Boolean) || [];
  const selectedInvestors = currentFilters.investor?.split(',').filter(Boolean) || [];
  const isRemote = currentFilters.remote === 'true';

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node) &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterMenu(false);
        setActiveFilter(null);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateFilter = (paramName: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (values.length > 0) {
      params.set(paramName, values.join(','));
    } else {
      params.delete(paramName);
    }
    params.delete('page');
    router.push('/?' + params.toString());
  };

  const toggleFilterValue = (filterType: FilterType, value: string) => {
    const config = filterConfigs[filterType];
    const currentValues = filterType === 'function' ? selectedFunctions
      : filterType === 'industry' ? selectedIndustries
      : selectedInvestors;

    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    updateFilter(config.paramName, newValues);
  };

  const removeFilter = (paramName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);
    params.delete('page');
    router.push('/?' + params.toString());
  };

  const toggleRemote = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isRemote) {
      params.delete('remote');
    } else {
      params.set('remote', 'true');
    }
    params.delete('page');
    router.push('/?' + params.toString());
  };

  const clearFilters = () => {
    router.push('/');
  };

  const getFilteredOptions = (filterType: FilterType) => {
    const config = filterConfigs[filterType];
    const allOptions = options[config.optionsKey] || [];
    if (!searchQuery) return allOptions;
    return allOptions.filter(opt =>
      opt.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getSelectedValues = (filterType: FilterType) => {
    return filterType === 'function' ? selectedFunctions
      : filterType === 'industry' ? selectedIndustries
      : selectedInvestors;
  };

  const hasActiveFilters = selectedFunctions.length > 0 || selectedIndustries.length > 0 || selectedInvestors.length > 0 || isRemote;

  const renderChip = (filterType: FilterType, values: string[]) => {
    if (values.length === 0) return null;
    const config = filterConfigs[filterType];
    const displayText = values.length === 1 ? values[0] : `${values.length} selected`;

    return (
      <div
        key={filterType}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer border ${config.colors.bg} ${config.colors.text} ${config.colors.border}`}
        onClick={() => {
          setActiveFilter(filterType);
          setShowFilterMenu(true);
        }}
      >
        <span className="text-xs opacity-70">{config.label}:</span>
        <span>{displayText}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeFilter(config.paramName);
          }}
          className="ml-1 hover:opacity-70"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Add Filter Button */}
        <div className="relative" ref={filterMenuRef}>
          <button
            onClick={() => {
              setShowFilterMenu(!showFilterMenu);
              setActiveFilter(null);
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add filter
          </button>

          {/* Filter Type Menu */}
          {showFilterMenu && !activeFilter && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-1">
                {(Object.keys(filterConfigs) as FilterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    {filterConfigs[type].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Options Dropdown */}
          {showFilterMenu && activeFilter && (
            <div
              ref={filterDropdownRef}
              className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
            >
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder={`Search ${filterConfigs[activeFilter].label.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {getFilteredOptions(activeFilter).map((option) => {
                  const isSelected = getSelectedValues(activeFilter).includes(option);
                  return (
                    <label
                      key={option}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFilterValue(activeFilter, option)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className={isSelected ? 'font-medium' : ''}>{option}</span>
                    </label>
                  );
                })}
                {getFilteredOptions(activeFilter).length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                )}
              </div>
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setActiveFilter(null);
                    setShowFilterMenu(false);
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Chips */}
        {renderChip('function', selectedFunctions)}
        {renderChip('industry', selectedIndustries)}
        {renderChip('investor', selectedInvestors)}

        {/* Remote Toggle */}
        <button
          onClick={toggleRemote}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            isRemote
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Remote
          {isRemote && (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Clear All */}
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
