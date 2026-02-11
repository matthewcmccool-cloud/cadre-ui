export default function JobDetailLoading() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>

        {/* Title + Company */}
        <div className="h-8 w-3/4 bg-zinc-800 rounded animate-pulse mb-3" />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-zinc-800 rounded animate-pulse" />
          <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="h-7 w-24 bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-7 w-20 bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-7 w-28 bg-zinc-800 rounded-full animate-pulse" />
        </div>

        {/* Apply button */}
        <div className="h-10 w-32 bg-zinc-800 rounded-lg animate-pulse mb-10" />

        {/* Description skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-4 bg-zinc-800/60 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    </main>
  );
}
