import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getIndustryBySlug, getJobs } from '@/lib/airtable';

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

        {/* Industry header */}
        <div className="mt-8 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">{industry.name}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
              {industry.jobCount} open positions
            </span>
            <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
              {industry.companies.length} companies
            </span>
          </div>
        </div>

        {/* Companies in this industry */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-[#888] uppercase tracking-wide mb-3">Companies</h2>
          {industry.companies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {industry.companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.slug}`}
                  className="px-3 py-1.5 bg-[#1a1a1b] hover:bg-[#252526] rounded text-sm text-[#e8e8e8] transition-colors"
                >
                  {company.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[#666] text-sm">No companies listed in this industry.</p>
          )}
        </section>

        {/* Open Positions */}
        <section>
          <h2 className="text-sm font-medium text-[#888] uppercase tracking-wide mb-3">Open Positions</h2>
          {jobsResult.jobs.length > 0 ? (
            <div className="space-y-1">
              {jobsResult.jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block px-4 py-3 bg-[#1a1a1b] hover:bg-[#252526] rounded-lg transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-white">{job.title}</h3>
                      <p className="text-xs text-[#888] mt-0.5">
                        {job.company} · {job.location || 'Remote'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[#666] text-sm">No open positions at this time.</p>
          )}
        </section>
      </div>
    </main>
  );
}
