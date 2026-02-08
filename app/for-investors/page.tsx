import Header from '@/components/Header';
import ForInvestorsContent from '@/components/ForInvestorsContent';

export const metadata = {
  title: 'Cadre — The Portfolio Hiring Pulse',
  description:
    'Real-time hiring intelligence across your entire portfolio — trends, comparisons, and alerts that replace manual tracking.',
};

export default function ForInvestorsPage() {
  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <Header />
      <ForInvestorsContent />
    </main>
  );
}
