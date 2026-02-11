import { getAllCompaniesForDirectory } from '@/lib/data';
import CompanyDirectory from '@/components/CompanyDirectory';
import type { Metadata } from 'next';

export const revalidate = 3600;

const BASE_URL = 'https://cadre-ui-psi.vercel.app';

export const metadata: Metadata = {
  title: 'Companies — Exceptional Technology Companies',
  description: 'Browse 1,300+ exceptional technology companies hiring now. Search by name, stage, or investor. Every company tracked on Cadre with direct links to open roles.',
  alternates: { canonical: `${BASE_URL}/companies` },
  openGraph: {
    title: 'Companies — Exceptional Technology Companies | Cadre',
    description: 'Browse 1,300+ exceptional technology companies hiring now. Search by name, stage, or investor.',
    url: `${BASE_URL}/companies`,
  },
  twitter: {
    title: 'Companies — Exceptional Technology Companies | Cadre',
    description: 'Browse 1,300+ exceptional technology companies hiring now.',
  },
};

export default async function CompaniesPage() {
  const companies = await getAllCompaniesForDirectory();

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Exceptional Technology Companies',
    description: `Browse ${companies.length.toLocaleString()} exceptional technology companies tracked on Cadre.`,
    url: `${BASE_URL}/companies`,
    numberOfItems: companies.length,
  };

  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <CompanyDirectory companies={companies} />
      </div>
    </main>
  );
}
