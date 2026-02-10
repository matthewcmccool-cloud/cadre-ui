'use client';

/**
 * Auto-scrolling investor logo ticker — TBPN-inspired.
 * Displays VC firm names in a continuous horizontal scroll.
 * Pure CSS animation, no JS needed for the scroll.
 */

interface InvestorTickerProps {
  investors: string[];
}

// Top-tier VCs to feature first (order matters)
const FEATURED_ORDER = [
  'a16z', 'Andreessen Horowitz', 'Sequoia', 'Sequoia Capital',
  'Benchmark', 'Accel', 'Index Ventures', 'Lightspeed',
  'Greylock', 'Bessemer', 'General Catalyst', 'Founders Fund',
  'Paradigm', 'Thrive Capital', 'Khosla', 'NEA',
  'Ribbit Capital', 'Tiger Global', 'Coatue', 'Lux Capital',
  'Insight Partners', 'GV', 'Y Combinator', 'First Round',
];

export default function InvestorTicker({ investors }: InvestorTickerProps) {
  if (investors.length === 0) return null;

  // Sort: featured VCs first, then alphabetical
  const featuredSet = new Set(FEATURED_ORDER.map(n => n.toLowerCase()));
  const sorted = [...investors].sort((a, b) => {
    const aFeat = featuredSet.has(a.toLowerCase());
    const bFeat = featuredSet.has(b.toLowerCase());
    if (aFeat && !bFeat) return -1;
    if (!aFeat && bFeat) return 1;
    return a.localeCompare(b);
  });

  // Take top ~40 for the ticker (enough to fill the scroll)
  const tickerItems = sorted.slice(0, 40);

  // Duplicate for seamless infinite scroll
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="mb-6 overflow-hidden">
      <div className="flex items-center gap-6 animate-ticker">
        {doubled.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="text-[11px] font-medium text-[#555] whitespace-nowrap uppercase tracking-wider hover:text-[#999] transition-colors shrink-0"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
