'use client';

import { useRouter } from 'next/navigation';
import { serializeFilters } from '@/lib/filters';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const router = useRouter();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = serializeFilters(searchParams);
    if (page > 1) {
      const newParams = new URLSearchParams(params);
      newParams.set('page', String(page));
      router.push('/?' + newParams.toString());
    } else {
      router.push('/' + (params ? '?' + params : ''));
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1b] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      <div className="flex items-center gap-0.5">
        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => goToPage(page)}
              className={`w-8 h-8 text-sm rounded transition-colors ${
                page === currentPage
                  ? 'bg-[#5e6ad2] text-white'
                  : 'text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1b]'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-1 text-[#666]">
              {page}
            </span>
          )
        )}
      </div>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-sm text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1b] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}
