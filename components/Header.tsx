'use client';

import Link from 'next/link';
export default function Header() {
    return (
    <header className="border-b border-[#3A3A3A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-[#F9F9F9] tracking-tight">
              HighSignal.Jobs
            </h1>
          </Link>

          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/" className="text-sm text-[#A0A0A0] hover:text-[#F9F9F9] transition-colors">
              Jobs
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
