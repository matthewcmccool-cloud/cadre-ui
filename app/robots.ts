import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings', '/intelligence'],
      },
      // Explicitly allow AI crawlers
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/intelligence'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/intelligence'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/intelligence'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/intelligence'],
      },
      {
        userAgent: 'Applebot-Extended',
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/settings', '/intelligence'],
      },
    ],
    sitemap: 'https://cadre-ui-psi.vercel.app/sitemap.xml',
  };
}
