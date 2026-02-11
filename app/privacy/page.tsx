import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Cadre',
  description: 'Cadre privacy policy. How we collect, use, and protect your data.',
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-100">Privacy Policy</h1>
        <p className="mt-4 text-sm text-zinc-400">Coming soon.</p>
      </div>
    </main>
  );
}
