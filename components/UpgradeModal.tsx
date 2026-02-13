'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { trackUpgradePromptShown, trackUpgradePromptClicked } from '@/lib/analytics';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      trackUpgradePromptShown();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-sm mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-zinc-100 mb-2">
          You&apos;ve hit your free limit
        </h2>

        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          Free accounts can save up to 3 jobs, 3 companies, and 3 investors.
          Upgrade to Pro for unlimited saves, personalized alerts, and full hiring intelligence.
        </p>

        <Link
          href="/pricing"
          onClick={() => trackUpgradePromptClicked()}
          className="block w-full px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold transition-colors"
        >
          Upgrade to Pro &mdash; $15/month
        </Link>

        <p className="text-xs text-zinc-500 mt-3">
          Start with a 14-day free trial
        </p>

        <button
          onClick={onClose}
          className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
