export default function IndustryDetailLoading() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-28 bg-zinc-800 rounded animate-pulse" />
        </div>

        {/* Header */}
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-zinc-800/60 rounded animate-pulse mb-8" />

        {/* Stats */}
        <div className="flex gap-6 mb-8">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 w-40">
            <div className="h-7 w-12 bg-zinc-800 rounded animate-pulse mb-1" />
            <div className="h-4 w-20 bg-zinc-800/60 rounded animate-pulse" />
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 w-40">
            <div className="h-7 w-16 bg-zinc-800 rounded animate-pulse mb-1" />
            <div className="h-4 w-24 bg-zinc-800/60 rounded animate-pulse" />
          </div>
        </div>

        {/* Companies grid */}
        <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded animate-pulse" />
              <div>
                <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse mb-1" />
                <div className="h-3 w-20 bg-zinc-800/60 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
