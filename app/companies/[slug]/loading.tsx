export default function CompanyDetailLoading() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>

        {/* Header: logo + name + stage */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-zinc-800 rounded-lg animate-pulse" />
          <div>
            <div className="h-7 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>

        {/* About */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
          <div className="h-5 w-16 bg-zinc-800 rounded animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-zinc-800/60 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-zinc-800/60 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-zinc-800/60 rounded animate-pulse" />
          </div>
        </div>

        {/* Investor badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-28 bg-zinc-800 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Jobs list skeleton */}
        <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <div className="h-5 w-3/5 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="flex gap-3">
                <div className="h-4 w-24 bg-zinc-800/60 rounded animate-pulse" />
                <div className="h-4 w-20 bg-zinc-800/60 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
