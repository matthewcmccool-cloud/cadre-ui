'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { useToast } from '@/hooks/useToast';

interface FollowPortfolioButtonProps {
  investorSlug: string;
  investorName: string;
  companyCount: number;
  /** IDs of companies in this investor's portfolio */
  portfolioCompanyIds: string[];
}

export default function FollowPortfolioButton({
  investorSlug,
  investorName,
  companyCount,
  portfolioCompanyIds,
}: FollowPortfolioButtonProps) {
  const { isSignedIn, openSignIn } = useAuth();
  const { isFollowing, followPortfolio } = useFollows();
  const { toast } = useToast();
  const [hovering, setHovering] = useState(false);
  const [loading, setLoading] = useState(false);

  // Consider portfolio "followed" if all portfolio companies are followed
  const followedCount = portfolioCompanyIds.filter((id) => isFollowing(id)).length;
  const allFollowed = companyCount > 0 && followedCount === companyCount;

  const handleClick = async () => {
    if (!isSignedIn) {
      openSignIn({ companyName: investorName });
      return;
    }

    if (loading) return;

    if (allFollowed) {
      toast({ type: 'success', message: `Your individually followed companies are unchanged.` });
      return;
    }

    setLoading(true);
    try {
      const result = await followPortfolio(investorSlug);
      toast({ type: 'success', message: `Following ${result.newFollows} companies in ${result.investorName}'s portfolio.` });
    } catch {
      toast({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (allFollowed) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          hovering
            ? 'bg-zinc-600 text-white'
            : 'bg-purple-600 text-white'
        }`}
      >
        {hovering ? 'Unfollow Portfolio' : `★ Following Portfolio ✓`}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors disabled:opacity-50"
    >
      {loading ? 'Following...' : `☆ Follow Portfolio (${companyCount})`}
    </button>
  );
}
