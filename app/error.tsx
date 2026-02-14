'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-lg font-medium text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-[#888] mb-6">
          We couldn&apos;t load this page. This is usually temporary.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm text-[#555] hover:text-white transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
