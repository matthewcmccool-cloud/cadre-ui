'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useFollows } from '@/hooks/useFollows';

export default function Header() {
  const pathname = usePathname();
  const { user, isSignedIn, isLoaded, openSignIn, signOut } = useAuth();
  const { status } = useSubscription();
  const { followCount } = useFollows();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const isActive = (href: string) => {
    if (href === '/discover') {
      return pathname === '/discover' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Determine if trial is expired (canceled = expired trial or canceled sub)
  const isExpiredTrial = status === 'canceled';

  return (
    <>
      {/* ── Desktop Top Bar ── */}
      <header className="sticky top-0 z-40 h-14 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-xl font-bold text-white tracking-tight">
              Cadre
            </span>
          </Link>

          {/* Center: Nav links (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Discover — always visible */}
            <Link
              href="/discover"
              className={`relative px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive('/discover')
                  ? 'text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Discover
              {isActive('/discover') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-purple-500 rounded-full" />
              )}
            </Link>

            {/* Intelligence — logged-in only */}
            {isSignedIn && (
              <Link
                href="/intelligence"
                className={`relative px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/intelligence')
                    ? isExpiredTrial ? 'text-zinc-500' : 'text-zinc-100'
                    : isExpiredTrial ? 'text-zinc-500 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Intelligence
                <span className="text-xs bg-purple-500/20 text-purple-300 rounded-full px-1.5 font-medium">
                  PRO
                </span>
                {followCount > 0 && (
                  <span className={`text-xs ${isExpiredTrial ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    ({followCount})
                  </span>
                )}
                {isActive('/intelligence') && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-purple-500 rounded-full" />
                )}
              </Link>
            )}

            {/* Fundraises — always visible */}
            <Link
              href="/fundraises"
              className={`relative px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive('/fundraises')
                  ? 'text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Fundraises
              {isActive('/fundraises') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-purple-500 rounded-full" />
              )}
            </Link>

            {/* Pricing — logged-out only */}
            {!isSignedIn && (
              <Link
                href="/pricing"
                className={`relative px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive('/pricing')
                    ? 'text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Pricing
                {isActive('/pricing') && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-purple-500 rounded-full" />
                )}
              </Link>
            )}
          </nav>

          {/* Right: Auth */}
          <div className="flex items-center gap-3">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors overflow-hidden"
                    >
                      {user?.imageUrl ? (
                        <Image
                          src={user.imageUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span>{user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || '?'}</span>
                      )}
                    </button>

                    {/* Dropdown menu */}
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg py-1 z-50">
                        <Link
                          href="/intelligence"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                        >
                          Intelligence
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                        >
                          Settings
                        </Link>
                        <div className="border-t border-zinc-800 my-1" />
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            signOut();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => openSignIn()}
                    className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    Sign in
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-zinc-950 border-t border-zinc-800">
        <div className="flex items-center justify-around h-full">
          {/* Discover */}
          <Link
            href="/discover"
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              isActive('/discover') ? 'text-purple-500' : 'text-zinc-500'
            }`}
          >
            <MobileTabIcon tab="Discover" />
            <span className="text-xs font-medium">Discover</span>
          </Link>

          {/* Intelligence — logged-in only */}
          {isSignedIn && (
            <Link
              href="/intelligence"
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive('/intelligence') ? 'text-purple-500' : isExpiredTrial ? 'text-zinc-600' : 'text-zinc-500'
              }`}
            >
              <MobileTabIcon tab="Intelligence" />
              <span className="text-xs font-medium">Intelligence</span>
            </Link>
          )}

          {/* Fundraises */}
          <Link
            href="/fundraises"
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              isActive('/fundraises') ? 'text-purple-500' : 'text-zinc-500'
            }`}
          >
            <MobileTabIcon tab="Fundraises" />
            <span className="text-xs font-medium">Fundraises</span>
          </Link>

          {/* Pricing — logged-out only */}
          {!isSignedIn && (
            <Link
              href="/pricing"
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive('/pricing') ? 'text-purple-500' : 'text-zinc-500'
              }`}
            >
              <MobileTabIcon tab="Pricing" />
              <span className="text-xs font-medium">Pricing</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Spacer for mobile bottom bar so page content isn't hidden behind it */}
      <div className="md:hidden h-14" />
    </>
  );
}

function MobileTabIcon({ tab }: { tab: string }) {
  switch (tab) {
    case 'Discover':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      );
    case 'Intelligence':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
        </svg>
      );
    case 'Fundraises':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      );
    case 'Pricing':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}
