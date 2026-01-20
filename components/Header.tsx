'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue) {
      params.set('search', searchValue);
    } else {
      params.delete('search');
    }
    router.push('/?' + params.toString());
  };

  return (
    <header className="border-b border-[#3A3A3A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-[#F9F9F9] tracking-tight">
              cadre
            </h1>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search jobs, companies..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-4 py-2 bg-[#333333] border border-[#3A3A3A] rounded-md text-[#F9F9F9] placeholder-[#6B6B6B] focus:outline-none focus:border-[#525252] transition-colors"
            />
          </form>

          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/" className="text-sm text-[#A0A0A0] hover:text-[#F9F9F9] transition-colors">
              Jobs
            </Link>
            <span className="text-sm text-[#6B6B6B]">Companies</span>
            <span className="text-sm text-[#6B6B6B]">Investors</span>
          </nav>
        </div>
      </div>
    </header>
  );
}
