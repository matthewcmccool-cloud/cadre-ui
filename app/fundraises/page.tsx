import ComingSoon from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fundraises | Cadre — Funding Rounds at Top Technology Companies',
  description: 'Track the latest funding rounds across exceptional technology companies. Coming soon to Cadre.',
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
