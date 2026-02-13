import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Cadre Pro from $15/month',
  description: 'Cadre Pro: follow companies, personalized dashboard, job alerts. Institutional tier coming soon with portfolio analytics and API access.',
  alternates: { canonical: 'https://cadre-ui-psi.vercel.app/pricing' },
  openGraph: {
    title: 'Pricing — Cadre Pro from $15/month',
    description: 'Cadre Pro: follow companies, personalized dashboard, job alerts. Institutional tier coming soon.',
    url: 'https://cadre-ui-psi.vercel.app/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
