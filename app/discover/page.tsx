import type { Metadata } from 'next';
import { getAllCompaniesForDirectory } from '@/lib/data';
import CompanyDirectory from '@/components/CompanyDirectory';

export const metadata: Metadata = {
  title: 'Discover 1,300+ VC-Backed Companies & Their Open Roles',
  description: 'Explore 1,300+ VC-backed companies, 200+ investors, and 16,000+ open roles.',
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app/discover' },
  openGraph: {
    title: 'Discover 1,300+ VC-Backed Companies & Their Open Roles | Cadre',
    description: 'Explore 1,300+ VC-backed companies, 200+ investors, and 16,000+ open roles.',
    url: 'https://cadre-ui-psi.vercel.app/discover',
  },
};

// ISR: regenerate every 60 minutes
export const revalidate = 3600;

export default async function DiscoverPage() {
  const companies = await getAllCompaniesForDirectory();

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <CompanyDirectory companies={companies} />
      </div>
    </main>
  );
}
