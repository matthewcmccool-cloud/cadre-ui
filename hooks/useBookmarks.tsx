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
import type { BookmarkItemType } from '@/lib/plan-gating';

interface Bookmark {
  id: string;
  item_id: string;
  item_type: BookmarkItemType;
  created_at: string;
}

interface BookmarkCounts {
  job: number;
  company: number;
  investor: number;
}

interface BookmarksContextValue {
  bookmarks: Bookmark[];
  counts: BookmarkCounts;
  plan: 'free' | 'pro';
  limits: { job: number | null; company: number | null; investor: number | null };
  isBookmarked: (itemId: string, itemType: BookmarkItemType) => boolean;
  addBookmark: (itemId: string, itemType: BookmarkItemType) => Promise<{ error?: string; item_type?: string; limit?: number }>;
  removeBookmark: (itemId: string, itemType: BookmarkItemType) => Promise<void>;
  isLoaded: boolean;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [counts, setCounts] = useState<BookmarkCounts>({ job: 0, company: 0, investor: 0 });
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [limits, setLimits] = useState<{ job: number | null; company: number | null; investor: number | null }>({
    job: 3, company: 3, investor: 3,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const fetchedRef = useRef(false);

  // Fetch bookmarks on mount when signed in
  useEffect(() => {
    if (!authLoaded) return;
    if (!isSignedIn) {
      setBookmarks([]);
      setCounts({ job: 0, company: 0, investor: 0 });
      setPlan('free');
      setIsLoaded(true);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch('/api/bookmarks')
      .then((res) => res.json())
      .then((data) => {
        if (data.bookmarks) setBookmarks(data.bookmarks);
        if (data.counts) setCounts(data.counts);
        if (data.plan) setPlan(data.plan);
        if (data.limits) setLimits(data.limits);
      })
      .catch((err) => console.error('Failed to fetch bookmarks:', err))
      .finally(() => setIsLoaded(true));
  }, [isSignedIn, authLoaded]);

  // Reset fetch ref when auth state changes
  useEffect(() => {
    if (!isSignedIn) {
      fetchedRef.current = false;
    }
  }, [isSignedIn]);

  const isBookmarked = useCallback(
    (itemId: string, itemType: BookmarkItemType) =>
      bookmarks.some((b) => b.item_id === itemId && b.item_type === itemType),
    [bookmarks]
  );

  const addBookmark = useCallback(
    async (itemId: string, itemType: BookmarkItemType) => {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const tempBookmark: Bookmark = {
        id: tempId,
        item_id: itemId,
        item_type: itemType,
        created_at: new Date().toISOString(),
      };
      setBookmarks((prev) => [tempBookmark, ...prev]);
      setCounts((prev) => ({ ...prev, [itemType]: prev[itemType] + 1 }));

      try {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: itemId, item_type: itemType }),
        });

        if (res.status === 403) {
          // Free limit reached — revert optimistic update
          setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
          setCounts((prev) => ({ ...prev, [itemType]: prev[itemType] - 1 }));
          const data = await res.json();
          return { error: data.error, item_type: data.item_type, limit: data.limit };
        }

        if (res.status === 409) {
          // Already exists — remove temp, it's already in the list
          setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
          setCounts((prev) => ({ ...prev, [itemType]: prev[itemType] - 1 }));
          return {};
        }

        if (!res.ok) throw new Error('Bookmark failed');

        // Replace temp with real bookmark
        const real = await res.json();
        setBookmarks((prev) =>
          prev.map((b) => (b.id === tempId ? real : b))
        );
        return {};
      } catch {
        // Revert on failure
        setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
        setCounts((prev) => ({ ...prev, [itemType]: prev[itemType] - 1 }));
        throw new Error('Failed to save bookmark');
      }
    },
    []
  );

  const removeBookmark = useCallback(
    async (itemId: string, itemType: BookmarkItemType) => {
      const bookmark = bookmarks.find((b) => b.item_id === itemId && b.item_type === itemType);
      if (!bookmark) return;

      // Optimistic update
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
      setCounts((prev) => ({ ...prev, [itemType]: Math.max(0, prev[itemType] - 1) }));

      try {
        const res = await fetch(`/api/bookmarks/${encodeURIComponent(bookmark.id)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Remove failed');
      } catch {
        // Revert on failure
        setBookmarks((prev) => [...prev, bookmark]);
        setCounts((prev) => ({ ...prev, [itemType]: prev[itemType] + 1 }));
        throw new Error('Failed to remove bookmark');
      }
    },
    [bookmarks]
  );

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        counts,
        plan,
        limits,
        isBookmarked,
        addBookmark,
        removeBookmark,
        isLoaded,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

const FALLBACK: BookmarksContextValue = {
  bookmarks: [],
  counts: { job: 0, company: 0, investor: 0 },
  plan: 'free',
  limits: { job: 3, company: 3, investor: 3 },
  isBookmarked: () => false,
  addBookmark: async () => ({}),
  removeBookmark: async () => {},
  isLoaded: false,
};

export function useBookmarks(): BookmarksContextValue {
  const context = useContext(BookmarksContext);
  return context ?? FALLBACK;
}
