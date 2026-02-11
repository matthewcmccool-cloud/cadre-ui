'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchResult } from '@/lib/data';
import { trackSearch } from '@/lib/analytics';
import Favicon from '@/components/Favicon';

const getDomain = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResultItem =
  | { type: 'company'; name: string; slug: string; url?: string; industry?: string; stage?: string }
  | { type: 'investor'; name: string; slug: string }
  | { type: 'job'; id: string; title: string; company: string; companySlug: string };

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setHighlightIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      trackSearch(query.trim());
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data: SearchResult) => {
          setResults(data);
          setHighlightIndex(0);
        })
        .catch(() => setResults(null))
        .finally(() => setLoading(false));
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Flatten results for keyboard navigation
  const flatItems: ResultItem[] = [];
  if (results) {
    results.companies.forEach((c) => flatItems.push({ type: 'company', ...c }));
    results.investors.forEach((i) => flatItems.push({ type: 'investor', ...i }));
    results.jobs.forEach((j) => flatItems.push({ type: 'job', ...j }));
  }

  const navigate = useCallback(
    (item: ResultItem) => {
      onClose();
      if (item.type === 'company') {
        router.push(`/companies/${item.slug}`);
      } else if (item.type === 'investor') {
        router.push(`/investors/${item.slug}`);
      } else if (item.type === 'job') {
        router.push(`/jobs/${item.id}`);
      }
    },
    [router, onClose]
  );

  // Keyboard handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && flatItems.length > 0) {
        e.preventDefault();
        navigate(flatItems[highlightIndex]);
      }
    },
    [onClose, flatItems, highlightIndex, navigate]
  );

  if (!isOpen) return null;

  // Track which section each item belongs to for rendering headers
  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg mx-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies, investors, roles..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin flex-shrink-0" />
          )}
        </div>

        {/* Results */}
        {query.trim() && results && (
          <div className="max-h-80 overflow-y-auto py-2">
            {flatItems.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500 text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            ) : (
              <>
                {/* Companies */}
                {results.companies.length > 0 && (
                  <div>
                    <p className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-wide font-medium">
                      Companies
                    </p>
                    {results.companies.map((c) => {
                      const idx = globalIndex++;
                      const domain = getDomain(c.url);
                      return (
                        <button
                          key={`c-${c.slug}`}
                          onClick={() => navigate({ type: 'company', ...c })}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-md text-left transition-colors ${
                            highlightIndex === idx ? 'bg-zinc-800' : ''
                          }`}
                        >
                          {domain ? (
                            <Favicon domain={domain} size={20} className="w-5 h-5 rounded-sm flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-sm bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-500 flex-shrink-0">
                              {c.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm text-zinc-200 truncate">{c.name}</span>
                          {c.industry && (
                            <span className="text-xs text-zinc-500">· {c.industry}</span>
                          )}
                          {c.stage && (
                            <span className="text-xs text-zinc-600">· {c.stage}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Investors */}
                {results.investors.length > 0 && (
                  <div>
                    <p className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-wide font-medium mt-1">
                      Investors
                    </p>
                    {results.investors.map((inv) => {
                      const idx = globalIndex++;
                      return (
                        <button
                          key={`i-${inv.slug}`}
                          onClick={() => navigate({ type: 'investor', ...inv })}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-md text-left transition-colors ${
                            highlightIndex === idx ? 'bg-zinc-800' : ''
                          }`}
                        >
                          <span className="text-sm text-zinc-200">{inv.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Jobs */}
                {results.jobs.length > 0 && (
                  <div>
                    <p className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-wide font-medium mt-1">
                      Jobs
                    </p>
                    {results.jobs.map((job) => {
                      const idx = globalIndex++;
                      return (
                        <button
                          key={`j-${job.id}`}
                          onClick={() => navigate({ type: 'job', ...job })}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-md text-left transition-colors ${
                            highlightIndex === idx ? 'bg-zinc-800' : ''
                          }`}
                        >
                          <span className="text-sm text-zinc-200 truncate">{job.title}</span>
                          {job.company && (
                            <span className="text-xs text-zinc-500">· {job.company}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-2 border-t border-zinc-800/50">
          <span className="text-xs text-zinc-600">ESC to close</span>
        </div>
      </div>
    </div>
  );
}
