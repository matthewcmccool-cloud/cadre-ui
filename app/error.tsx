'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-2xl font-semibold text-white mb-2">Something went wrong</h1>
        <p className="text-[#999] text-sm mb-6">
          We hit an unexpected error loading this page.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
