import { CompanyChipSkeleton } from '@/components/Skeletons';

export default function DiscoverLoading() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        {/* View switcher skeleton */}
        <div className="mb-6 flex gap-2">
          <div className="h-9 w-28 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="h-9 w-28 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="h-9 w-28 rounded-lg bg-zinc-800 animate-pulse" />
        </div>

        {/* Search skeleton */}
        <div className="h-10 w-full rounded-lg bg-zinc-800 animate-pulse mb-4" />

        {/* Company chips */}
        <CompanyChipSkeleton count={12} />
      </div>
    </main>
  );
}
