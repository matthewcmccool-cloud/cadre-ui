import type { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'Cadre — Hiring Intelligence API for the AI Agent Ecosystem',
  description: 'Real-time job postings connected to companies, investors, funding rounds, and industries across the venture economy. Structured and built for machines.',
  alternates: { canonical: 'https://cadre.careers' },
};

export default function Home() {
  return <LandingPage />;
}
