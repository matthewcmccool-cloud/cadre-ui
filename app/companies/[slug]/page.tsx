import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJobs } from '@/lib/airtable';

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const { jobs } = await getJobs({});
  const companyJobs = jobs.filter(job => slugify(job.company) === params.slug);
  
  if (companyJobs.length === 0) notFound();
  
  const company = companyJobs[0].company;
  const companyUrl = companyJobs[0].companyUrl;
  const investors = [...new Set(companyJobs.flatMap(j => j.investors))];
  const industry = companyJobs[0].industry;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-[#1a1a1a] px-6 py-4">
        <Link href="/" className="text-xl font-bold">Portco.Jobs</Link>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/" className="text-[#888] hover:text-white mb-6 inline-block">Back to jobs</Link>
        <div className="bg-[#111] border border-[#222] rounded-lg p-8 mt-4">
          <h1 className="text-3xl font-bold mb-2">{company}</h1>
          {companyUrl && <a href={companyUrl} target="_blank" className="text-blue-400 hover:underline">{companyUrl}</a>}
          
          <div className="flex flex-wrap gap-2 my-6">
            {industry && <Link href={`/industry/${slugify(industry)}`} className="px-3 py-1 bg-[#3D2D4A] text-[#C4B5FD] rounded-md text-sm">{industry}</Link>}
            {investors.map(inv => <Link key={inv} href={`/investors/${slugify(inv)}`} className="px-3 py-1 bg-[#4A3D2D] text-[#FCD34D] rounded-md text-sm">{inv}</Link>)}
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Open Jobs ({companyJobs.length})</h2>
          <div className="space-y-3">
            {companyJobs.map(job => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#222]">
                <div className="font-medium">{job.title}</div>
                <div className="text-sm text-[#888]">{job.location}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
