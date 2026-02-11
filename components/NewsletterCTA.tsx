'use client';

import { useState } from 'react';
import { trackNewsletterSignup } from '@/lib/analytics';

export default function NewsletterCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      trackNewsletterSignup();
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="newsletter" className="max-w-xl mx-auto mt-24 mb-16 text-center">
      <h2 className="text-lg font-medium text-zinc-100">
        The Cadre Hiring Signal
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Weekly hiring intelligence from 330+ VC portfolios. Saturday mornings.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2 max-w-sm mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-md bg-purple-600 hover:bg-purple-500 px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === 'loading' ? 'Sending...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
        </button>
      </form>

      {status === 'error' && (
        <p className="mt-3 text-xs text-red-400">Something went wrong. Try again.</p>
      )}
      {status === 'success' && (
        <p className="mt-3 text-xs text-emerald-400">You&apos;re in. First issue arrives Saturday.</p>
      )}
    </section>
  );
}
