import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJobs } from '@/lib/airtable';

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default async function IndustryPage({ params }: { params: { slug: string } }) {
  const { jobs } = await getJobs({});
  
  // Get all unique industries
  const allIndustries = [...new Set(jobs.map(j => j.industry).filter(Boolean))];
  const industry = allIndustries.find(ind => slugify(ind) === params.slug);
  
  if (!industry) notFound();
  
  // Get jobs in this industry
  const industryJobs = jobs.filter(j => j.industry === industry);
  
  // Get unique companies in this industry
  const companies = [...new Set(industryJobs.map(j => j.company))];
  
  return (
    <div className="min-h-screen bg-[#0b0a0a] text-white">
      <header className="border-b border-[#1a1a1a] px-6 py-4">
        <Link href="/" className="text-xl font-bold">Portco.Jobs</Link>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/" className="text-[#888] hover:text-white mb-6 inline-block">Back to jobs</Link>
        <div className="bg-[#111] border border-[#222] rounded-lg p-8 mt-4">
          <h1 className="text-3xl font-bold mb-2">{industry}</h1>
          <p className="text-[#888] mb-6">{companies.length} companies | {industryJobs.length} open jobs</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">Companies</h2>
          <div className="flex flex-wrap gap-2">
            {companies.map(company => (
              <Link
                key={company}
                href={`/companies/${slugify(company)}`}
                className="px-3 py-1 bg-[#1a1a1a] rounded-md hover:bg-[#222]"
              >
                {company}
              </Link>
            ))}
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Open Jobs ({industryJobs.length})</h2>
        <div className="space-y-3">
          {industryJobs.map(job => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#222]">
              <div className="font-medium">{job.title}</div>
              <div className="text-sm text-[#888]">{job.company} - {job.location}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
