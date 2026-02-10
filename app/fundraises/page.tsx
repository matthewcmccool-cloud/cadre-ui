import { getFilterOptions } from '@/lib/airtable';
import FundingRoundsFeed from '@/components/FundingRoundsFeed';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Recent Fundraises | Cadre — VC-Backed Startup Funding',
  description: 'Track the latest funding rounds across VC-backed startups. AI-powered, updated every 6 hours.',
};

export default async function FundraisesPage() {
  const filterOptions = await getFilterOptions();

  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="mt-8 mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Fundraises</h1>
          <p className="text-sm text-[#888] mt-1">
            Recent funding rounds across VC-backed startups. AI-powered, updated every 6 hours.
          </p>
        </div>

        <FundingRoundsFeed companyNames={filterOptions.companies} />
      </div>
    </main>
  );
}
