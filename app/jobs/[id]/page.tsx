import { getJobById, toSlug } from '@/lib/airtable';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import CompanyLogo from '@/components/CompanyLogo';


export const revalidate = 3600;

interface JobDetailPageProps {
  params: { id: string };
}

// Extract Airtable record ID from slug like "staff-engineer-replit-rec149XolDMws2Zck"
function extractRecordId(slug: string): string {
  // Match Airtable record ID pattern at the end
  const match = slug.match(/(rec[A-Za-z0-9]{10,})$/);
  if (match) return match[1];
  // Fallback: treat the whole thing as a record ID (backward compat)
  return slug;
}

// Deduplicate getJobById between generateMetadata and page component
const getCachedJob = cache(async (id: string) => {
  try {
    return await getJobById(extractRecordId(id));
  } catch {
    return null;
  }
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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

// Convert plain text job descriptions into structured HTML.
// ATS feeds return a mix of rich HTML and plain text with \n line breaks.
// This detects which format it is and processes plain text into proper HTML
// with headings, bullet lists, and paragraphs.
function formatDescription(raw: string): string {
  const decoded = decodeHtml(raw);

  // If content already has meaningful HTML structure, just return it
  if (/<(p|ul|ol|h[1-6]|div|section|table)\b/i.test(decoded)) {
    return decoded;
  }

  // Plain text — convert to structured HTML
  const lines = decoded.split('\n');
  let result = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      continue;
    }

    // Detect bullet points (- or • or – prefixed)
    if (/^[-•–]\s+/.test(trimmed)) {
      if (!inList) {
        result += '<ul>';
        inList = true;
      }
      result += `<li>${trimmed.replace(/^[-•–]\s+/, '')}</li>`;
      continue;
    }

    // Close list if we hit a non-bullet line
    if (inList) {
      result += '</ul>';
      inList = false;
    }

    // Detect ALL CAPS section headers (3+ chars, mostly uppercase)
    if (/^[A-Z][A-Z\s&:,/()\-–]{2,}$/.test(trimmed) && trimmed.length <= 80) {
      result += `<h3>${trimmed}</h3>`;
      continue;
    }

    // Regular paragraph
    result += `<p>${trimmed}</p>`;
  }

  if (inList) {
    result += '</ul>';
  }

  return result;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const job = await getCachedJob(params.id);
  if (!job) return {};

  const title = `${job.title} at ${job.company} | Cadre`;
  const description = job.description
    ? stripHtml(job.description).slice(0, 160)
    : `${job.title} at ${job.company}. Find jobs at VC-backed companies on Cadre.`;

  const url = `https://cadre-ui-psi.vercel.app/jobs/${encodeURIComponent(params.id)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'website', siteName: 'Cadre', url },
    twitter: { card: 'summary', title, description },
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const job = await getCachedJob(params.id);

  if (!job) {
    notFound();
  }

  const companyDomain = getDomain(job.companyUrl);

  // JobPosting JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description ? stripHtml(job.description) : `${job.title} at ${job.company}`,
    ...(job.datePosted && { datePosted: job.datePosted }),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      ...(job.companyUrl && { sameAs: job.companyUrl }),
    },
    ...(job.location && {
      jobLocation: {
        '@type': 'Place',
        address: job.location,
      },
    }),
    ...(job.salary && { baseSalary: job.salary }),
    ...(job.applyUrl && { directApply: job.applyUrl }),
  };

  return (
    <main className="min-h-screen bg-[#0e0e0f] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-[#555]">
          <Link href="/" className="text-[#888] hover:text-white transition-colors">Jobs</Link>
          <span>/</span>
          <Link href={`/companies/${toSlug(job.company)}`} className="text-[#888] hover:text-white transition-colors">{job.company}</Link>
          <span>/</span>
          <span className="text-[#999] truncate max-w-[200px]">{job.title}</span>
        </nav>

        {/* Job header */}
        <div className="mt-8 mb-6">
          <div className="flex items-center gap-4 mb-3">
            {companyDomain && (
              <CompanyLogo
                src={`https://www.google.com/s2/favicons?domain=${companyDomain}&sz=64`}
                alt={job.company || ''}
                className="w-12 h-12 rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
              <Link
                href={`/companies/${toSlug(job.company)}`}
                className="text-sm text-[#888] hover:text-[#e8e8e8] transition-colors"
              >
                {job.company}
              </Link>
            </div>
          </div>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {job.location && (
              <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
                {job.location}
              </span>
            )}
            {job.functionName && (
              <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
                {job.functionName}
              </span>
            )}
            {job.industry && (
              <Link href={`/industry/${toSlug(job.industry)}`}>
                <span className="px-2.5 py-1 bg-[#5e6ad2]/15 rounded text-xs text-[#5e6ad2] hover:bg-[#5e6ad2]/25 transition-colors">
                  {job.industry}
                </span>
              </Link>
            )}
            {job.salary && (
              <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
                {job.salary}
              </span>
            )}
            {job.datePosted && (
              <span className="px-2.5 py-1 bg-[#252526] rounded text-xs text-[#888]">
                Posted {formatDate(job.datePosted)}
              </span>
            )}
          </div>

          {/* Investors */}
          {job.investors.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 max-w-full overflow-hidden">
              <span className="text-xs text-[#999]">Backed by</span>
              {job.investors.map((inv) => (
                <Link key={inv} href={`/investors/${toSlug(inv)}`}>
                  <span className="px-2.5 py-1 bg-[#1a1a1b] hover:bg-[#252526] rounded text-xs text-[#e8e8e8] transition-colors">
                    {inv}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Apply button */}
        {job.applyUrl && (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm font-medium rounded-lg transition-colors mb-8"
          >
            Apply Now
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Job description */}
        {job.description && stripHtml(job.description).trim().length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-[#888] uppercase tracking-wide mb-4">About the Role</h2>
            <div
              className="job-description text-sm text-[#999] max-w-3xl"
              dangerouslySetInnerHTML={{ __html: formatDescription(job.description || "") }}
            />
          </section>
        )}

        {/* Bottom apply CTA */}
        {job.applyUrl && job.description && stripHtml(job.description).trim().length > 0 && (
          <div className="mt-10 pt-6 border-t border-[#1a1a1b]">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Apply for this role
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
