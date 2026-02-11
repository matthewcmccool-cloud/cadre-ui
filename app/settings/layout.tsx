'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/settings', label: 'Account' },
  { href: '/settings/alerts', label: 'Alerts' },
  { href: '/settings/billing', label: 'Billing' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/settings') return pathname === '/settings';
    return pathname.startsWith(href);
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-zinc-100 mb-6">Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop: left sidebar tabs */}
          <nav className="hidden md:flex flex-col gap-1 w-48 flex-shrink-0">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(tab.href)
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Mobile: stacked tab buttons */}
          <nav className="md:hidden flex gap-1">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(tab.href)
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
