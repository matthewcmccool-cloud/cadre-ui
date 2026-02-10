'use client';

import Link from 'next/link';

const TABS = [
  { key: 'jobs', label: 'Job Listings', href: '/' },
  { key: 'companies', label: 'Companies', href: '/?tab=companies' },
  { key: 'investors', label: 'Investors', href: '/?tab=investors' },
];

interface HomepageTabsProps {
  activeTab: string;
  counts?: { jobs?: number; companies?: number; investors?: number };
}

export default function HomepageTabs({ activeTab, counts }: HomepageTabsProps) {
  return (
    <div className="flex items-center gap-1 mb-5">
      {TABS.map(tab => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'text-white bg-[#1a1a1b]'
              : 'text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1b]/50'
          }`}
        >
          {tab.label}
          {counts && counts[tab.key as keyof typeof counts] !== undefined && (
            <span className="ml-1.5 text-[10px] text-[#555] font-normal">
              {counts[tab.key as keyof typeof counts]?.toLocaleString()}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
