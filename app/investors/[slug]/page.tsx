import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInvestorBySlug, getJobs } from '@/lib/airtable';
import InvestorPageContent from '@/components/InvestorPageContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface InvestorPageProps {
  params: { slug: string };
}

export default async function InvestorPage({ params }: InvestorPageProps) {
  const investor = await getInvestorBySlug(params.slug);

  if (!investor) {
    notFound();
  }

  // Get jobs from companies backed by this investor
  const jobsResult = await getJobs({ investor: investor.name });

  return (
    <main className="min-h-screen bg-[#0e0e0f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="text-[#888] hover:text-white text-sm inline-flex items-center gap-1 transition-colors"
        >
          ← Back to jobs
        </Link>

        <InvestorPageContent investor={investor} jobs={jobsResult.jobs} />
      </div>
    </main>
  );
}
