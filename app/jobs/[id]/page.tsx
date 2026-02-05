import { getJobById } from '@/lib/airtable';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CompanyLogo from '@/components/CompanyLogo';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface JobDetailPageProps {
  params: { id: string };
}

function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

function decodeHtml(html: string): string {
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  let job;
  try {
    job = await getJobById(params.id);
  } catch (error) {
    notFound();
  }

  if (!job) {
    notFound();
  }

  const companyDomain = getDomain(job.companyUrl);

  return (
    <main className="min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-[#A0A0A0] hover:text-[#F9F9F9] transition-colors mb-8"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to jobs
        </Link>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {companyDomain && (
              <CompanyLogo
                src={`https://www.google.com/s2/favicons?domain=${companyDomain}&sz=64`}
                alt={job.company || ''}
                className="w-12 h-12 rounded-lg"
              />
            )}
            <span className="text-[#A0A0A0] text-lg font-medium">{job.company}</span>
          </div>
          <h1 className="text-3xl font-bold text-[#F9F9F9] mb-4">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {job.location && (
              <span className="inline-flex px-3 py-1 rounded-md text-sm font-medium bg-[#3A3A3A] text-[#A0A0A0]">
                {job.location}
              </span>
            )}
            {job.salary && (
              <span className="inline-flex px-3 py-1 rounded-md text-sm font-medium bg-[#3A3A3A] text-[#A0A0A0]">
                {job.salary}
              </span>
            )}
            {job.industry && (
              <Link href={`/industry/${job.industry.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}>
                <span className="inline-flex px-3 py-1 rounded-md text-sm font-medium bg-[#3D2D4A] text-[#C4B5FD] hover:opacity-80 cursor-pointer">
                  {job.industry}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Apply Button */}
        {job.applyUrl && (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#F9F9F9] text-[#0b0a0a] font-semibold rounded-lg hover:bg-[#E0E0E0] transition-colors mb-8"
          >
            Apply Now
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Job Description */}
        {job.description && (
          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-[#F9F9F9] mb-4">About the Role</h2>
            <div
              className="text-[#A0A0A0] leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-2 [&_strong]:text-[#F9F9F9] [&_b]:text-[#F9F9F9]"
              dangerouslySetInnerHTML={{ __html: decodeHtml(job.description || "") }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
