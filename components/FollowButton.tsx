'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { useToast } from '@/hooks/useToast';

interface FollowButtonProps {
  companyId: string;
  companyName: string;
}

export default function FollowButton({ companyId, companyName }: FollowButtonProps) {
  const { isSignedIn, openSignIn } = useAuth();
  const { isFollowing, follow, unfollow } = useFollows();
  const { toast } = useToast();
  const [hovering, setHovering] = useState(false);

  const following = isFollowing(companyId);

  const handleClick = async () => {
    if (!isSignedIn) {
      openSignIn({ companyName, companyId });
      return;
    }

    try {
      if (following) {
        await unfollow(companyId);
        toast({ type: 'success', message: `Unfollowed ${companyName}.` });
      } else {
        await follow(companyId);
        toast({ type: 'success', message: `Following ${companyName}. You'll see their activity in your feed.` });
      }
    } catch {
      toast({ type: 'error', message: 'Something went wrong. Try again.' });
    }
  };

  if (following) {
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
        {hovering ? 'Unfollow' : '★ Following ✓'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
    >
      ☆ Follow
    </button>
  );
}
