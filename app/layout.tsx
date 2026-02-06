import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
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
    <ClerkProvider>
      <html lang="en">
        <body>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
