import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portco.Jobs | Jobs at VC-Backed Companies',  description: 'Discover jobs at venture-backed startups. Filter by investor, funding stage, function, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
