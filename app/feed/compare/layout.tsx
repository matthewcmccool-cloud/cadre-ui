import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Companies | Cadre',
  description: 'Compare hiring activity across your followed companies side-by-side.',
  robots: { index: false },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
