'use client';

import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import BlurredPlaceholder from '@/components/BlurredPlaceholder';

function CompareTablePlaceholder() {
  const rows = ['Anthropic', 'Anduril', 'Brex', 'Scale AI', 'Figma'];
  const cols = ['Open Roles', 'New (7d)', 'Trend', 'Top Function'];
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Company</th>
            {cols.map((c) => (
              <th key={c} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((name) => (
            <tr key={name} className="border-b border-zinc-800/50">
              <td className="px-4 py-3 text-zinc-200">{name}</td>
              <td className="px-4 py-3 text-zinc-400">{Math.floor(Math.random() * 80 + 10)}</td>
              <td className="px-4 py-3 text-zinc-400">{Math.floor(Math.random() * 15)}</td>
              <td className="px-4 py-3 text-emerald-400">+{Math.floor(Math.random() * 30)}%</td>
              <td className="px-4 py-3 text-zinc-400">Engineering</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComparePage() {
  const { isPro } = useSubscription();

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/intelligence" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Intelligence
          </Link>
          <h1 className="text-xl font-semibold text-zinc-100">Compare Companies</h1>
        </div>

        {/* Mobile: desktop-only message */}
        <div className="md:hidden bg-zinc-900 rounded-lg p-6 border border-zinc-800 text-center">
          <p className="text-sm text-zinc-400">
            Comparison view is available on desktop.
          </p>
          <Link href="/intelligence" className="mt-3 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to Intelligence
          </Link>
        </div>

        {/* Desktop: comparison table */}
        <div className="hidden md:block">
          {isPro ? (
            <CompareTablePlaceholder />
          ) : (
            <BlurredPlaceholder prompt="Unlock cross-company comparison → Start free trial">
              <CompareTablePlaceholder />
            </BlurredPlaceholder>
          )}
        </div>
      </div>
    </main>
  );
}
