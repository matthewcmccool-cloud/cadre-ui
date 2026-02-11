export function CompanyChipSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-full bg-zinc-800 animate-pulse h-8"
          style={{ width: `${100 + Math.floor(Math.random() * 60)}px` }}
        />
      ))}
    </div>
  );
}

export function FeedCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg bg-zinc-800 animate-pulse w-full h-24" />
      ))}
    </div>
  );
}

export function SparklineSkeleton() {
  return <div className="rounded bg-zinc-800 animate-pulse w-[120px] h-6" />;
}

export function StatSkeleton() {
  return <div className="rounded bg-zinc-800 animate-pulse w-12 h-8" />;
}
