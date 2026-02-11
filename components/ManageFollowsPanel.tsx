'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFollows } from '@/hooks/useFollows';
import { useToast } from '@/hooks/useToast';
import type { OnboardingCompany } from '@/lib/data';
import Favicon from '@/components/Favicon';

interface ManageFollowsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getDomain = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

interface CompanyRowProps {
  company: OnboardingCompany & { stage?: string };
  isFollowed: boolean;
  onToggle: () => void;
  exiting?: boolean;
}

function CompanyRow({ company, isFollowed, onToggle, exiting }: CompanyRowProps) {
  const domain = getDomain(company.url);
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
        exiting ? 'opacity-0 max-h-0 py-0 overflow-hidden' : 'opacity-100 max-h-20'
      } ${isFollowed ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-800/30'}`}
    >
      <span className={`text-sm flex-shrink-0 ${isFollowed ? 'text-purple-500' : 'text-zinc-500'}`}>
        {isFollowed ? '★' : '☆'}
      </span>
      {domain ? (
        <Favicon domain={domain} size={24} className="w-6 h-6 rounded flex-shrink-0" />
      ) : (
        <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 flex-shrink-0">
          {company.name.charAt(0)}
        </div>
      )}
      <span className={`text-sm truncate flex-1 ${isFollowed ? 'text-zinc-200' : 'text-zinc-400'} ${
        exiting ? 'line-through' : ''
      }`}>
        {company.name}
      </span>
      {company.stage && (
        <span className="text-xs text-zinc-600 flex-shrink-0">{company.stage}</span>
      )}
    </button>
  );
}

export default function ManageFollowsPanel({ isOpen, onClose }: ManageFollowsPanelProps) {
  const { followedCompanyIds, follow, unfollow } = useFollows();
  const { toast } = useToast();
  const [allCompanies, setAllCompanies] = useState<(OnboardingCompany & { stage?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  // Fetch all companies for search + suggestions
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSearchQuery('');
    setExitingIds(new Set());
    fetch('/api/onboarding')
      .then((res) => res.json())
      .then((data) => {
        if (data.allCompanies) {
          setAllCompanies(data.allCompanies);
        }
      })
      .catch((err) => console.error('Failed to fetch companies:', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // ESC to close + body overflow
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleToggle = useCallback(
    async (company: OnboardingCompany & { stage?: string }) => {
      const isCurrentlyFollowed = followedCompanyIds.has(company.id);

      if (isCurrentlyFollowed) {
        // Animate out
        setExitingIds((prev) => new Set([...prev, company.id]));
        try {
          await unfollow(company.id);
          toast({ type: 'success', message: `Unfollowed ${company.name}.` });
        } catch {
          toast({ type: 'error', message: 'Something went wrong. Try again.' });
          setExitingIds((prev) => {
            const next = new Set(prev);
            next.delete(company.id);
            return next;
          });
          return;
        }
        // Remove from exiting after animation
        setTimeout(() => {
          setExitingIds((prev) => {
            const next = new Set(prev);
            next.delete(company.id);
            return next;
          });
        }, 500);
      } else {
        try {
          await follow(company.id);
          toast({
            type: 'success',
            message: `Following ${company.name}. You'll see their activity in your feed.`,
          });
        } catch {
          toast({ type: 'error', message: 'Something went wrong. Try again.' });
        }
      }
    },
    [followedCompanyIds, follow, unfollow, toast]
  );

  // Followed companies
  const followedCompanies = useMemo(
    () => allCompanies.filter((c) => followedCompanyIds.has(c.id) && !exitingIds.has(c.id)),
    [allCompanies, followedCompanyIds, exitingIds]
  );

  // Suggested companies (same industries as followed, not followed)
  const suggestedCompanies = useMemo(() => {
    const followedIndustries = new Set(
      followedCompanies.map((c) => c.industry).filter(Boolean)
    );
    return allCompanies
      .filter(
        (c) =>
          !followedCompanyIds.has(c.id) &&
          c.industry &&
          followedIndustries.has(c.industry) &&
          c.jobCount > 0
      )
      .slice(0, 5);
  }, [allCompanies, followedCompanyIds, followedCompanies]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allCompanies
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 15);
  }, [allCompanies, searchQuery]);

  if (!isOpen) return null;

  const followCount = followedCompanyIds.size;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">
            Following ({followCount})
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-zinc-800/50">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Search results */}
              {searchQuery.trim() ? (
                <div className="px-2 py-3">
                  <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Results ({searchResults.length})
                  </p>
                  {searchResults.length > 0 ? (
                    searchResults.map((c) => (
                      <CompanyRow
                        key={c.id}
                        company={c}
                        isFollowed={followedCompanyIds.has(c.id)}
                        onToggle={() => handleToggle(c)}
                        exiting={exitingIds.has(c.id)}
                      />
                    ))
                  ) : (
                    <p className="px-3 text-sm text-zinc-500">No companies found.</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Followed list */}
                  <div className="px-2 py-3">
                    <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Following
                    </p>
                    {followedCompanies.length > 0 ? (
                      followedCompanies.map((c) => (
                        <CompanyRow
                          key={c.id}
                          company={c}
                          isFollowed={true}
                          onToggle={() => handleToggle(c)}
                          exiting={exitingIds.has(c.id)}
                        />
                      ))
                    ) : (
                      <p className="px-3 text-sm text-zinc-500">
                        Not following any companies yet.
                      </p>
                    )}
                  </div>

                  {/* Suggested */}
                  {suggestedCompanies.length > 0 && (
                    <div className="px-2 py-3 border-t border-zinc-800/50">
                      <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Suggested
                      </p>
                      {suggestedCompanies.map((c) => (
                        <CompanyRow
                          key={c.id}
                          company={c}
                          isFollowed={false}
                          onToggle={() => handleToggle(c)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
