'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
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
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="pt-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5e6ad2]/10 rounded-full text-xs text-[#5e6ad2] font-medium mb-6">
          Coming soon
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
          {title}
        </h1>
        <p className="text-[#888] text-lg max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="bg-[#1a1a1b] rounded-xl p-8 border border-[#252526] text-center max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-white mb-2">Get notified when it launches</h2>
        <p className="text-sm text-[#888] mb-6">
          Drop your email and we&apos;ll let you know when this is live.
        </p>

        {status === 'success' ? (
          <p className="text-[#5e6ad2] font-medium py-4">
            You&apos;re on the list. We&apos;ll be in touch.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              required
              className="flex-1 px-4 py-2.5 bg-[#0e0e0f] text-[#e8e8e8] placeholder-[#555] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50 border border-[#252526]"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-2.5 bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {status === 'loading' ? '...' : 'Notify me'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-400 mt-3">Something went wrong. Try again.</p>
        )}
      </div>

      <p className="text-center mt-8">
        <Link
          href="/"
          className="text-sm text-[#5e6ad2] hover:text-[#7e8ae2] transition-colors"
        >
          Back to Job Listings
        </Link>
      </p>
    </div>
  );
}
