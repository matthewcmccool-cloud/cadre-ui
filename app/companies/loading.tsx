import { CompanyChipSkeleton } from '@/components/Skeletons';

export default function CompaniesLoading() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="h-5 w-64 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="h-10 w-full bg-zinc-800 rounded-lg animate-pulse mb-4" />
        <CompanyChipSkeleton count={12} />
      </div>
    </main>
  );
}
