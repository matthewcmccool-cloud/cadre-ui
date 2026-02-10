import Link from 'next/link';
import { RecentCompany } from '@/lib/airtable';

interface RecentRoundsProps {
  companies: RecentCompany[];
}

const STAGE_COLORS: Record<string, string> = {
  'Seed': 'bg-green-500/15 text-green-400',
  'Series A': 'bg-blue-500/15 text-blue-400',
  'Series B': 'bg-purple-500/15 text-purple-400',
  'Series C': 'bg-orange-500/15 text-orange-400',
  'Series D': 'bg-pink-500/15 text-pink-400',
  'Series E': 'bg-rose-500/15 text-rose-400',
  'Growth': 'bg-amber-500/15 text-amber-400',
};

function getDomain(url: string | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export default function RecentRounds({ companies }: RecentRoundsProps) {
  if (companies.length === 0) return null;

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold text-white uppercase tracking-wider">RECENTLY ADDED</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {companies.map((company) => {
          const domain = getDomain(company.url);
          const stageColor = company.stage ? STAGE_COLORS[company.stage] || 'bg-[#252526] text-[#888]' : null;

          return (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="group bg-[#1a1a1b] hover:bg-[#252526] rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                {domain ? (
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    alt=""
                    className="w-5 h-5 rounded"
                  />
                ) : (
                  <div className="w-5 h-5 rounded bg-[#252526] flex items-center justify-center text-[10px] font-semibold text-[#888]">
                    {company.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm text-white font-medium truncate group-hover:text-[#5e6ad2] transition-colors">
                  {company.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {stageColor && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${stageColor}`}>
                    {company.stage}
                  </span>
                )}
                {company.jobCount > 0 && (
                  <span className="text-[11px] text-[#888]">
                    {company.jobCount} {company.jobCount === 1 ? 'role' : 'roles'}
                  </span>
                )}
                {company.investors.length > 0 && (
                  <>
                    <span className="text-[#333]">·</span>
                    <span className="text-[10px] text-[#999] truncate">
                      {company.investors[0]}
                      {company.investors.length > 1 && ` +${company.investors.length - 1}`}
                    </span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
