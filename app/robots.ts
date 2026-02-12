import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings', '/for-me'],
      },
      // Explicitly allow AI crawlers
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/for-me'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/for-me'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/for-me'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/for-me'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/for-me'],
      },
    ],
    sitemap: 'https://cadre-ui-psi.vercel.app/sitemap.xml',
  };
}
