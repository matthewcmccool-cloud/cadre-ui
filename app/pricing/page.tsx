'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { trackStartTrial } from '@/lib/analytics';

const PRO_FEATURES = [
  'Follow up to 25 companies',
  'Personalized For Me dashboard',
  'Job posting alerts',
  'Full access to Discover & Fundraises',
];

const INSTITUTIONAL_FEATURES = [
  'Everything in Pro',
  'Unlimited company follows',
  'Hiring trend analysis & comparison',
  'Downloadable reports',
  'Portfolio hiring analytics',
  'API access',
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const { isSignedIn, openSignIn } = useAuth();
  const { isPro, status } = useSubscription();
  const [loading, setLoading] = useState(false);

  const price = billing === 'monthly' ? '$15' : '$12';

  const handleCTA = async () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    if (isPro) {
      setLoading(true);
      try {
        const res = await fetch('/api/billing/portal');
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        console.error('Portal error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: billing }),
      });
      const data = await res.json();
      if (data.url) {
        trackStartTrial();
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const ctaLabel = isPro
    ? 'Manage billing \u2192'
    : status === 'canceled'
      ? 'Resubscribe \u2192'
      : 'Start 14-day free trial \u2192';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center pt-20 pb-24 px-4">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-white">Pricing</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Choose the plan that fits your hiring intelligence needs.
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Card 1: Pro ── */}
        <div className="bg-zinc-900 border border-purple-500/40 rounded-xl p-6 flex flex-col">
          <h2 className="text-xl font-bold text-zinc-100">Pro</h2>

          {/* Price */}
          <div className="mt-4">
            <span className="text-4xl font-bold text-white">{price}</span>
            <span className="text-sm text-zinc-500">/month</span>
          </div>

          {/* Billing toggle */}
          <div className="mt-3 flex items-center gap-1 bg-zinc-800 rounded-lg p-1 w-fit">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                billing === 'monthly'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                billing === 'annual'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Annual
            </button>
          </div>
          {billing === 'annual' && (
            <p className="mt-2 text-xs text-emerald-400">$12/month &middot; Save 20%</p>
          )}

          {/* CTA */}
          <button
            onClick={handleCTA}
            disabled={loading}
            className="mt-5 w-full py-2.5 text-sm font-medium text-white bg-purple-500 hover:bg-purple-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : ctaLabel}
          </button>

          {/* Features */}
          <ul className="mt-6 space-y-2.5 flex-1">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">&#10003;</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Card 2: Institutional ── */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100">Institutional</h2>
            <span className="text-xs bg-zinc-700 text-zinc-400 rounded-full px-2 py-0.5">
              Coming soon
            </span>
          </div>

          {/* Price */}
          <div className="mt-4">
            <span className="text-4xl font-bold text-zinc-500">$99</span>
            <span className="text-sm text-zinc-600">/month</span>
          </div>

          {/* Spacer to align with Pro toggle area */}
          <div className="mt-3 h-[34px]" />

          {/* CTA */}
          <Link
            href="mailto:matt@cadre.careers"
            className="mt-5 w-full py-2.5 text-sm font-medium text-zinc-400 border border-zinc-600 hover:border-zinc-500 hover:text-zinc-300 rounded-lg transition-colors text-center block"
          >
            Join waitlist &rarr;
          </Link>

          {/* Features */}
          <ul className="mt-6 space-y-2.5 flex-1">
            {INSTITUTIONAL_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-400">
                <span className="text-zinc-600 mt-0.5 flex-shrink-0">&#10003;</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-zinc-500">
          All plans include: full Discover access, Fundraises data, weekly email digest
        </p>
        <p className="text-sm text-zinc-600 mt-2">
          Questions? matt@cadre.careers
        </p>
      </div>
    </div>
  );
}
