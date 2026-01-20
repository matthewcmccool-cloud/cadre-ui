'use client';

import { useRouter } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const router = useRouter();

  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value);
      }
    });
    if (page > 1) {
      params.set('page', String(page));
    }
    router.push('/?' + params.toString());
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
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm border border-[#3A3A3A] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#404040]"
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => goToPage(page)}
              className={`w-10 h-10 text-sm rounded-lg ${
                page === currentPage
                  ? 'bg-[#F9F9F9] text-[#262626]'
                  : 'border border-[#3A3A3A] hover:bg-[#404040]'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-2 text-[#6B6B6B]">
              {page}
            </span>
          )
        ))}
      </div>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm border border-[#3A3A3A] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#404040]"
      >
        Next
      </button>
    </div>
  );
}
