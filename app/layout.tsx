import type { Metadata } from 'next';
import './globals.css';

const BASE_URL = 'https://cadre-ui-psi.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Cadre — Hiring Activity Intelligence for AI Agents',
    template: '%s | Cadre',
  },
  description: 'Hiring activity intelligence for AI agents.',
  openGraph: {
    type: 'website',
    siteName: 'Cadre',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cadre',
  url: 'https://cadre-ui-psi.vercel.app',
  description: 'Hiring activity intelligence for AI agents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          data-domain="cadre-ui-psi.vercel.app"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
