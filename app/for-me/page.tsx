import type { Metadata } from 'next';
import { getStats } from '@/lib/data';
import ForMePageContent from '@/components/ForMePageContent';

export const metadata: Metadata = {
  title: 'For Me | Cadre',
  description: 'Your personalized hiring hub. Track followed companies, investors, and open roles.',
  robots: { index: false },
};

export const revalidate = 3600;

export default async function ForMePage() {
  const stats = await getStats();

  return (
    <ForMePageContent
      stats={{
        companyCount: stats.companyCount,
        investorCount: stats.investorCount,
        jobCount: stats.jobCount,
      }}
    />
  );
}
