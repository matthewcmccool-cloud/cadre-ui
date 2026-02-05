'use client';

import Link from 'next/link';
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
  if (diffDays < 7) return `${diffDays}d ago`;

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

const toSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function JobTable({ jobs }: JobTableProps) {
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
          <tr className="border-b border-[#2A2A2A]">
            <th className="text-left py-3 px-2 text-sm font-medium text-[#E0E0E0]">DATE</th>
            <th className="text-left py-3 px-2 text-sm font-medium text-[#E0E0E0]">JOB TITLE</th>
            <th className="text-left py-3 px-2 text-sm font-medium text-[#E0E0E0]">COMPANY</th>
            <th className="text-left py-3 px-2 text-sm font-medium text-[#E0E0E0]">INDUSTRY</th>
            <th className="text-left py-3 px-2 text-sm font-medium text-[#E0E0E0]">INVESTORS</th>
            <th className="text-left py-3 px-2 text-sm font-medium text-[#E0E0E0]">LOCATION</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const companyDomain = getDomain(job.companyUrl);
            return (
              <tr key={job.id} className="border-b border-[#1A1A1A] hover:bg-[#1A1A1A] transition-colors">
                {/* DATE */}
                <td className="py-4 px-2">
                  <span className="text-sm text-[#A0A0A0]">{formatDate(job.datePosted)}</span>
                </td>

                {/* JOB TITLE - Links to job detail page */}
                <td className="py-4 px-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-sm font-medium text-[#F9F9F9] hover:text-[#60a5fa] hover:underline"
                  >
                    {job.title}
                  </Link>
                </td>

                {/* COMPANY - Links to company profile */}
                <td className="py-4 px-2">
                  <Link
                    href={`/companies/${toSlug(job.company)}`}
                    className="inline-flex items-center gap-2 group"
                  >
                    {companyDomain && (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${companyDomain}&sz=32`}
                        alt=""
                        className="w-5 h-5 rounded"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="text-sm font-medium text-[#F9F9F9] group-hover:text-[#60a5fa] group-hover:underline">
                      {job.company}
                    </span>
                  </Link>
                </td>

                {/* INDUSTRY - Links to industry profile */}
                <td className="py-4 px-2">
                  {job.industry && (
                    <Link
                      href={`/industry/${toSlug(job.industry)}`}
                      className="inline-flex px-2.5 py-1 rounded text-xs font-medium bg-[#3D2D4A] text-[#C4B5FD] hover:bg-[#4D3D5A] transition-colors"
                    >
                      {job.industry}
                    </Link>
                  )}
                </td>

                {/* INVESTORS - Each links to investor profile */}
                <td className="py-4 px-2">
                  <div className="flex flex-wrap gap-1">
                    {job.investors && job.investors.map((investor) => (
                      <Link
                        key={investor}
                        href={`/investors/${toSlug(investor)}`}
                        className="inline-flex px-2.5 py-1 rounded text-xs font-medium bg-[#2D3A2D] text-[#9AE6B4] hover:bg-[#3D4A3D] transition-colors"
                      >
                        {investor}
                      </Link>
                    ))}
                  </div>
                </td>

                {/* LOCATION */}
                <td className="py-4 px-2">
                  <span className="text-sm text-[#A0A0A0]">{job.location}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
