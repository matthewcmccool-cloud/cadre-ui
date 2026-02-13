import type { Metadata } from 'next';
import { getAllCompaniesForDirectory, getAllInvestorsForDirectory, getRecentJobsForDiscover, getStats } from '@/lib/data';
import DiscoverPageContent from '@/components/DiscoverPageContent';

export const metadata: Metadata = {
  title: 'Discover VC-Backed Companies, Jobs & Investors',
  description: 'Explore 1,300+ VC-backed companies, 200+ investors, and 16,000+ open roles.',
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app/discover' },
  openGraph: {
    title: 'Discover VC-Backed Companies, Jobs & Investors | Cadre',
    description: 'Explore 1,300+ VC-backed companies, 200+ investors, and 16,000+ open roles.',
    url: 'https://cadre-ui-psi.vercel.app/discover',
  },
};

// Use dynamic rendering to avoid Airtable rate limits during build-time SSG.
// Data is still cached at the fetch level via Next.js data cache.
export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const [companies, investors, jobsData, stats] = await Promise.all([
    getAllCompaniesForDirectory().catch((err) => {
      console.error('Failed to fetch companies for Discover:', err);
      return [];
    }),
    getAllInvestorsForDirectory().catch((err) => {
      console.error('Failed to fetch investors for Discover:', err);
      return [];
    }),
    getRecentJobsForDiscover().catch((err) => {
      console.error('Failed to fetch jobs for Discover:', err);
      return { jobs: [], totalCount: 0 };
    }),
    getStats().catch((err) => {
      console.error('Failed to fetch stats for Discover:', err);
      return { jobCount: 0, companyCount: 0, investorCount: 0 };
    }),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <DiscoverPageContent
          companies={companies}
          investors={investors}
          jobs={jobsData.jobs}
          jobsTotalCount={jobsData.totalCount}
          stats={stats}
        />
      </div>
    </main>
  );
}
