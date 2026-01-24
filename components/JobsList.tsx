'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Job } from '@/lib/airtable';

interface JobsListProps {
  jobs: Job[];
  pageSize?: number;
}

export default function JobsList({ jobs, pageSize = 25 }: JobsListProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  
  const displayedJobs = jobs.slice(0, visibleCount);
  const hasMore = visibleCount < jobs.length;

  if (jobs.length === 0) {
    return <p className="text-[#A0A0A0]">No open positions at this time.</p>;
  }

  return (
    <>
      <div className="space-y-4">
        {displayedJobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="block p-4 bg-[#1A1A1A] rounded-lg hover:bg-[#252525] transition-colors"
          >
            <h3 className="text-lg font-medium text-[#F9F9F9] mb-2">{job.title}</h3>
            <div className="flex flex-wrap gap-2">
              {job.location && (
                <span className="text-sm text-[#A0A0A0]">{job.location}</span>
              )}
              {job.salary && (
                <span className="text-sm text-[#A0A0A0]">| {job.salary}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
      
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setVisibleCount(prev => prev + pageSize)}
            className="px-6 py-2 bg-[#3A3A3A] text-[#F9F9F9] rounded-lg hover:bg-[#4A4A4A] transition-colors"
          >
            Load more ({jobs.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </>
  );
}
