'use client';

import Link from 'next/link';
import { CompanyTickerItem } from '@/lib/data';
import Favicon from '@/components/Favicon';

interface CompanyTickerProps {
  companies: CompanyTickerItem[];
}

// Well-known companies to feature first (order matters)
const FEATURED_ORDER = [
  'OpenAI', 'Anthropic', 'Stripe', 'SpaceX', 'Databricks',
  'Figma', 'Notion', 'Vercel', 'Scale AI', 'Anduril',
  'Rippling', 'Ramp', 'Brex', 'Plaid', 'Discord',
  'Instacart', 'Airtable', 'Webflow', 'Linear', 'Retool',
  'Vanta', 'Deel', 'Wiz', 'Snyk', 'Miro',
  'Dbt Labs', 'Cockroach Labs', 'HashiCorp', 'Supabase', 'Railway',
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default function CompanyTicker({ companies }: CompanyTickerProps) {
  if (companies.length === 0) return null;

  // Sort: featured companies first, then alphabetical
  const featuredLower = new Map(FEATURED_ORDER.map((n, i) => [n.toLowerCase(), i]));
  const sorted = [...companies].sort((a, b) => {
    const aIdx = featuredLower.get(a.name.toLowerCase());
    const bIdx = featuredLower.get(b.name.toLowerCase());
    if (aIdx !== undefined && bIdx === undefined) return -1;
    if (aIdx === undefined && bIdx !== undefined) return 1;
    if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
    return a.name.localeCompare(b.name);
  });

  // Show featured companies + a random sample of others (cap at ~80 total)
  const TICKER_CAP = 80;
  let tickerCompanies: CompanyTickerItem[];
  if (sorted.length <= TICKER_CAP) {
    tickerCompanies = sorted;
  } else {
    // Keep all featured, randomly sample the rest
    const featured = sorted.filter(c => featuredLower.has(c.name.toLowerCase()));
    const rest = sorted.filter(c => !featuredLower.has(c.name.toLowerCase()));
    // Deterministic-ish shuffle using index-based selection
    const sampleSize = TICKER_CAP - featured.length;
    const step = Math.max(1, Math.floor(rest.length / sampleSize));
    const sampled = rest.filter((_, i) => i % step === 0).slice(0, sampleSize);
    tickerCompanies = [...featured, ...sampled];
  }

  // Duplicate for seamless infinite scroll
  const doubled = [...tickerCompanies, ...tickerCompanies];

  // Scale animation duration: ~0.5s per company for readable scroll speed
  const duration = Math.max(30, tickerCompanies.length * 0.5);

  return (
    <div className="mb-5 overflow-hidden relative">
      {/* Fade masks on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0e0e0f] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0e0e0f] to-transparent z-10 pointer-events-none" />

      <div
        className="flex items-center gap-6 animate-ticker"
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((company, i) => {
          const domain = getDomain(company.url);
          return (
            <Link
              key={`${company.name}-${i}`}
              href={`/companies/${toSlug(company.name)}`}
              className="flex items-center gap-1.5 shrink-0 group"
            >
              {domain ? (
                <Favicon domain={domain} size={32} className="w-4 h-4 rounded-sm opacity-60 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-4 h-4 rounded-sm bg-[#252526] flex items-center justify-center text-[8px] font-bold text-[#555]">
                  {company.name.charAt(0)}
                </div>
              )}
              <span className="text-[11px] font-medium text-[#555] whitespace-nowrap uppercase tracking-wider group-hover:text-[#5e6ad2] transition-colors">
                {company.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
