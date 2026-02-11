'use client';

import Image from 'next/image';

interface FaviconProps {
  domain: string;
  size?: number;
  className?: string;
  onError?: () => void;
}

/**
 * Google favicon with next/image for lazy loading and width/height.
 * Uses unoptimized since these are already tiny external icons.
 */
export default function Favicon({ domain, size = 32, className, onError }: FaviconProps) {
  return (
    <Image
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`}
      alt=""
      width={size}
      height={size}
      className={className}
      unoptimized
      loading="lazy"
      onError={onError ? () => onError() : undefined}
    />
  );
}
