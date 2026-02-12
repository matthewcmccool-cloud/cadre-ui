import type { Metadata } from 'next';
import { getStats } from '@/lib/data';
import IntelligencePageContent from '@/components/IntelligencePageContent';

export const metadata: Metadata = {
  title: 'Intelligence | Cadre',
  description: 'Your personalized hiring intelligence hub. Track followed companies, investors, and open roles.',
  robots: { index: false },
};

export const revalidate = 3600;

export default async function IntelligencePage() {
  const stats = await getStats();

  return (
    <IntelligencePageContent
      stats={{
        companyCount: stats.companyCount,
        investorCount: stats.investorCount,
        jobCount: stats.jobCount,
      }}
    />
  );
}
