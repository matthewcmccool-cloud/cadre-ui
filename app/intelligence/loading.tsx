import JobRowSkeleton from '@/components/JobRowSkeleton';

export default function FeedLoading() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Signal card skeleton */}
        <div className="max-w-2xl mb-6">
          <div className="bg-zinc-800 rounded-xl h-28 animate-pulse" />
        </div>
        {/* Summary skeleton */}
        <div className="h-5 w-72 bg-zinc-800 rounded animate-pulse mb-6" />
        {/* Feed cards */}
        <div className="space-y-3 max-w-2xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-zinc-800 animate-pulse w-full h-24" />
          ))}
        </div>
      </div>
    </main>
  );
}
