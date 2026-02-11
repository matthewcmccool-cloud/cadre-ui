import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cadre — Hiring Activity Intelligence',
    short_name: 'Cadre',
    description: 'Track hiring activity across 1,300+ VC-backed companies organized by investor portfolio.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0e0e0f',
    theme_color: '#5e6ad2',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
