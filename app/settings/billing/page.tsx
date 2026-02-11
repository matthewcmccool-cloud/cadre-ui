'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import { trackStartTrial, trackSubscribe } from '@/lib/analytics';

export default function BillingSettings() {
  const { status, isPro, isTrialing, trialDaysRemaining } = useSubscription();
  const [loading, setLoading] = useState(false);

  // Track conversion events from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('trial') === 'started' && isTrialing) {
      trackStartTrial();
    }
    if (status === 'active' && !isTrialing) {
      // Fire subscribe once per session when user first sees active status
      const key = 'cadre_subscribe_tracked';
      if (!sessionStorage.getItem(key)) {
        trackSubscribe();
        sessionStorage.setItem(key, '1');
      }
    }
  }, [status, isTrialing]);

  const openPortal = async () => {
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
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-zinc-100 mb-6">Billing</h2>

      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        {status === 'free' && (
          <>
            <p className="text-sm text-zinc-100">
              Current plan: <span className="font-medium">Free</span>
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-md transition-colors"
            >
              Upgrade to Pro — $99/month →
            </Link>
          </>
        )}

        {isTrialing && (
          <>
            <p className="text-sm text-zinc-100">
              Current plan: <span className="font-medium">Pro (trial)</span>
            </p>
            {trialDaysRemaining !== null && (
              <p className="text-sm text-zinc-400 mt-1">
                Trial ends in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}
              </p>
            )}
            <p className="text-xs text-zinc-500 mt-1">After trial: $99/month</p>
            <button
              onClick={openPortal}
              disabled={loading}
              className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Manage billing →'}
            </button>
          </>
        )}

        {status === 'active' && !isTrialing && (
          <>
            <p className="text-sm text-zinc-100">
              Current plan: <span className="font-medium">Pro ($99/month)</span>
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={openPortal}
                disabled={loading}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 text-left"
              >
                {loading ? 'Loading...' : 'Manage billing →'}
              </button>
              <button
                onClick={openPortal}
                disabled={loading}
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors disabled:opacity-50 text-left"
              >
                Switch to annual ($79/month) →
              </button>
            </div>
          </>
        )}

        {status === 'canceled' && (
          <>
            <p className="text-sm text-zinc-100">
              Plan canceled.
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Your access will expire at the end of your billing period.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Reactivate →
            </Link>
          </>
        )}

        {status === 'past_due' && (
          <>
            <p className="text-sm text-red-400">
              Payment failed. Please update your payment method.
            </p>
            <button
              onClick={openPortal}
              disabled={loading}
              className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Update payment method →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
