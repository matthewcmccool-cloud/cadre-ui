'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-lg font-medium text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-zinc-400 mb-6">
          We couldn&apos;t load this page. This is usually temporary.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
