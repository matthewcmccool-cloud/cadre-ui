import ComingSoon from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fundraises — Coming Soon',
  description: 'Track the latest funding rounds across exceptional technology companies. Coming soon to Cadre.',
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app/fundraises' },
  openGraph: {
    title: 'Fundraises — Coming Soon | Cadre',
    description: 'Track the latest funding rounds across exceptional technology companies.',
    url: 'https://cadre-ui-psi.vercel.app/fundraises',
  },
};

export default function FundraisesPage() {
  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <ComingSoon
          title="Fundraises"
          description="Track the latest funding rounds across exceptional technology companies. AI-powered, updated daily."
        />
      </div>
    </main>
  );
}
