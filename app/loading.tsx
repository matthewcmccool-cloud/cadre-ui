export default function Loading() {
  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Skeleton hero */}
        <div className="mb-5">
          <div className="h-6 w-64 bg-[#1a1a1b] rounded animate-pulse" />
          <div className="h-4 w-96 bg-[#1a1a1b] rounded animate-pulse mt-2" />
        </div>

        {/* Skeleton filters */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-28 bg-[#1a1a1b] rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Skeleton job rows */}
        <div className="rounded-lg border border-[#1a1a1b] divide-y divide-[#1a1a1b] overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#0e0e0f]">
              <div className="w-7 h-7 rounded bg-[#1a1a1b] animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-48 bg-[#1a1a1b] rounded animate-pulse" />
                <div className="h-3 w-32 bg-[#1a1a1b] rounded animate-pulse mt-1.5" />
              </div>
              <div className="hidden md:block h-5 w-24 bg-[#1a1a1b] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
