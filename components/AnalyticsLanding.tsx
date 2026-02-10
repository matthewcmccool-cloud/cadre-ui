'use client';

import { useState } from 'react';

const FEATURES = [
  {
    title: 'Portfolio Hiring Pulse',
    description: 'See which of your portfolio companies are ramping hiring and which are slowing down. Real-time, not quarterly.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    title: 'Competitive Intelligence',
    description: 'Compare hiring velocity across your portfolio vs. competitors. Know who is scaling engineering, GTM, or AI teams.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Talent Flow Mapping',
    description: 'Track where talent is moving between companies. Identify poaching patterns and retention risks across the ecosystem.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      </svg>
    ),
  },
  {
    title: 'Department Breakdown',
    description: 'Granular view of open roles by function: Engineering, Sales, AI, Product, and more. Spot which teams are being built out.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export default function AnalyticsLanding() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      // Silently fail for now — user sees no change
    }
    setLoading(false);
  };

  return (
    <div className="pt-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5e6ad2]/10 rounded-full text-xs text-[#5e6ad2] font-medium mb-6">
          Coming soon
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
          Hiring intelligence across<br />exceptional technology companies
        </h1>
        <p className="text-[#888] text-lg max-w-xl mx-auto leading-relaxed">
          Real-time analytics across 1,300+ companies and 16,000+ open roles.
          Know what the best teams are building before the board deck.
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="bg-[#1a1a1b] rounded-xl p-6 border border-[#252526]"
          >
            <div className="text-[#5e6ad2] mb-3">{feature.icon}</div>
            <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-[#888] leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#1a1a1b] rounded-xl p-8 border border-[#252526] text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Get early access</h2>
        <p className="text-sm text-[#888] mb-6 max-w-md mx-auto">
          We&apos;re building this with a handful of talent partners at top funds.
          Drop your email to join the waitlist.
        </p>

        {submitted ? (
          <div className="py-4">
            <p className="text-[#5e6ad2] font-medium">You&apos;re on the list. We&apos;ll be in touch.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
              required
              className="flex-1 px-4 py-2.5 bg-[#0e0e0f] text-[#e8e8e8] placeholder-[#555] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50 border border-[#252526]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join waitlist'}
            </button>
          </form>
        )}
      </div>

      {/* Social proof hint */}
      <p className="text-center text-xs text-[#444] mt-8">
        Built for talent partners at a16z, Sequoia, Benchmark, and others.
      </p>
    </div>
  );
}
