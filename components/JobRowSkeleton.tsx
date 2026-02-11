export default function JobRowSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="rounded-lg border border-[#1a1a1b] divide-y divide-[#1a1a1b] overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#0e0e0f] animate-pulse">
          {/* Avatar placeholder */}
          <div className="w-7 h-7 rounded bg-[#1a1a1b] flex-shrink-0" />

          {/* Title + company placeholder */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-4 w-2/3 rounded bg-[#1a1a1b]" />
            <div className="h-3 w-1/3 rounded bg-[#1a1a1b]" />
          </div>

          {/* Function badge placeholder */}
          <div className="hidden md:block h-5 w-24 rounded bg-[#1a1a1b] flex-shrink-0" />

          {/* Salary placeholder */}
          <div className="hidden sm:block h-4 w-20 rounded bg-[#1a1a1b] flex-shrink-0" />

          {/* Investor placeholder */}
          <div className="hidden lg:block h-5 w-28 rounded bg-[#1a1a1b] flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
