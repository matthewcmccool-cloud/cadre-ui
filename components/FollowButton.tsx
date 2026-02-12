'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/useToast';

// Inline SVG icons (no lucide-react dependency)
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

interface FollowButtonProps {
  companyId: string;
  companyName: string;
  /** Use "Save" text for jobs instead of "Follow" */
  variant?: 'follow' | 'save';
  /** Compact mode: icon-only, no text */
  compact?: boolean;
}

export default function FollowButton({ companyId, companyName, variant = 'follow', compact = false }: FollowButtonProps) {
  const { isSignedIn, openSignIn } = useAuth();
  const { isFollowing, follow, unfollow } = useFollows();
  const { status } = useSubscription();
  const { toast } = useToast();
  const [hovering, setHovering] = useState(false);

  const following = isFollowing(companyId);
  const isExpired = status === 'canceled';
  const label = variant === 'save' ? 'Save' : 'Follow';
  const followingLabel = variant === 'save' ? 'Saved' : 'Following';

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // State 3: expired trial
    if (isSignedIn && isExpired && !following) {
      toast({
        type: 'error',
        message: `Reactivate Pro to ${label.toLowerCase()} companies`,
        link: { text: '$99/month \u2192', href: '/pricing' },
      });
      return;
    }

    // State 1: not signed in
    if (!isSignedIn) {
      openSignIn({ companyName, companyId });
      return;
    }

    try {
      if (following) {
        // Unfollow
        await unfollow(companyId);
        toast({
          type: 'success',
          message: `Unfollowed ${companyName}`,
          undoAction: () => follow(companyId),
        });
      } else {
        // Follow
        await follow(companyId);
        toast({
          type: 'success',
          message: `Following ${companyName}`,
          link: { text: 'View in Intelligence \u2192', href: '/intelligence' },
        });
      }
    } catch {
      toast({ type: 'error', message: 'Something went wrong. Try again.' });
    }
  };

  // ── Compact mode (icon-only for pills/rows) ──
  if (compact) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`flex items-center justify-center transition-colors ${
          following
            ? 'text-purple-400 hover:text-red-400'
            : 'text-zinc-600 hover:text-purple-400'
        }`}
        title={following ? (hovering ? 'Unfollow' : followingLabel) : label}
      >
        {following ? (
          hovering ? <XIcon className="w-3.5 h-3.5" /> : <BookmarkFilledIcon className="w-3.5 h-3.5" />
        ) : (
          <BookmarkIcon className="w-3.5 h-3.5" />
        )}
      </button>
    );
  }

  // ── State 2: Following ──
  if (following) {
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
            Unfollow
          </>
        ) : (
          <>
            <BookmarkFilledIcon className="w-4 h-4" />
            {followingLabel} &#10003;
          </>
        )}
      </button>
    );
  }

  // ── State 1 & 3: Not following ──
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-colors"
    >
      <BookmarkIcon className="w-4 h-4" />
      {label}
    </button>
  );
}
