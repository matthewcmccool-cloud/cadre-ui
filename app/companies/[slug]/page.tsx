import { getCompanyBySlug, getJobsByCompany } from '@/lib/airtable';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CompanyLogo from '@/components/CompanyLogo';
import JobsList from '@/components/JobsList';
import Pagination from '@/components/Pagination';

interface CompanyPageProps {
  params: { slug: string };
    searchParams: { page?: string };
}

function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default async function CompanyPage({ params, searchParams }: CompanyPageProps) {
  const company = await getCompanyBySlug(params.slug);

  if (!company) {
    notFound();
  }

  const jobs = await getJobsByCompany(company.name);
  const companyDomain = getDomain(company.url);

    // Pagination
  const pageSize = 25;
  const currentPage = parseInt(searchParams.page || '1', 10);
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const paginatedJobs = jobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-[#0b0a0a]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-[#A0A0A0] hover:text-[#F9F9F9] transition-colors mb-8"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to jobs
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {companyDomain && (
              <CompanyLogo
                src={`https://www.google.com/s2/favicons?domain=${companyDomain}&sz=64`}
                alt={company.name}
                className="w-16 h-16 rounded-lg"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-[#F9F9F9]">{company.name}</h1>
              {company.url && (
                <a
                  href={company.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A0A0A0] hover:text-[#F9F9F9] text-sm"
                >
                  {companyDomain}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="inline-flex px-3 py-1 rounded-md text-sm font-medium bg-[#3A3A3A] text-[#A0A0A0]">
              {jobs.length} open position{jobs.length !== 1 ? 's' : ''}
            </span>
            {company.investors.length > 0 && (
              <span className="inline-flex px-3 py-1 rounded-md text-sm font-medium bg-[#3A3A3A] text-[#A0A0A0]">
                Backed by {company.investors.slice(0, 3).join(', ')}
                {company.investors.length > 3 && ` +${company.investors.length - 3} more`}
              </span>
            )}
          </div>

          {company.description && (
            <p className="text-[#A0A0A0] leading-relaxed mb-6">{company.description}</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#F9F9F9] mb-4">Open Positions</h2>
          <JobsList jobs={paginatedJobs} />

                    {/* Pagination */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <p className="text-sm text-[#A0A0A0]">
              Page {currentPage} of {totalPages}
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={{}} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
