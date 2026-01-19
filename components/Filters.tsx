'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface FilterOptions {
  functions: string[]
  locations: string[]
  investors: string[]
  industries: string[]
}

interface FiltersProps {
  options: FilterOptions
  currentFilters: {
    function?: string
    location?: string
    investor?: string
    remote?: string
  }
}

export default function Filters({ options, currentFilters }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/?${params.toString()}`)
  }, [searchParams, router])

  const clearFilters = useCallback(() => {
    router.push('/')
  }, [router])

  const hasActiveFilters = currentFilters.function || currentFilters.location || 
                           currentFilters.investor || currentFilters.remote

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Function Filter */}
        <select
          value={currentFilters.function || ''}
          onChange={(e) => updateFilter('function', e.target.value)}
          className="filter-btn appearance-none pr-8 bg-no-repeat bg-right"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundSize: '1.5em 1.5em',
            backgroundPosition: 'right 0.5em center',
          }}
        >
          <option value="">All Functions</option>
          {options.functions.map(fn => (
            <option key={fn} value={fn}>{fn}</option>
          ))}
        </select>

        {/* Location Filter */}
        <select
          value={currentFilters.location || ''}
          onChange={(e) => updateFilter('location', e.target.value)}
          className="filter-btn appearance-none pr-8 bg-no-repeat bg-right"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundSize: '1.5em 1.5em',
            backgroundPosition: 'right 0.5em center',
          }}
        >
          <option value="">All Locations</option>
          {options.locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* Remote Toggle */}
        <button
          onClick={() => updateFilter('remote', currentFilters.remote ? '' : 'true')}
          className={`filter-btn ${currentFilters.remote ? 'active' : ''}`}
        >
          Remote Only
        </button>

        {/* Investor Filter */}
        <select
          value={currentFilters.investor || ''}
          onChange={(e) => updateFilter('investor', e.target.value)}
          className="filter-btn appearance-none pr-8 bg-no-repeat bg-right"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundSize: '1.5em 1.5em',
            backgroundPosition: 'right 0.5em center',
          }}
        >
          <option value="">All Investors</option>
          {options.investors.map(inv => (
            <option key={inv} value={inv}>{inv}</option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentFilters.function && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
              {currentFilters.function}
              <button
                onClick={() => updateFilter('function', '')}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </span>
          )}
          {currentFilters.location && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
              {currentFilters.location}
              <button
                onClick={() => updateFilter('location', '')}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </span>
          )}
          {currentFilters.remote && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
              Remote Only
              <button
                onClick={() => updateFilter('remote', '')}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </span>
          )}
          {currentFilters.investor && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
              {currentFilters.investor}
              <button
                onClick={() => updateFilter('investor', '')}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
