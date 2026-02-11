import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings', '/feed'],
      },
      // Explicitly allow AI crawlers
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/feed'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/feed'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/feed'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/feed'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/feed'],
      },
    ],
    sitemap: 'https://cadre-ui-psi.vercel.app/sitemap.xml',
  };
}
