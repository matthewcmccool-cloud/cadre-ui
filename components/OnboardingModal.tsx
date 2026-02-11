'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFollows } from '@/hooks/useFollows';
import type { OnboardingCompany, OnboardingInvestor } from '@/lib/data';
import Favicon from '@/components/Favicon';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingFollowCompanyId?: string | null;
}

interface OnboardingData {
  popularCompanies: OnboardingCompany[];
  topInvestors: OnboardingInvestor[];
  allCompanies: OnboardingCompany[];
}

const getDomain = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

function CompanyChip({
  company,
  selected,
  onToggle,
}: {
  company: OnboardingCompany;
  selected: boolean;
  onToggle: () => void;
}) {
  const domain = getDomain(company.url);
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
        selected
          ? 'bg-purple-600/20 border border-purple-500/40 text-purple-300 scale-[1.02]'
          : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
      }`}
    >
      {domain ? (
        <Favicon domain={domain} size={16} className="w-4 h-4 rounded-sm flex-shrink-0" />
      ) : (
        <span className="w-4 h-4 rounded-sm bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500 flex-shrink-0">
          {company.name.charAt(0)}
        </span>
      )}
      <span className="truncate">{company.name}</span>
      {selected && (
        <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

export default function OnboardingModal({ isOpen, onClose, pendingFollowCompanyId }: OnboardingModalProps) {
  const router = useRouter();
  const { followedCompanyIds, follow, unfollow, followPortfolio, isFollowing } = useFollows();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [localFollowed, setLocalFollowed] = useState<Set<string>>(new Set());
  const [portfolioFollowed, setPortfolioFollowed] = useState<Set<string>>(new Set());
  const [showMinWarning, setShowMinWarning] = useState(false);

  // Fetch onboarding data
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/onboarding')
      .then(res => res.json())
      .then((d: OnboardingData) => setData(d))
      .catch(err => console.error('Failed to fetch onboarding data:', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Auto-follow the pending company
  useEffect(() => {
    if (pendingFollowCompanyId && isOpen && !isFollowing(pendingFollowCompanyId)) {
      follow(pendingFollowCompanyId).catch(() => {});
      setLocalFollowed(prev => new Set([...prev, pendingFollowCompanyId]));
    }
  }, [pendingFollowCompanyId, isOpen, follow, isFollowing]);

  // Sync from context
  useEffect(() => {
    setLocalFollowed(new Set(followedCompanyIds));
  }, [followedCompanyIds]);

  const totalFollowed = localFollowed.size;

  // ESC to close, body overflow
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
    if (totalFollowed > 0) {
      router.push('/feed');
    } else {
      router.push('/discover');
    }
  }, [onClose, totalFollowed, router]);

  const handleToggleFollow = useCallback(async (companyId: string) => {
    setShowMinWarning(false);
    if (localFollowed.has(companyId)) {
      setLocalFollowed(prev => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
      try {
        await unfollow(companyId);
      } catch {
        setLocalFollowed(prev => new Set([...prev, companyId]));
      }
    } else {
      setLocalFollowed(prev => new Set([...prev, companyId]));
      try {
        await follow(companyId);
      } catch {
        setLocalFollowed(prev => {
          const next = new Set(prev);
          next.delete(companyId);
          return next;
        });
      }
    }
  }, [localFollowed, follow, unfollow]);

  const handleFollowPortfolio = useCallback(async (investorSlug: string) => {
    if (portfolioFollowed.has(investorSlug)) return;
    setPortfolioFollowed(prev => new Set([...prev, investorSlug]));
    try {
      await followPortfolio(investorSlug);
    } catch {
      setPortfolioFollowed(prev => {
        const next = new Set(prev);
        next.delete(investorSlug);
        return next;
      });
    }
  }, [followPortfolio, portfolioFollowed]);

  const handleContinue = useCallback(() => {
    if (totalFollowed < 3) {
      setShowMinWarning(true);
      return;
    }
    onClose();
    router.push('/feed');
  }, [totalFollowed, onClose, router]);

  // Derive suggestions based on the first followed company
  const { suggestedCompanies, searchResults } = useMemo(() => {
    if (!data) return { suggestedCompanies: [], searchResults: [] };

    let suggested: OnboardingCompany[] = [];
    if (pendingFollowCompanyId) {
      const followed = data.allCompanies.find(c => c.id === pendingFollowCompanyId);
      if (followed?.industry) {
        // Same industry companies, sorted by job count
        suggested = data.allCompanies
          .filter(c => c.industry === followed.industry && c.id !== pendingFollowCompanyId)
          .slice(0, 9);
      }
    }
    if (suggested.length < 6) {
      // Fill with popular companies not already in suggestions
      const ids = new Set(suggested.map(c => c.id));
      if (pendingFollowCompanyId) ids.add(pendingFollowCompanyId);
      const filler = data.allCompanies
        .filter(c => !ids.has(c.id) && c.jobCount > 0)
        .slice(0, 9 - suggested.length);
      suggested = [...suggested, ...filler];
    }

    let results: OnboardingCompany[] = [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = data.allCompanies
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, 12);
    }

    return { suggestedCompanies: suggested, searchResults: results };
  }, [data, pendingFollowCompanyId, searchQuery]);

  // Find the pending company details
  const pendingCompany = useMemo(() => {
    if (!pendingFollowCompanyId || !data) return null;
    return data.allCompanies.find(c => c.id === pendingFollowCompanyId) || null;
  }, [pendingFollowCompanyId, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Pick companies to follow
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              We&apos;ll keep you updated on their hiring activity.
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Search results */}
              {searchQuery.trim() && (
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Search Results ({searchResults.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.map(c => (
                      <CompanyChip
                        key={c.id}
                        company={c}
                        selected={localFollowed.has(c.id)}
                        onToggle={() => handleToggleFollow(c.id)}
                      />
                    ))}
                    {searchResults.length === 0 && (
                      <p className="text-sm text-zinc-500">No companies found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Already Following */}
              {pendingCompany && localFollowed.has(pendingCompany.id) && !searchQuery.trim() && (
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Following (1)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <CompanyChip
                      company={pendingCompany}
                      selected={true}
                      onToggle={() => handleToggleFollow(pendingCompany.id)}
                    />
                  </div>
                </div>
              )}

              {/* Suggested for You */}
              {!searchQuery.trim() && suggestedCompanies.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Suggested for You
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCompanies.map(c => (
                      <CompanyChip
                        key={c.id}
                        company={c}
                        selected={localFollowed.has(c.id)}
                        onToggle={() => handleToggleFollow(c.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Popular on Cadre */}
              {!searchQuery.trim() && data && (
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Popular on Cadre
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.popularCompanies.map(c => (
                      <CompanyChip
                        key={c.id}
                        company={c}
                        selected={localFollowed.has(c.id)}
                        onToggle={() => handleToggleFollow(c.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Follow — Investor Portfolios */}
              {!searchQuery.trim() && data && data.topInvestors.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Quick Follow
                  </h3>
                  <div className="space-y-2">
                    {data.topInvestors.map(investor => (
                      <button
                        key={investor.slug}
                        onClick={() => handleFollowPortfolio(investor.slug)}
                        disabled={portfolioFollowed.has(investor.slug)}
                        className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                          portfolioFollowed.has(investor.slug)
                            ? 'bg-purple-600/10 border border-purple-500/30 cursor-default'
                            : 'bg-zinc-800 hover:bg-zinc-700 cursor-pointer'
                        }`}
                      >
                        <span className="text-base">
                          {portfolioFollowed.has(investor.slug) ? '★' : '☆'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${
                            portfolioFollowed.has(investor.slug) ? 'text-purple-300' : 'text-zinc-200'
                          }`}>
                            {investor.name} Portfolio
                          </span>
                          <span className="ml-2 text-xs text-zinc-500">
                            ({investor.companyCount} companies)
                          </span>
                        </div>
                        {portfolioFollowed.has(investor.slug) && (
                          <span className="text-xs text-purple-400">Following ✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed continue button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent">
          {showMinWarning && (
            <p className="text-xs text-yellow-400 text-center mb-2">
              Follow at least 3 companies to get started
            </p>
          )}
          <button
            onClick={handleContinue}
            className={`w-full rounded-md py-3 text-sm font-medium transition-all ${
              totalFollowed >= 3
                ? 'bg-purple-600 text-white hover:bg-purple-500'
                : 'bg-purple-600 text-white opacity-50 cursor-default'
            }`}
          >
            Continue to your feed ({totalFollowed}) →
          </button>
        </div>
      </div>
    </div>
  );
}
