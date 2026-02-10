'use client';

import { useState } from 'react';

/**
 * Email capture bar for Loops.so newsletter — TBPN-inspired.
 * Simple dark input + purple subscribe button.
 */
export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    try {
      // TODO: Wire to Loops.so API when key is configured
      // For now, just simulate success
      await new Promise(r => setTimeout(r, 500));
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="mt-6 pt-5 border-t border-[#1a1a1b]">
      <h3 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">
        GET CADRE DELIVERED
      </h3>
      <p className="text-xs text-[#999] mb-3">
        Weekly hiring data from top VC portfolios. No spam.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@email.com"
          required
          className="flex-1 bg-[#1a1a1b] border border-[#333] rounded px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2] transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-[#5e6ad2] hover:bg-[#4f5bc0] text-white text-xs font-semibold uppercase tracking-wider px-5 py-2 rounded transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? '...' : status === 'success' ? 'SUBSCRIBED' : 'SUBSCRIBE'}
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-red-400 mt-2">Something went wrong. Try again.</p>
      )}
    </div>
  );
}
