'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FundingRound {
  company: string;
  amount: string;
  roundType: string;
  leadInvestors: string[];
  sector: string;
  description: string;
  dateAnnounced: string;
  confidence: 'high' | 'medium' | 'low';
}

interface FundingRoundsFeedProps {
  /** Known company slugs from Cadre DB for auto-linking */
  companyNames: string[];
}

const ROUND_COLORS: Record<string, string> = {
  'Pre-Seed': 'bg-emerald-500/15 text-emerald-400',
  'Seed': 'bg-green-500/15 text-green-400',
  'Series A': 'bg-blue-500/15 text-blue-400',
  'Series B': 'bg-purple-500/15 text-purple-400',
  'Series C': 'bg-orange-500/15 text-orange-400',
  'Series D': 'bg-pink-500/15 text-pink-400',
  'Series E': 'bg-rose-500/15 text-rose-400',
  'Growth': 'bg-amber-500/15 text-amber-400',
};

const SECTOR_ICONS: Record<string, string> = {
  'AI & Machine Learning': '🤖',
  'Crypto': '⛓',
  'Fintech': '💳',
  'Defense & Aerospace': '🛡',
  'Enterprise Software': '☁️',
  'Consumer': '🛒',
  'Data Science & Analytics': '📊',
  'Healthcare': '🏥',
};

const CONFIDENCE_DOTS: Record<string, string> = {
  high: 'bg-green-400',
  medium: 'bg-yellow-400',
  low: 'bg-[#555]',
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function FundingRoundsFeed({ companyNames }: FundingRoundsFeedProps) {
  const [rounds, setRounds] = useState<FundingRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Build a lookup set of known company slugs for auto-linking
  const knownSlugs = new Set(companyNames.map(n => toSlug(n)));
  const knownNamesLower = new Map(companyNames.map(n => [n.toLowerCase(), n]));

  useEffect(() => {
    fetch('/api/funding-rounds?days=14')
      .then(r => r.json())
      .then(data => {
        if (data.rounds) {
          setRounds(data.rounds);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  // Find matching Cadre company page for a funding round
  function findCompanySlug(companyName: string): string | null {
    const slug = toSlug(companyName);
    if (knownSlugs.has(slug)) return slug;
    // Try fuzzy: check if any known company name is contained in the round company name
    const lower = companyName.toLowerCase();
    for (const [knownLower] of knownNamesLower) {
      if (lower === knownLower || lower.includes(knownLower) || knownLower.includes(lower)) {
        return toSlug(knownNamesLower.get(knownLower)!);
      }
    }
    return null;
  }

  if (error) return null; // Fail silently — homepage still works

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-[#888]">Recent Fundraises</h2>
          {loading && (
            <div className="w-3 h-3 rounded-full border-2 border-[#5e6ad2] border-t-transparent animate-spin" />
          )}
        </div>
        {!loading && rounds.length > 0 && (
          <span className="text-[10px] text-[#555]">
            Powered by AI · Updated every 6h
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#1a1a1b] rounded-lg p-3 animate-pulse">
              <div className="h-4 bg-[#252526] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#252526] rounded w-1/2 mb-2" />
              <div className="h-3 bg-[#252526] rounded w-full" />
            </div>
          ))}
        </div>
      ) : rounds.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {rounds.map((round, i) => {
            const companySlug = findCompanySlug(round.company);
            const roundColor = ROUND_COLORS[round.roundType] || 'bg-[#252526] text-[#888]';
            const sectorIcon = SECTOR_ICONS[round.sector] || '📊';
            const confDot = CONFIDENCE_DOTS[round.confidence];

            const card = (
              <div className="bg-[#1a1a1b] hover:bg-[#252526] rounded-lg p-3 transition-colors h-full">
                {/* Header: company + amount */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm" title={round.sector}>{sectorIcon}</span>
                    <span className="text-sm text-white font-medium truncate group-hover:text-[#5e6ad2] transition-colors">
                      {round.company}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#e8e8e8] whitespace-nowrap">
                    {round.amount}
                  </span>
                </div>

                {/* Round type + date */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${roundColor}`}>
                    {round.roundType}
                  </span>
                  <span className="text-[10px] text-[#555]">
                    {formatDate(round.dateAnnounced)}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full ${confDot}`} title={`${round.confidence} confidence`} />
                </div>

                {/* Description */}
                <p className="text-[11px] text-[#999] leading-relaxed line-clamp-2 mb-2">
                  {round.description}
                </p>

                {/* Investors */}
                <div className="flex items-center gap-1 flex-wrap">
                  {round.leadInvestors.slice(0, 3).map((inv, j) => (
                    <span key={j} className="px-1.5 py-0.5 rounded bg-[#252526] text-[10px] text-[#999]">
                      {inv}
                    </span>
                  ))}
                  {round.leadInvestors.length > 3 && (
                    <span className="text-[10px] text-[#555]">
                      +{round.leadInvestors.length - 3}
                    </span>
                  )}
                </div>

                {/* Cadre link indicator */}
                {companySlug && (
                  <div className="mt-2 pt-1.5 border-t border-[#252526]">
                    <span className="text-[10px] text-[#5e6ad2]">
                      View on Cadre →
                    </span>
                  </div>
                )}
              </div>
            );

            if (companySlug) {
              return (
                <Link key={i} href={`/companies/${companySlug}`} className="group">
                  {card}
                </Link>
              );
            }

            return <div key={i}>{card}</div>;
          })}
        </div>
      )}
    </section>
  );
}
