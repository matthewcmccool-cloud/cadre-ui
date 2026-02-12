'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/useToast';

// Inline SVG icons
function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

function BookmarkFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface FollowPortfolioButtonProps {
  investorSlug: string;
  investorName: string;
  companyCount: number;
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
  const { status } = useSubscription();
  const { toast } = useToast();
  const [hovering, setHovering] = useState(false);
  const [loading, setLoading] = useState(false);

  const isExpired = status === 'canceled';
  const followedCount = portfolioCompanyIds.filter((id) => isFollowing(id)).length;
  const allFollowed = companyCount > 0 && followedCount === companyCount;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSignedIn && isExpired && !allFollowed) {
      toast({
        type: 'error',
        message: 'Reactivate Pro to follow portfolios',
        link: { text: '$99/month \u2192', href: '/pricing' },
      });
      return;
    }

    if (!isSignedIn) {
      openSignIn({ companyName: investorName });
      return;
    }

    if (loading) return;

    if (allFollowed) {
      toast({ type: 'success', message: 'Already following all portfolio companies.' });
      return;
    }

    setLoading(true);
    try {
      const result = await followPortfolio(investorSlug);
      toast({
        type: 'success',
        message: `Following ${result.newFollows} companies in ${result.investorName}'s portfolio`,
        link: { text: 'View in Intelligence \u2192', href: '/intelligence' },
      });
    } catch {
      toast({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // State 2: All followed
  if (allFollowed) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          hovering
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
        }`}
      >
        {hovering ? (
          <>
            <XIcon className="w-4 h-4" />
            Unfollow Portfolio
          </>
        ) : (
          <>
            <BookmarkFilledIcon className="w-4 h-4" />
            Following Portfolio &#10003;
          </>
        )}
      </button>
    );
  }

  // State 1 & 3: Not following
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
    >
      <BookmarkIcon className="w-4 h-4" />
      {loading ? 'Following...' : `Follow Portfolio (${companyCount})`}
    </button>
  );
}
