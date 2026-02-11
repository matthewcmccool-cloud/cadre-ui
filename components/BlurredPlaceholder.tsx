'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface BlurredPlaceholderProps {
  prompt: string;
  children?: ReactNode;
}

export default function BlurredPlaceholder({ prompt, children }: BlurredPlaceholderProps) {
  // Split prompt at → to separate text from CTA
  const parts = prompt.split('→').map(s => s.trim());
  const text = parts[0];
  const cta = parts.length > 1 ? parts[1] : null;

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="select-none pointer-events-none" style={{ filter: 'blur(6px)' }}>
        {children || (
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800 rounded-lg p-4 h-32">
                <div className="h-3 w-24 bg-zinc-700 rounded mb-2" />
                <div className="h-6 w-16 bg-zinc-700 rounded" />
              </div>
              <div className="bg-zinc-800 rounded-lg p-4 h-32">
                <div className="h-3 w-20 bg-zinc-700 rounded mb-2" />
                <div className="h-6 w-12 bg-zinc-700 rounded" />
              </div>
            </div>
            <div className="mt-4 bg-zinc-800 rounded-lg p-4 h-48">
              <div className="h-3 w-32 bg-zinc-700 rounded mb-3" />
              <div className="h-full w-full bg-zinc-700/30 rounded" />
            </div>
          </div>
        )}
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/80 rounded-xl" />
      {/* CTA overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-sm text-zinc-400">
          {text}
          {cta && (
            <>
              {' → '}
              <Link href="/pricing" className="text-purple-400 hover:text-purple-300 transition-colors">
                {cta}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
