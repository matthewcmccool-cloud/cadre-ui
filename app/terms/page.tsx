import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Cadre',
  description: 'Cadre terms of service. Rules and conditions for using the platform.',
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app/terms' },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-100">Terms of Service</h1>
        <p className="mt-4 text-sm text-zinc-400">Coming soon.</p>
      </div>
    </main>
  );
}
