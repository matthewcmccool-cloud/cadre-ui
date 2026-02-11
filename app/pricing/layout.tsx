import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cadre Pro — Hiring Activity Intelligence | $99/month',
  description: 'Real-time hiring intelligence for the companies you care about. Daily alerts, hiring trends, surge detection, CSV export, and more.',
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app/pricing' },
  openGraph: {
    title: 'Cadre Pro — Hiring Activity Intelligence | $99/month',
    description: 'Real-time hiring intelligence for the companies you care about.',
    url: 'https://cadre-ui-psi.vercel.app/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
