import { NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Cache for 6 hours — funding rounds don't change by the minute
export const revalidate = 21600;

export interface FundingRound {
  company: string;
  amount: string;
  roundType: string;
  leadInvestors: string[];
  sector: string;
  description: string;
  dateAnnounced: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * GET /api/funding-rounds
 *
 * Uses Perplexity Sonar to find recent VC funding rounds in tech/AI/crypto.
 * Returns structured, quality-filtered results.
 *
 * Query params:
 *   days=7 (lookback window, default 7)
 *   sector=ai|crypto|defense|all (default: all)
 */
export async function GET(request: Request) {
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: 'Perplexity API key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7', 10);
  const sector = searchParams.get('sector') || 'all';

  try {
    const rounds = await fetchFundingRounds(days, sector);
    return NextResponse.json({
      rounds,
      count: rounds.length,
      period: `${days}d`,
      sector,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Funding rounds fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch funding rounds' }, { status: 500 });
  }
}

async function fetchFundingRounds(days: number, sector: string): Promise<FundingRound[]> {
  const sectorFilter = sector === 'ai'
    ? 'AI, machine learning, and deep tech'
    : sector === 'crypto'
    ? 'crypto, blockchain, and web3'
    : sector === 'defense'
    ? 'defense, aerospace, and American Dynamism'
    : 'technology, AI, crypto, defense, aerospace, fintech, healthtech, enterprise software, consumer tech, and SaaS';

  const prompt = `List the most notable venture capital funding rounds announced in the last ${days} days for ${sectorFilter} startups.

For each round, provide:
- company_name: the company that raised
- amount: the amount raised (e.g. "$30M")
- round_type: Seed, Series A, Series B, Series C, Series D, Growth, etc.
- lead_investors: array of lead investor names
- sector: primary sector (AI & Machine Learning, Fintech, Defense & Aerospace, Crypto, Enterprise Software, Consumer, Data Science & Analytics, Healthcare, or Other)
- description: one sentence about what the company does
- date: approximate announcement date (YYYY-MM-DD)

Return ONLY a valid JSON array. No markdown, no commentary. Example format:
[{"company_name":"Acme AI","amount":"$30M","round_type":"Series B","lead_investors":["Sequoia Capital","a16z"],"sector":"AI & Machine Learning","description":"AI-powered code review platform","date":"2026-02-08"}]

Rules:
- Only include rounds of $1M or more
- Only include rounds with at least one named VC/institutional investor
- Exclude crowdfunding, ICOs, token sales, and debt financing
- Focus on the most notable and well-sourced rounds
- Maximum 20 rounds`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}: ${responseText.substring(0, 200)}`);
  }

  const data = JSON.parse(responseText);
  const content = data.choices?.[0]?.message?.content || '';

  // Extract JSON array from response (may have markdown wrapping)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('No JSON array found in Perplexity response:', content.substring(0, 500));
    return [];
  }

  let rawRounds: Array<{
    company_name?: string;
    amount?: string;
    round_type?: string;
    lead_investors?: string[];
    sector?: string;
    description?: string;
    date?: string;
  }>;

  try {
    rawRounds = JSON.parse(jsonMatch[0]);
  } catch {
    console.error('Failed to parse funding rounds JSON:', jsonMatch[0].substring(0, 500));
    return [];
  }

  if (!Array.isArray(rawRounds)) return [];

  // Quality filter and normalize
  return rawRounds
    .filter(r => {
      if (!r.company_name || !r.amount || !r.round_type) return false;
      // Filter out tiny rounds
      const amountNum = parseAmount(r.amount);
      if (amountNum < 1_000_000) return false;
      // Must have named investors
      if (!r.lead_investors || r.lead_investors.length === 0) return false;
      return true;
    })
    .map(r => ({
      company: r.company_name!,
      amount: normalizeAmount(r.amount!),
      roundType: normalizeRoundType(r.round_type!),
      leadInvestors: r.lead_investors || [],
      sector: r.sector || 'Other',
      description: r.description || '',
      dateAnnounced: r.date || new Date().toISOString().split('T')[0],
      confidence: scoreConfidence(r),
    }))
    .sort((a, b) => {
      // Sort: high confidence first, then by amount descending
      const confOrder = { high: 0, medium: 1, low: 2 };
      if (confOrder[a.confidence] !== confOrder[b.confidence]) {
        return confOrder[a.confidence] - confOrder[b.confidence];
      }
      return parseAmount(b.amount) - parseAmount(a.amount);
    })
    .slice(0, 15);
}

function parseAmount(amount: string): number {
  const cleaned = amount.replace(/[^0-9.BMK]/gi, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (/B/i.test(amount)) return num * 1_000_000_000;
  if (/M/i.test(amount)) return num * 1_000_000;
  if (/K/i.test(amount)) return num * 1_000;
  return num;
}

function normalizeAmount(amount: string): string {
  if (amount.startsWith('$')) return amount;
  return `$${amount}`;
}

function normalizeRoundType(type: string): string {
  const t = type.trim();
  // Normalize common variations
  if (/^pre.?seed$/i.test(t)) return 'Pre-Seed';
  if (/^seed/i.test(t)) return 'Seed';
  if (/^series\s?a/i.test(t)) return 'Series A';
  if (/^series\s?b/i.test(t)) return 'Series B';
  if (/^series\s?c/i.test(t)) return 'Series C';
  if (/^series\s?d/i.test(t)) return 'Series D';
  if (/^series\s?e/i.test(t)) return 'Series E';
  if (/^growth/i.test(t)) return 'Growth';
  return t;
}

function scoreConfidence(round: {
  company_name?: string;
  amount?: string;
  lead_investors?: string[];
  round_type?: string;
}): 'high' | 'medium' | 'low' {
  let score = 0;

  // Has specific amount (not vague)
  if (round.amount && /\$[\d.]+[BMK]/i.test(round.amount)) score += 2;

  // Has multiple named investors
  if (round.lead_investors && round.lead_investors.length >= 2) score += 2;
  else if (round.lead_investors && round.lead_investors.length === 1) score += 1;

  // Has specific round type
  if (round.round_type && /series|seed/i.test(round.round_type)) score += 1;

  // Known top-tier investors boost confidence
  const topTier = ['a16z', 'Andreessen Horowitz', 'Sequoia', 'Benchmark', 'Accel', 'Index Ventures',
    'Lightspeed', 'Greylock', 'Bessemer', 'General Catalyst', 'Founders Fund', 'Paradigm',
    'Polychain', 'Ribbit', 'Tiger Global', 'Coatue', 'Thrive Capital', 'Khosla', 'NEA'];
  const hasTopTier = (round.lead_investors || []).some(inv =>
    topTier.some(t => inv.toLowerCase().includes(t.toLowerCase()))
  );
  if (hasTopTier) score += 2;

  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
