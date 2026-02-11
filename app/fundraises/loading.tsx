export default function FundraisesLoading() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6">
        <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse mb-6" />
        {/* Filter pills skeleton */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-zinc-800 rounded-full animate-pulse" />
          ))}
        </div>
        {/* Card skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-zinc-800 animate-pulse w-full h-20" />
          ))}
        </div>
      </div>
    </main>
  );
}
