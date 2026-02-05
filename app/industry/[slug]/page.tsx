import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getIndustryBySlug, getJobs } from '@/lib/airtable';
import IndustryPageContent from '@/components/IndustryPageContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface IndustryPageProps {
  params: { slug: string };
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const industry = await getIndustryBySlug(params.slug);

  if (!industry) {
    notFound();
  }

  // Get jobs in this industry
  const jobsResult = await getJobs({ industry: industry.name });

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

        <IndustryPageContent industry={industry} jobs={jobsResult.jobs} />
      </div>
    </main>
  );
}
