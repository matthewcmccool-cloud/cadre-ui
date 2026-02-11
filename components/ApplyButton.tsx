'use client';

import { trackClickApply } from '@/lib/analytics';

interface ApplyButtonProps {
  href: string;
  jobId: string;
  company: string;
  children: React.ReactNode;
  className?: string;
}

export default function ApplyButton({ href, jobId, company, children, className }: ApplyButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClickApply(jobId, company)}
      className={className}
    >
      {children}
    </a>
  );
}
