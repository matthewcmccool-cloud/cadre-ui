import { getAllInvestorsForDirectory } from '@/lib/data';
import InvestorDirectory from '@/components/InvestorDirectory';
import type { Metadata } from 'next';

export const revalidate = 3600;

const BASE_URL = 'https://cadre-ui-psi.vercel.app';

export const metadata: Metadata = {
  title: 'Investors — VC Firms & Portfolio Jobs',
  description: 'Browse 200+ VC firms tracked on Cadre. See portfolio companies and open roles for a16z, Sequoia, Benchmark, and more.',
  alternates: { canonical: `${BASE_URL}/investors` },
  openGraph: {
    title: 'Investors — VC Firms & Portfolio Jobs | Cadre',
    description: 'Browse 200+ VC firms tracked on Cadre. See portfolio companies and open roles.',
    url: `${BASE_URL}/investors`,
  },
  twitter: {
    title: 'Investors — VC Firms & Portfolio Jobs | Cadre',
    description: 'Browse 200+ VC firms tracked on Cadre. See portfolio companies and open roles.',
  },
};

export default async function InvestorsPage() {
  const investors = await getAllInvestorsForDirectory();

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'VC Firms Tracked on Cadre',
    description: `Browse ${investors.length} VC firms and their portfolio company job listings.`,
    url: `${BASE_URL}/investors`,
    numberOfItems: investors.length,
  };

  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <InvestorDirectory investors={investors} />
      </div>
    </main>
  );
}
