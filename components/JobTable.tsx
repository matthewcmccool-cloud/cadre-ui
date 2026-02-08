'use client';

import Link from 'next/link';
import { Job } from '@/lib/airtable';

interface JobTableProps {
  jobs: Job[];
}

function formatDate(dateString: string): { text: string; isNew: boolean } {
  if (!dateString) return { text: '', isNew: false };
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return { text: 'New', isNew: true };
  if (diffDays < 7) return { text: `${diffDays}d`, isNew: false };
  if (diffDays < 30) return { text: `${Math.floor(diffDays / 7)}w`, isNew: false };
  return { text: `${Math.floor(diffDays / 30)}mo`, isNew: false };
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

function formatSalary(salary: string): string {
  if (!salary) return '';
  if (salary.length < 20) return salary;
  const match = salary.match(/(\d[\d,]+)\s*-\s*(\d[\d,]+)/);
  if (match) {
    const low = parseInt(match[1].replace(/,/g, ''), 10);
    const high = parseInt(match[2].replace(/,/g, ''), 10);
    if (low >= 1000 && high >= 1000) {
      return `$${Math.round(low / 1000)}K - $${Math.round(high / 1000)}K`;
    }
  }
  return salary.length > 25 ? salary.substring(0, 22) + '...' : salary;
}

const FUNCTION_COLORS: Record<string, string> = {
  'Engineering': 'text-blue-400 border-blue-400/30',
  'Product Management': 'text-purple-400 border-purple-400/30',
  'Product Design / UX': 'text-pink-400 border-pink-400/30',
  'Sales': 'text-orange-400 border-orange-400/30',
  'Marketing': 'text-yellow-400 border-yellow-400/30',
  'AI & Research': 'text-cyan-400 border-cyan-400/30',
  'Customer Success': 'text-teal-400 border-teal-400/30',
  'People': 'text-rose-400 border-rose-400/30',
  'Finance & Accounting': 'text-emerald-400 border-emerald-400/30',
  'Business Operations': 'text-amber-400 border-amber-400/30',
  'BD & Partnerships': 'text-orange-300 border-orange-300/30',
  'Legal': 'text-slate-400 border-slate-400/30',
  'Solutions Engineering': 'text-indigo-400 border-indigo-400/30',
  'Developer Relations': 'text-violet-400 border-violet-400/30',
  'Revenue Operations': 'text-lime-400 border-lime-400/30',
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
        const { text: dateText, isNew } = formatDate(job.datePosted);
        const salary = formatSalary(job.salary);
        const fnStyle = FUNCTION_COLORS[job.functionName] || 'text-[#888] border-[#333]';

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
                {dateText && (
                  isNew ? (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500/15 text-green-400">
                      New
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-[#555]">{dateText}</span>
                  )
                )}
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
                    <span className="text-xs text-[#666] truncate">{job.location}</span>
                  </>
                )}
              </div>
            </div>

            {/* Function Badge */}
            <div className="hidden md:flex items-center flex-shrink-0">
              {job.functionName && (
                <span className={`px-2 py-0.5 rounded text-[11px] border ${fnStyle} truncate max-w-[140px]`}>
                  {job.functionName}
                </span>
              )}
            </div>

            {/* Salary */}
            <div className="hidden sm:flex items-center flex-shrink-0 w-36 justify-end">
              {salary && (
                <span className="text-xs text-green-400/80 font-medium">{salary}</span>
              )}
            </div>

            {/* Investors (compact) */}
            <div className="hidden lg:flex items-center gap-1 flex-shrink-0 justify-end w-40">
              {job.investors && job.investors.slice(0, 1).map((investor) => (
                <Link
                  key={investor}
                  href={`/investors/${toSlug(investor)}`}
                  className="px-2 py-0.5 rounded text-xs bg-[#1a1a1b] text-[#666] hover:bg-[#252526] hover:text-[#e8e8e8] transition-colors truncate max-w-[110px]"
                >
                  {investor}
                </Link>
              ))}
              {job.investors && job.investors.length > 1 && (
                <span className="px-1 py-0.5 rounded text-[11px] text-[#555]">
                  +{job.investors.length - 1}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
