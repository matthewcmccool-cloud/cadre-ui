import { getFilterOptions } from '@/lib/airtable';
import LinkedInPostGenerator from '@/components/LinkedInPostGenerator';

export const revalidate = 3600;

export const metadata = {
  title: 'LinkedIn Post Generator | Cadre',
  description: 'Generate portfolio hiring posts for LinkedIn in seconds.',
};

export default async function LinkedInPostPage() {
  const filterOptions = await getFilterOptions();

  return (
    <main className="min-h-screen bg-[#0e0e0f]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">LinkedIn Post Generator</h1>
          <p className="text-sm text-[#888] mt-1">
            Generate portfolio hiring posts like a16z&apos;s talent team — in seconds, not hours.
          </p>
        </div>

        <LinkedInPostGenerator investors={filterOptions.investors} />
      </div>
    </main>
  );
}
