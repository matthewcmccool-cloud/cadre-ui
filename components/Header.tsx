'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'

export default function Header() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set('search', searchValue)
    } else {
      params.delete('search')
    }
    router.push(`/?${params.toString()}`)
  }, [searchValue, searchParams, router])

  return (
    <header className="border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-cadre-black tracking-tight">
              cadre
            </h1>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search jobs, companies..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="search-input w-full pl-10"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Nav Links - Future */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm text-cadre-gray hover:text-cadre-black transition-colors"
            >
              Jobs
            </Link>
            <span className="text-sm text-gray-300">Companies</span>
            <span className="text-sm text-gray-300">Investors</span>
          </nav>
        </div>
      </div>
    </header>
  )
}
