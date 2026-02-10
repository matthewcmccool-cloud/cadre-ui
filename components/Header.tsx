'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/fundraises', label: 'Fundraises' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-[#0e0e0f] border-b border-[#1a1a1b]">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              Cadre
            </span>
          </Link>

          {/* Right: Product tabs */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
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
