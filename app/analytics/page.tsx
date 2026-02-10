import AnalyticsLanding from '@/components/AnalyticsLanding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | Cadre — Hiring Intelligence for Technology Companies',
  description: 'Real-time hiring analytics across exceptional technology companies. Track headcount trends, talent flows, and competitive intelligence.',
};

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <AnalyticsLanding />
      </div>
    </main>
  );
}
