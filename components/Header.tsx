'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const BROWSE_ITEMS = [
  { href: '/', tab: null, label: 'Job Listings' },
  { href: '/?tab=companies', tab: 'companies', label: 'Companies' },
  { href: '/?tab=investors', tab: 'investors', label: 'Investors' },
];

const PRODUCT_ITEMS = [
  { href: '/fundraises', label: 'Fundraises' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  return (
    <header className="bg-[#0e0e0f] border-b border-[#1a1a1b]">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Browse chips */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                Cadre
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {BROWSE_ITEMS.map(({ href, tab, label }) => {
                const isActive = pathname === '/' && (tab === null ? !currentTab : currentTab === tab);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-[#1a1a1b]'
                        : 'text-[#555] hover:text-[#e8e8e8] hover:bg-[#1a1a1b]/50'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Product tabs */}
          <nav className="flex items-center gap-1">
            {PRODUCT_ITEMS.map(({ href, label }) => {
              const isActive = pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-[#1a1a1b]'
                      : 'text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1b]/50'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
