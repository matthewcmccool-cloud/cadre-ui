'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useToast } from '@/hooks/useToast';
import UpgradeModal from '@/components/UpgradeModal';
import type { BookmarkItemType } from '@/lib/plan-gating';

// Inline SVG icons
function BookmarkOutline({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

function BookmarkFilled({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
    </svg>
  );
}

interface BookmarkButtonProps {
  itemId: string;
  itemType: BookmarkItemType;
  /** Display name for toast messages */
  itemName?: string;
  /** Compact icon-only mode */
  compact?: boolean;
}

export default function BookmarkButton({
  itemId,
  itemType,
  itemName,
  compact = false,
}: BookmarkButtonProps) {
  const { isSignedIn, openSignIn } = useAuth();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const { toast } = useToast();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [animating, setAnimating] = useState(false);

  const saved = isBookmarked(itemId, itemType);

  const label = itemType === 'job' ? 'Save' : 'Follow';
  const savedLabel = itemType === 'job' ? 'Saved' : 'Following';

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      openSignIn();
      return;
    }

    // Scale animation
    setAnimating(true);
    setTimeout(() => setAnimating(false), 150);

    try {
      if (saved) {
        await removeBookmark(itemId, itemType);
        toast({
          type: 'success',
          message: `Removed ${itemName || itemType}`,
          undoAction: () => addBookmark(itemId, itemType),
        });
      } else {
        const result = await addBookmark(itemId, itemType);
        if (result.error === 'free_limit_reached') {
          setShowUpgrade(true);
          return;
        }
        toast({
          type: 'success',
          message: `${savedLabel} ${itemName || ''}`.trim(),
          link: { text: 'View in For Me \u2192', href: '/for-me' },
        });
      }
    } catch {
      toast({ type: 'error', message: 'Something went wrong. Try again.' });
    }
  }, [isSignedIn, openSignIn, saved, itemId, itemType, itemName, addBookmark, removeBookmark, toast, savedLabel]);

  // Compact mode: icon-only
  if (compact) {
    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center justify-center transition-all ${
            animating ? 'scale-110' : 'scale-100'
          } ${
            saved
              ? 'text-purple-400 hover:text-purple-300'
              : 'text-zinc-600 hover:text-purple-400'
          }`}
          title={saved ? savedLabel : label}
        >
          {saved ? (
            <BookmarkFilled className="w-3.5 h-3.5" />
          ) : (
            <BookmarkOutline className="w-3.5 h-3.5" />
          )}
        </button>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      </>
    );
  }

  // Full mode: icon + text
  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
          animating ? 'scale-105' : 'scale-100'
        } ${
          saved
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
            : 'border border-purple-500 text-purple-400 hover:bg-purple-500/10'
        }`}
      >
        {saved ? (
          <>
            <BookmarkFilled className="w-4 h-4" />
            {savedLabel} &#10003;
          </>
        ) : (
          <>
            <BookmarkOutline className="w-4 h-4" />
            {label}
          </>
        )}
      </button>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
