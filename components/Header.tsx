'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: 'Jobs' },
    { href: '/for-investors', label: 'For Investors' },
  ];

  return (
    <header className="bg-[#0e0e0f]">
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              Cadre
            </span>
          </Link>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-0 border-b border-[#222]">
          {tabs.map((tab) => {
            const isActive = tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'text-white'
                    : 'text-[#999] hover:text-[#e8e8e8]'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5e6ad2]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
