import type { Metadata } from 'next';
import { getFundraises, getFilterOptions } from '@/lib/data';
import FundraisesPageContent from '@/components/FundraisesPageContent';

export const metadata: Metadata = {
  title: 'Latest Venture Capital Fundraises & Who\'s Hiring',
  description: 'Track the latest funding rounds across the venture ecosystem. See who raised, who led, and who is hiring.',
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app/fundraises' },
  openGraph: {
    title: 'Latest Venture Capital Fundraises & Who\'s Hiring | Cadre',
    description: 'Track the latest funding rounds across the venture ecosystem.',
    url: 'https://cadre-ui-psi.vercel.app/fundraises',
  },
};

export const revalidate = 3600;

export default async function FundraisesPage() {
  const [fundraises, filterOptions] = await Promise.all([
    getFundraises(),
    getFilterOptions(),
  ]);

  const industries = [...filterOptions.industries].sort();

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <FundraisesPageContent fundraises={fundraises} industries={industries} />
      </div>
    </main>
  );
}
