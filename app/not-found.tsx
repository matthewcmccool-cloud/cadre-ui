import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-white mb-2">404</h1>
        <p className="text-[#999] text-sm mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/discover"
            className="px-4 py-2 bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm font-medium rounded-lg transition-colors inline-block"
          >
            Browse jobs
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-[#1a1a1b] hover:bg-[#252526] text-[#999] hover:text-white text-sm font-medium rounded-lg transition-colors inline-block"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
