'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trackFollowCompany, trackUnfollowCompany, trackFollowPortfolio } from '@/lib/analytics';

interface FollowsContextValue {
  followedCompanyIds: Set<string>;
  followCount: number;
  isFollowing: (companyId: string) => boolean;
  follow: (companyId: string) => Promise<void>;
  unfollow: (companyId: string) => Promise<void>;
  followPortfolio: (investorSlug: string) => Promise<{ newFollows: number; investorName: string }>;
  isLoaded: boolean;
}

const FollowsContext = createContext<FollowsContextValue | null>(null);

export function FollowsProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const fetchedRef = useRef(false);

  // Fetch follows on mount when signed in
  useEffect(() => {
    if (!authLoaded) return;
    if (!isSignedIn) {
      setFollowedIds(new Set());
      setIsLoaded(true);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch('/api/follows')
      .then((res) => res.json())
      .then((data) => {
        if (data.companyIds) {
          setFollowedIds(new Set(data.companyIds));
        }
      })
      .catch((err) => console.error('Failed to fetch follows:', err))
      .finally(() => setIsLoaded(true));
  }, [isSignedIn, authLoaded]);

  // Reset fetch ref when auth state changes (e.g., sign out then sign in)
  useEffect(() => {
    if (!isSignedIn) {
      fetchedRef.current = false;
    }
  }, [isSignedIn]);

  const isFollowing = useCallback(
    (companyId: string) => followedIds.has(companyId),
    [followedIds]
  );

  const follow = useCallback(
    async (companyId: string) => {
      // Optimistic update
      setFollowedIds((prev) => new Set([...prev, companyId]));

      try {
        const res = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId }),
        });
        if (!res.ok) throw new Error('Follow failed');
        trackFollowCompany(companyId);
      } catch {
        // Revert on failure
        setFollowedIds((prev) => {
          const next = new Set(prev);
          next.delete(companyId);
          return next;
        });
        throw new Error('Failed to follow company');
      }
    },
    []
  );

  const unfollow = useCallback(
    async (companyId: string) => {
      // Optimistic update
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });

      try {
        const res = await fetch(`/api/follows/${encodeURIComponent(companyId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Unfollow failed');
        trackUnfollowCompany(companyId);
      } catch {
        // Revert on failure
        setFollowedIds((prev) => new Set([...prev, companyId]));
        throw new Error('Failed to unfollow company');
      }
    },
    []
  );

  const followPortfolio = useCallback(
    async (investorSlug: string) => {
      const res = await fetch('/api/follows/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorId: investorSlug }),
      });

      if (!res.ok) throw new Error('Portfolio follow failed');

      const data = await res.json();

      // Refetch all follows after portfolio follow since we don't have the IDs client-side
      const followsRes = await fetch('/api/follows');
      if (followsRes.ok) {
        const followsData = await followsRes.json();
        if (followsData.companyIds) {
          setFollowedIds(new Set(followsData.companyIds));
        }
      }

      trackFollowPortfolio(investorSlug);
      return { newFollows: data.newFollows, investorName: data.investorName };
    },
    []
  );

  return (
    <FollowsContext.Provider
      value={{
        followedCompanyIds: followedIds,
        followCount: followedIds.size,
        isFollowing,
        follow,
        unfollow,
        followPortfolio,
        isLoaded,
      }}
    >
      {children}
    </FollowsContext.Provider>
  );
}

export function useFollows(): FollowsContextValue {
  const context = useContext(FollowsContext);
  if (!context) {
    throw new Error('useFollows must be used within a FollowsProvider');
  }
  return context;
}
