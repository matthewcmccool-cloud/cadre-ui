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
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">FUNCTION</th>
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
                  href={job.applyUrl || job.jobUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
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
                  {job.company}
                </button>
              </td>
              <td className="py-4 px-4">
                {job.industry ? (
                  <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-[#3D2D4A] text-[#C4B5FD]">
                    {job.industry}
                  </span>
                ) : (
                  <span className="text-[#6B6B6B]">-</span>
                )}
              </td>
              <td className="py-4 px-4">
                {job.functionName ? (
                  <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-[#4A2D3D] text-[#F9A8D4]">
                    {job.functionName}
                  </span>
                ) : (
                  <span className="text-[#6B6B6B]">-</span>
                )}
              </td>
              
              <td className="py-4 px-4">
                {job.investors.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {job.investors.slice(0, 2).map((inv, i) => (
                      <button
                        key={i}
                        onClick={() => handleInvestorClick(inv)}
                        className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-[#4A3D2D] text-[#FCD34D] hover:opacity-80 cursor-pointer transition-opacity"
                      >
                        {inv}
                      </button>
                    ))}
                    {job.investors.length > 2 && (
                      <span className="inline-flex px-2 py-1 text-xs text-[#A0A0A0]">+{job.investors.length - 2}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[#6B6B6B]">-</span>
                )}
              </td>
              <td className="py-4 px-4">
                {job.location ? (
                  <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-[#2D3A4A] text-[#7DD3FC]">
                    {job.remoteFirst ? `${job.location} (Remote)` : job.location}
                  </span>
                ) : (
                  job.remoteFirst ? (
                    <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-[#2D3A4A] text-[#7DD3FC]">
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
