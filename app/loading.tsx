import JobRowSkeleton from '@/components/JobRowSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6">
        {/* Skeleton tabs */}
        <div className="flex gap-4 mb-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-28 bg-[#1a1a1b] rounded-lg" />
          ))}
        </div>

        {/* Skeleton tagline */}
        <div className="mb-4 animate-pulse">
          <div className="h-4 w-80 bg-[#1a1a1b] rounded" />
        </div>

        {/* Skeleton filters */}
        <div className="flex gap-2 mb-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-[#1a1a1b] rounded-lg" />
          ))}
        </div>

        {/* Skeleton job rows */}
        <JobRowSkeleton count={10} />
      </div>
    </main>
  );
}
