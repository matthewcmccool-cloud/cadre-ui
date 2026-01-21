'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Job } from '@/lib/airtable';

interface JobTableProps {
  jobs: Job[];
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return diffDays + 'd ago';

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

const getDomain = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

const INDUSTRY_COLORS: Record<string, { bg: string; text: string }> = {
  'Enterprise Software': { bg: '#3D2D4A', text: '#C4B5FD' },
  'Healthcare': { bg: '#4A2D2D', text: '#FCA5A5' },
  'Fintech': { bg: '#2D4A4A', text: '#5EEAD4' },
  'Consumer': { bg: '#4A4A2D', text: '#FDE047' },
  'AI/ML': { bg: '#2D2D4A', text: '#A5B4FC' },
  'Developer Tools': { bg: '#4A3D2D', text: '#FDBA74' },
  'Security': { bg: '#3D4A2D', text: '#BEF264' },
  'E-commerce': { bg: '#4A2D4A', text: '#F0ABFC' },
  'Climate/Energy': { bg: '#2D4A3D', text: '#86EFAC' },
  'Education': { bg: '#3D3D4A', text: '#CBD5E1' },
  'Logistics': { bg: '#4A3A2D', text: '#FCD34D' },
  'Media/Entertainment': { bg: '#4A2D3A', text: '#FDA4AF' },
  'Real Estate': { bg: '#2D3A3A', text: '#99F6E4' },
  'Biotech': { bg: '#3A2D4A', text: '#D8B4FE' },
  'Hardware': { bg: '#3A3A2D', text: '#D9F99D' },
};
const DEFAULT_INDUSTRY_COLOR = { bg: '#3D2D4A', text: '#C4B5FD' };

export default function JobTable({ jobs }: JobTableProps) {
  const router = useRouter();

  const handleCompanyClick = (company: string) => {
    router.push('/?company=' + encodeURIComponent(company));
  };

  const handleInvestorClick = (investor: string) => {
    router.push('/?investor=' + encodeURIComponent(investor));
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#A0A0A0]">No jobs found matching your filters.</p>
        <p className="text-[#6B6B6B] text-sm mt-2">Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-[#3A3A3A]">
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">DATE</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">JOB TITLE</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">COMPANY</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">INDUSTRY</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">INVESTORS</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">LOCATION</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-[#3A3A3A] hover:bg-[#2D2D2D] transition-colors">
              <td className="py-4 px-4 text-sm text-[#A0A0A0]">
                {formatDate(job.datePosted)}
              </td>
              <td className="py-4 px-4">
                <Link
                  href={`/jobs/${job.id}`}
                  className="font-medium text-[#F9F9F9] hover:underline"
                >
                  {job.title}
                </Link>
              </td>
              <td className="py-4 px-4">
                <button
                  onClick={() => handleCompanyClick(job.company)}
                  className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-[#2D4A3E] text-[#6EE7B7] hover:opacity-80 cursor-pointer transition-opacity"
                >
                  {job.companyUrl && getDomain(job.companyUrl) && (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getDomain(job.companyUrl)}&sz=128`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      className="w-5 h-5 rounded mr-2"
                      alt=""
                    />
                  )}
                  {job.company}
                </button>
              </td>
              <td className="py-4 px-4">
                {job.industry ? (
                  <span
                    className="inline-flex px-2 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: INDUSTRY_COLORS[job.industry]?.bg || DEFAULT_INDUSTRY_COLOR.bg,
                      color: INDUSTRY_COLORS[job.industry]?.text || DEFAULT_INDUSTRY_COLOR.text,
                    }}
                  >
                    {job.industry}
                  </span>
                ) : (
                  <span className="text-[#6B6B6B]">-</span>
                )}
              </td>
              <td className="py-4 px-4">
                {job.investors.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {job.investors.slice(0, 4).map((inv, i) => (
                      <button
                        key={i}
                        onClick={() => handleInvestorClick(inv)}
                        className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-[#2D3A4A] text-[#7DD3FC] hover:opacity-80 cursor-pointer transition-opacity"
                      >
                        {inv}
                      </button>
                    ))}
                    {job.investors.length > 4 && (
                      <span className="inline-flex px-2 py-1 text-xs text-[#A0A0A0]">+{job.investors.length - 4}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[#6B6B6B]">-</span>
                )}
              </td>
              <td className="py-4 px-4">
                {job.location ? (
                  <span className="px-2 py-1 bg-[#3A3A3A] text-[#A0A0A0] rounded-md text-xs">
                    {job.remoteFirst ? `${job.location} (Remote)` : job.location}
                  </span>
                ) : (
                  job.remoteFirst ? (
                    <span className="px-2 py-1 bg-[#3A3A3A] text-[#A0A0A0] rounded-md text-xs">
                      Remote
                    </span>
                  ) : (
                    <span className="text-[#6B6B6B]">-</span>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
