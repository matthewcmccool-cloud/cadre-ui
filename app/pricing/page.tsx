'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { trackStartTrial } from '@/lib/analytics';

const PRO_FEATURES = [
  'Daily and real-time alerts for followed companies',
  'Full knowledge graph context (investor backing, portfolio trends in every alert)',
  'Cross-company comparison dashboard',
  'Hiring surge and stall detection',
  'Full historical hiring trends (90-day, 6mo, 12mo)',
  'Hiring activity filters on Discover',
  'CSV export',
  'Priority data sync for your followed companies',
];

const FREE_FEATURES = [
  'Browse all jobs, companies, and investors',
  'Follow unlimited companies',
  'Personalized activity feed',
  'Weekly digest email',
  'Fundraise feed',
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const { isSignedIn, openSignIn } = useAuth();
  const { isPro, status } = useSubscription();
  const [loading, setLoading] = useState(false);

  const price = billing === 'monthly' ? '$99' : '$79';
  const period = '/mo';

  const handleCTA = async () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    if (isPro) {
      // Manage billing via Stripe portal
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

    // Start checkout
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
    ? 'Manage billing →'
    : status === 'canceled'
      ? 'Resubscribe →'
      : 'Start 14-day free trial →';

  return (
    <div className="min-h-screen bg-zinc-950 flex items-start justify-center pt-20 pb-24 px-4">
      <div className="w-full max-w-lg">
        {/* Title */}
        <h1 className="text-3xl font-semibold text-white">Cadre Pro</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Real-time hiring intelligence for the companies you care about.
        </p>

        {/* Billing toggle */}
        <div className="mt-6 flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billing === 'monthly'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Monthly {billing === 'monthly' && '$99'}
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billing === 'annual'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Annual {billing === 'annual' && '$79/mo'}
          </button>
        </div>

        {/* Price display */}
        <div className="mt-6">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-sm text-zinc-500">{period}</span>
          {billing === 'annual' && (
            <span className="ml-2 text-xs text-emerald-400">Save 20%</span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleCTA}
          disabled={loading}
          className="mt-6 w-full py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : ctaLabel}
        </button>

        {/* What you get */}
        <div className="mt-10">
          <h2 className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-3">
            What you get
          </h2>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Always free */}
        <div className="mt-10">
          <h2 className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-3">
            Always free
          </h2>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-400">
                <span className="text-zinc-500 mt-0.5 flex-shrink-0">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-zinc-500">
          Questions? Contact matt@cadre.careers
        </p>
      </div>
    </div>
  );
}
