import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cadre | Jobs at VC-Backed Companies',
  description: 'Discover jobs at venture-backed startups. Filter by investor, funding stage, function, and more.',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cadre',
  url: 'https://cadre-ui-psi.vercel.app',
  description: 'Job discovery platform for VC-backed companies. Filter by investor portfolio, funding stage, function, and industry.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark, variables: { colorPrimary: '#5e6ad2' } }}>
      <html lang="en">
        <body>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
          <Suspense>
            <Header />
          </Suspense>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
