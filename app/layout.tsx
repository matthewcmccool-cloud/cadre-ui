import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import './globals.css';

const BASE_URL = 'https://cadre-ui-psi.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Cadre — Hiring Activity Intelligence for the Venture Ecosystem',
    template: '%s | Cadre',
  },
  description: 'Hiring intelligence for the venture ecosystem. Track open roles, hiring velocity, and workforce signals across 1,300+ VC-backed companies organized by investor portfolio.',
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
  description: 'Hiring activity intelligence platform for the venture ecosystem. Track open roles, hiring velocity, and workforce signals across 1,300+ VC-backed companies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark, variables: { colorPrimary: '#5e6ad2' } }}>
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
          <AnalyticsProvider />
          <Suspense>
            <Providers>
              <Header />
              {children}
              <Footer />
            </Providers>
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}
