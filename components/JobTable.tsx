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
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return `${Math.floor(diffDays / 30)}mo`;
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
        <p className="text-[#888]">No jobs found matching your filters.</p>
        <p className="text-[#666] text-sm mt-1">Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {jobs.map((job, index) => {
        const companyDomain = getDomain(job.companyUrl);
        return (
          <div
            key={job.id}
            className={`group flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-[#1a1a1b] transition-colors ${
              index % 2 === 0 ? 'bg-transparent' : 'bg-[#0e0e0f]'
            }`}
          >
            {/* Company Logo */}
            <div className="flex-shrink-0">
              {companyDomain ? (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${companyDomain}&sz=32`}
                  alt=""
                  className="w-8 h-8 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded bg-[#252526]" />
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-sm font-medium text-white hover:text-[#5e6ad2] truncate transition-colors"
                >
                  {job.title}
                </Link>
                <span className="text-xs text-[#666]">{formatDate(job.datePosted)}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Link
                  href={`/companies/${toSlug(job.company)}`}
                  className="text-xs text-[#888] hover:text-[#e8e8e8] transition-colors"
                >
                  {job.company}
                </Link>
                {job.location && (
                  <>
                    <span className="text-[#444]">·</span>
                    <span className="text-xs text-[#666]">{job.location}</span>
                  </>
                )}
              </div>
            </div>

            {/* Industry Column */}
            <div className="hidden sm:flex items-center flex-shrink-0">
              {job.industry && (
                <Link
                  href={`/industry/${toSlug(job.industry)}`}
                  className="px-2.5 py-0.5 rounded-full text-xs border border-[#333] text-[#999] hover:border-[#555] hover:text-[#e8e8e8] transition-colors truncate max-w-[160px]"
                >
                  {job.industry}
                </Link>
              )}
            </div>

            {/* Investors Column */}
            <div className="hidden sm:flex items-center gap-1 flex-shrink-0 justify-start ml-4">
              {job.investors && job.investors.slice(0, 2).map((investor) => (
                <Link
                  key={investor}
                  href={`/investors/${toSlug(investor)}`}
                  className="px-2 py-0.5 rounded text-xs bg-[#1a1a1b] text-[#666] hover:bg-[#252526] hover:text-[#e8e8e8] transition-colors truncate max-w-[120px]"
                >
                  {investor}
                </Link>
              ))}
              {job.investors && job.investors.length > 2 && (
                <span className="px-1.5 py-0.5 rounded text-xs text-[#555]">
                  +{job.investors.length - 2}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
