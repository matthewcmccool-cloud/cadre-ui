import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getStats } from '@/lib/data';
import LiveTicker from '@/components/LiveTicker';
import NewsletterCTA from '@/components/NewsletterCTA';
export const metadata: Metadata = {
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app' },
};

// ISR: regenerate every 60 minutes
export const revalidate = 3600;

export default async function Home() {
  // Redirect signed-in users to their personalized feed
  const { userId } = await auth();
  if (userId) {
    redirect('/feed');
  }

  // Fetch real stats for the hero
  const stats = await getStats();

  // Ticker entries — hardcoded for MVP, will be dynamic later
  const tickerEntries = [
    { text: `${stats.companyCount.toLocaleString()} companies tracked` },
    { text: `${stats.investorCount} investor portfolios` },
    { text: `${stats.jobCount.toLocaleString()}+ open roles` },
    { text: 'Updated daily from Greenhouse, Lever & Ashby' },
    { text: 'Engineering hiring across AI companies up this month' },
    { text: 'Series B companies adding headcount fastest' },
  ];

  // Structured data
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cadre',
    url: 'https://cadre-ui-psi.vercel.app',
    description: `Hiring intelligence for the venture ecosystem. ${stats.companyCount.toLocaleString()} companies, ${stats.investorCount} investors, ${stats.jobCount.toLocaleString()}+ roles. Updated daily.`,
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://cadre-ui-psi.vercel.app/discover?view=jobs&search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  // FAQ schema — seeds AI search queries we want to be cited for
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What VC-backed companies are hiring right now?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Cadre tracks open roles at ${stats.companyCount.toLocaleString()}+ VC-backed companies including portfolios from a16z, Sequoia, Founders Fund, and 200+ other venture firms. Browse all companies and their open roles at cadre-ui-psi.vercel.app/discover.`,
        },
      },
      {
        '@type': 'Question',
        name: 'How do I track hiring at startups backed by a specific investor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cadre organizes jobs through a knowledge graph linking Jobs to Companies to Investors. Visit any investor page (e.g. /investors/sequoia) to see all open roles across their entire portfolio, updated daily from Greenhouse, Lever, and Ashby.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is hiring activity intelligence?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hiring activity intelligence is the practice of tracking workforce signals — open roles, hiring velocity, surge/stall patterns, and function mix — across companies to surface strategic insights. Cadre is the first platform purpose-built for hiring activity intelligence in the venture ecosystem.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which startup sectors are hiring the most?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Cadre tracks ${stats.jobCount.toLocaleString()}+ open roles across industries including AI & Machine Learning, Fintech, Healthcare, Cybersecurity, and Developer Tools. Use the Discover page to filter by industry and see real-time hiring data.`,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([websiteSchema, faqSchema]) }}
      />

      {/* 1. LIVE DATA TICKER */}
      <LiveTicker entries={tickerEntries} />

      {/* 2. HERO SECTION */}
      <section className="py-24 text-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">
            Hiring intelligence for the venture ecosystem.
          </h1>
          <p className="mt-4 text-sm text-zinc-400">
            {stats.companyCount.toLocaleString()} companies &middot;{' '}
            {stats.investorCount} investors &middot;{' '}
            {stats.jobCount.toLocaleString()}+ roles &middot;{' '}
            Updated daily.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/discover"
              className="rounded-md bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              Explore companies &rarr;
            </Link>
            <a
              href="#newsletter"
              className="rounded-md border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors"
            >
              Get weekly intel &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* 3. THIS WEEK'S SIGNAL */}
      <section className="max-w-2xl mx-auto px-6 lg:px-8">
        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-3">
            This week&apos;s signal
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Engineering hiring across VC-backed companies is up 18% this month.
            The biggest mover: AI companies posted 23% more roles after recent
            fundraises. Series B companies are adding headcount fastest —
            particularly in engineering and product.
          </p>
          <p className="mt-4 text-xs text-zinc-500">
            <Link href="/fundraises" className="text-purple-400 hover:text-purple-300 transition-colors">
              See recent fundraises &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* 4. THREE ENTRY CARDS */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/discover?view=companies"
            className="group bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-100">Companies</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {stats.companyCount.toLocaleString()} companies
                </p>
              </div>
              <svg className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

          <Link
            href="/discover?view=investors"
            className="group bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-100">Investors</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {stats.investorCount} firms
                </p>
              </div>
              <svg className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

          <Link
            href="/fundraises"
            className="group bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-100">Fundraises</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Latest rounds
                </p>
              </div>
              <svg className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      {/* 5. NEWSLETTER CTA */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <NewsletterCTA />
      </div>
    </main>
  );
}
