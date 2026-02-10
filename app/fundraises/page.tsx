import ComingSoon from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fundraises | Cadre — VC-Backed Startup Funding Rounds',
  description: 'Track the latest funding rounds across VC-backed startups. Coming soon to Cadre.',
};

export default function FundraisesPage() {
  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <ComingSoon
          title="Fundraises"
          description="Track the latest funding rounds across VC-backed startups. AI-powered, updated daily."
        />
      </div>
    </main>
  );
}
