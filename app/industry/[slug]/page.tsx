import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getIndustryBySlug, getJobs } from '@/lib/airtable';

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
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2"
        >
          <span>Back to jobs</span>
        </Link>

        {/* Industry header */}
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold mb-2">{industry.name}</h1>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
              {industry.jobCount} open positions
            </span>
            <span className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
              {industry.companies.length} companies
            </span>
          </div>
        </div>

        {/* Companies in this industry */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Companies</h2>
          {industry.companies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {industry.companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.slug}`}
                  className="px-4 py-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {company.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No companies listed in this industry.</p>
          )}
        </section>

        {/* Open Positions */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Open Positions</h2>
          {jobsResult.jobs.length > 0 ? (
            <div className="space-y-3">
              {jobsResult.jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-white">{job.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {job.company} - {job.location || 'Remote'}
                      </p>
                    </div>
                    {job.salary && (
                      <span className="text-sm text-gray-400">{job.salary}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No open positions at this time.</p>
          )}
        </section>
      </div>
    </main>
  );
}
