import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-white mb-2">404</h1>
        <p className="text-[#888] text-sm mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="px-4 py-2 text-sm text-[#555] hover:text-white transition-colors"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
