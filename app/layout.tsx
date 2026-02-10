import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cadre | Curated Roles at Exceptional Technology Companies',
  description: 'Curated roles at exceptional technology companies, by the investors who back them.',
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
