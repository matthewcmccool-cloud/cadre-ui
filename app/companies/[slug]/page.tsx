import { getCompanyBySlug, getJobsByCompany } from '@/lib/airtable';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import CompanyPageContent from '@/components/CompanyPageContent';

export const revalidate = 3600;

interface CompanyPageProps {
  params: { slug: string };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const company = await getCompanyBySlug(params.slug);

  if (!company) {
    notFound();
  }

  const jobs = await getJobsByCompany(company.name);

  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <CompanyPageContent company={company} jobs={jobs} />
      </div>
    </main>
  );
}
