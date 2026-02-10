'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-[#0e0e0f] border-b border-[#1a1a1b]">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              Cadre
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
