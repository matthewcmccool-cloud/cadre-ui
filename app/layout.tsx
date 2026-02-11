import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Header from '@/components/Header';
import './globals.css';

const BASE_URL = 'https://cadre-ui-psi.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Cadre | Curated Roles at Exceptional Technology Companies',
    template: '%s | Cadre',
  },
  description: 'Curated roles at exceptional technology companies, by the investors who back them.',
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
  description: 'Curated roles at exceptional technology companies, by the investors who back them.',
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
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
