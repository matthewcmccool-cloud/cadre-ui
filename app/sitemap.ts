import { MetadataRoute } from 'next';
import { getAllCompaniesForDirectory, getAllInvestorsForDirectory, getFilterOptions } from '@/lib/airtable';

const BASE_URL = 'https://cadre-ui-psi.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [companies, investors, filterOptions] = await Promise.all([
    getAllCompaniesForDirectory(),
    getAllInvestorsForDirectory(),
    getFilterOptions(),
  ]);

  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/?tab=companies`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/?tab=investors`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/companies`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/investors`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/fundraises`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/analytics`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Company pages
  const companyPages: MetadataRoute.Sitemap = companies.map(c => ({
    url: `${BASE_URL}/companies/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Investor pages
  const investorPages: MetadataRoute.Sitemap = investors.map(i => ({
    url: `${BASE_URL}/investors/${i.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Industry pages
  const industryPages: MetadataRoute.Sitemap = filterOptions.industries.map(ind => ({
    url: `${BASE_URL}/industry/${ind.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...companyPages, ...investorPages, ...industryPages];
}
