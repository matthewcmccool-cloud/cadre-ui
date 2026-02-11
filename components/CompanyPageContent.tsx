'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Job, toSlug } from '@/lib/data';
import Favicon from '@/components/Favicon';
import { trackViewCompany } from '@/lib/analytics';
import CompanyLogo from '@/components/CompanyLogo';
import FollowButton from '@/components/FollowButton';
import HiringActivity from '@/components/HiringActivity';

interface SimilarCompany {
  name: string;
  slug: string;
  url?: string;
  jobCount: number;
}

interface CompanyPageContentProps {
  company: {
    id: string;
    name: string;
    slug: string;
    url?: string;
    about?: string;
    stage?: string;
    size?: string;
    hqLocation?: string;
    totalRaised?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    industry?: string;
    investors: string[];
    jobCount: number;
  };
  jobs: Job[];
  similarCompanies?: SimilarCompany[];
}

const getDomain = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffDays <= 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CompanyPageContent({ company, jobs, similarCompanies = [] }: CompanyPageContentProps) {
  const [search, setSearch] = useState('');
  const companyDomain = getDomain(company.url);

  useEffect(() => {
    trackViewCompany(company.id);
  }, [company.id]);

  const filteredJobs = jobs.filter((job) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      (job.location && job.location.toLowerCase().includes(q)) ||
      (job.departmentName && job.departmentName.toLowerCase().includes(q))
    );
  });

  // Count new roles this week
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = jobs.filter(j => j.datePosted && new Date(j.datePosted).getTime() > oneWeekAgo).length;

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-zinc-600 mt-6">
        <Link href="/discover" className="text-zinc-500 hover:text-zinc-300 transition-colors">Discover</Link>
        <span>/</span>
        <Link href="/discover?view=companies" className="text-zinc-500 hover:text-zinc-300 transition-colors">Companies</Link>
        <span>/</span>
        <span className="text-zinc-400">{company.name}</span>
      </nav>

      {/* ── Top Section ── */}
      <div className="mt-6 mb-8">
        {/* Logo */}
        {companyDomain && (
          <div className="mb-4">
            <CompanyLogo
              src={`https://www.google.com/s2/favicons?domain=${companyDomain}&sz=64`}
              alt={company.name}
              className="w-12 h-12 rounded-lg"
            />
          </div>
        )}

        {/* Name + Follow */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{company.name}</h1>
          <FollowButton companyId={company.id} companyName={company.name} />
        </div>

        {/* Description */}
        {company.about && (
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-2xl">
            {company.about}
          </p>
        )}

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {company.industry && (
            <Link
              href={`/industry/${toSlug(company.industry)}`}
              className="bg-zinc-800 rounded-full px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {company.industry}
            </Link>
          )}
          {company.stage && (
            <span className="bg-zinc-800 rounded-full px-3 py-1 text-xs text-zinc-400">
              {company.stage}
            </span>
          )}
          {company.hqLocation && (
            <span className="bg-zinc-800 rounded-full px-3 py-1 text-xs text-zinc-400">
              {company.hqLocation}
            </span>
          )}
          {company.size && (
            <span className="bg-zinc-800 rounded-full px-3 py-1 text-xs text-zinc-400">
              {company.size}
            </span>
          )}
        </div>

        {/* External links */}
        {(company.url || company.linkedinUrl || company.twitterUrl) && (
          <div className="flex gap-3 mt-3">
            {company.url && (
              <a href={company.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Website ↗
              </a>
            )}
            {company.linkedinUrl && (
              <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                LinkedIn ↗
              </a>
            )}
            {company.twitterUrl && (
              <a href={company.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                X ↗
              </a>
            )}
          </div>
        )}

        {/* Backed by */}
        {company.investors.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-4">
            <span className="text-xs text-zinc-600">Backed by</span>
            {company.investors.slice(0, 4).map((inv) => (
              <Link
                key={inv}
                href={`/investors/${toSlug(inv)}`}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-zinc-300 transition-colors"
              >
                {inv}
              </Link>
            ))}
            {company.investors.length > 4 && (
              <span className="text-xs text-zinc-600">+{company.investors.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Hiring Activity ── */}
      <HiringActivity
        totalRoles={jobs.length}
        newThisWeek={newThisWeek}
        dailyData={[]}
      />

      {/* ── Open Roles ── */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-zinc-100">
            Open Roles
            <span className="ml-2 text-sm font-normal text-zinc-500">{filteredJobs.length}</span>
          </h2>
        </div>

        {/* Search */}
        {jobs.length > 5 && (
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter roles..."
              className="w-full pl-10 pr-10 py-2 bg-zinc-900 text-zinc-100 placeholder-zinc-500 rounded-lg text-sm border border-zinc-800 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Role list */}
        {filteredJobs.length > 0 ? (
          <div className="divide-y divide-zinc-800/50">
            {filteredJobs.map((job) => {
              const dateText = formatDate(job.datePosted);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-4 py-3 hover:bg-zinc-900/50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-100">{job.title}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                      {job.location && <span>{job.location}</span>}
                      {job.location && job.departmentName && <span>·</span>}
                      {job.departmentName && <span>{job.departmentName}</span>}
                    </div>
                  </div>
                  {dateText && (
                    <span className="text-xs text-zinc-600 shrink-0">{dateText}</span>
                  )}
                  <svg className="w-4 h-4 text-zinc-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm py-8 text-center">
            {search ? 'No roles match your search.' : 'No open roles at this time.'}
          </p>
        )}
      </section>

      {/* ── Similar Companies ── */}
      {similarCompanies.length > 0 && (
        <section className="mt-10 mb-8">
          <h2 className="text-lg font-medium text-zinc-100 mb-4">Similar Companies</h2>
          <div className="flex flex-wrap gap-2">
            {similarCompanies.map((sc) => {
              const domain = getDomain(sc.url);
              return (
                <Link
                  key={sc.slug}
                  href={`/companies/${sc.slug}`}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-800 transition-colors"
                >
                  {domain ? (
                    <Favicon domain={domain} size={32} className="w-4 h-4 rounded-sm" />
                  ) : (
                    <div className="w-4 h-4 rounded-sm bg-zinc-700 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                      {sc.name.charAt(0)}
                    </div>
                  )}
                  <span>{sc.name}</span>
                  {sc.jobCount > 0 && (
                    <span className="text-xs text-zinc-500">{sc.jobCount} roles</span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
