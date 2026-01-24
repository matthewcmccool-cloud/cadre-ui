'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FilterOptions } from '@/lib/airtable';
import { useState, useRef, useEffect } from 'react';

// Types
type FieldType = 'function' | 'industry' | 'investor' | 'location' | 'remote';
type OperatorType = 'is' | 'is_not' | 'contains';
type ConnectorType = 'and' | 'or';

interface FilterCondition {
  id: string;
  connector: ConnectorType;
  field: FieldType;
  operator: OperatorType;
  value: string[];
}

interface QueryBuilderProps {
  options: FilterOptions;
    defaultOpen?: boolean;
  currentFilters: {
    functionName?: string;
    industry?: string;
    investor?: string;
    location?: string;
    remote?: string;
  };
}

const fieldConfigs: Record<FieldType, { label: string; optionsKey?: keyof FilterOptions }> = {
  function: { label: 'Function', optionsKey: 'functions' },
  industry: { label: 'Industry', optionsKey: 'industries' },
  investor: { label: 'Investor', optionsKey: 'investors' },
  location: { label: 'Location' },
  remote: { label: 'Remote' },
};

const operators: { value: OperatorType; label: string }[] = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  
  
];

const generateId = () => Math.random().toString(36).substr(2, 9);

// Parse URL to conditions
const parseUrlToConditions = (filters: QueryBuilderProps['currentFilters']): FilterCondition[] => {
  const conditions: FilterCondition[] = [];
  
  if (filters.functionName) {
    conditions.push({
      id: generateId(),
      connector: 'and',
      field: 'function',
      operator: 'is',
      value: filters.functionName.split(',').map(v => v.trim()),
    });
  }
  if (filters.industry) {
    conditions.push({
      id: generateId(),
      connector: 'and',
      field: 'industry',
      operator: 'is',
      value: filters.industry.split(',').map(v => v.trim()),
    });
  }
  if (filters.investor) {
    conditions.push({
      id: generateId(),
      connector: 'and',
      field: 'investor',
      operator: 'is',
      value: filters.investor.split(',').map(v => v.trim()),
    });
  }
  if (filters.location) {
    conditions.push({
      id: generateId(),
      connector: 'and',
      field: 'location',
      operator: 'contains',
      value: [filters.location],
    });
  }
  if (filters.remote === 'true') {
    conditions.push({
      id: generateId(),
      connector: 'and',
      field: 'remote',
      operator: 'is',
      value: ['true'],
    });
  }
  
  return conditions;
};

export default function QueryBuilder({ options, defaultOpen, currentFilters }: QueryBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conditions, setConditions] = useState<FilterCondition[]>(() => 
    parseUrlToConditions(currentFilters)
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync conditions when URL params change (e.g., after Clear all)
    useEffect(() => {
          setConditions(parseUrlToConditions(currentFilters));
        }, [JSON.stringify(currentFilters)]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply filters to URL
  const applyFilters = (newConditions: FilterCondition[]) => {
    const params = new URLSearchParams();
    
    newConditions.forEach(cond => {
      
      if (cond.value.length === 0) return;
      
      const paramMap: Record<FieldType, string> = {
        function: 'functionName',
        industry: 'industry',
        investor: 'investor',
        location: 'location',
        remote: 'remote',
      };
      
      const paramName = paramMap[cond.field];
      if (cond.field === 'remote') {
        if (cond.value[0] === 'true') params.set(paramName, 'true');
      } else if (cond.field === 'location') {
        params.set(paramName, cond.value[0]);
      } else {
        params.set(paramName, cond.value.join(','));
      }
    });
    
    router.push('/?' + params.toString());
  };


  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: generateId(),
      connector: 'and',
      field: 'function',
      operator: 'is',
      value: [],
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    const newConditions = conditions.map(c => c.id === id ? { ...c, ...updates } : c);
    setConditions(newConditions);
    applyFilters(newConditions);
  };

  const removeCondition = (id: string) => {
    const newConditions = conditions.filter(c => c.id !== id);
    setConditions(newConditions);
    applyFilters(newConditions);
  };

  const toggleValue = (conditionId: string, value: string) => {
    const condition = conditions.find(c => c.id === conditionId);
    if (!condition) return;
    const newValues = condition.value.includes(value)
      ? condition.value.filter(v => v !== value)
      : [...condition.value, value];
    updateCondition(conditionId, { value: newValues });
  };

  const getFieldOptions = (field: FieldType): string[] => {
    const config = fieldConfigs[field];
    if (!config.optionsKey) return [];
    return options[config.optionsKey] || [];
  };

  const hasFilters = conditions.length > 0;

  return (
    <div className="space-y-3">
      {/* Filter Rows */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
        {conditions.length === 0 ? (
          <p className="text-[#666] text-sm">No filters applied. Click "+ Add condition" to filter results.</p>
        ) : (
          <div className="space-y-2">
            {conditions.map((condition, index) => (
              <div key={condition.id} className="flex items-center gap-2 flex-wrap">
                {/* Connector (Where / And / Or) */}
                <div className="w-16">
                  {index === 0 ? (
                    <span className="text-[#888] text-sm">Where</span>
                  ) : (
                    <select
                      value={condition.connector}
                      onChange={(e) => updateCondition(condition.id, { connector: e.target.value as ConnectorType })}
                      className="w-full bg-[#262626] border border-[#444] rounded px-2 py-1 text-sm text-white"
                    >
                      <option value="and">and</option>
                      <option value="or">or</option>
                    </select>
                  )}
                </div>

                {/* Field Dropdown */}
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(condition.id, { field: e.target.value as FieldType, value: [] })}
                  className="bg-[#262626] border border-[#444] rounded px-3 py-1 text-sm text-white min-w-[120px]"
                >
                  {Object.entries(fieldConfigs).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>

                {/* Operator Dropdown */}
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, { operator: e.target.value as OperatorType })}
                  className="bg-[#262626] border border-[#444] rounded px-3 py-1 text-sm text-white min-w-[100px]"
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>


                {/* Value Input */}
                {(
                  <div className="relative">
                    {condition.field === 'remote' ? (
                      <select
                        value={condition.value[0] || ''}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value ? [e.target.value] : [] })}
                        className="bg-[#262626] border border-[#444] rounded px-3 py-1 text-sm text-white"
                      >
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : condition.field === 'location' ? (
                      <input
                        type="text"
                        value={condition.value[0] || ''}
                        onChange={(e) => updateCondition(condition.id, { value: e.target.value ? [e.target.value] : [] })}
                        placeholder="Enter location..."
                        className="bg-[#262626] border border-[#444] rounded px-3 py-1 text-sm text-white min-w-[150px]"
                      />
                    ) : (
                      <div ref={openDropdown === condition.id ? dropdownRef : null}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === condition.id ? null : condition.id)}
                          className="bg-[#262626] border border-[#444] rounded px-3 py-1 text-sm text-white min-w-[150px] text-left"
                        >
                          {condition.value.length === 0 ? 'Select...' : condition.value.length === 1 ? condition.value[0] : `${condition.value.length} selected`}
                        </button>
                        {openDropdown === condition.id && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a1a1a] border border-[#444] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                            <input
                              type="text"
                              placeholder="Search..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 bg-[#262626] border-b border-[#444] text-sm text-white"
                            />
                            {getFieldOptions(condition.field)
                              .filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map(option => (
                                <label key={option} className="flex items-center gap-2 px-3 py-2 hover:bg-[#333] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={condition.value.includes(option)}
                                    onChange={() => toggleValue(condition.id, option)}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm text-white">{option}</span>
                                </label>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="p-1 text-[#666] hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={addCondition}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add condition
        </button>
        <button
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#666] cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add condition group
        </button>
        {hasFilters && (
          <button
            onClick={() => { setConditions([]); router.push('/'); }}
            className="text-sm text-[#666] hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
