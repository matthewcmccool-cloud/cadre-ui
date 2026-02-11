'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CompanyLogoProps {
  src: string;
  alt: string;
  className?: string;
  size?: number;
}

export default function CompanyLogo({ src, alt, className, size = 48 }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`bg-gray-700 rounded-full flex items-center justify-center text-white font-bold ${className || 'w-12 h-12'}`}>
        {alt?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className || 'w-12 h-12 rounded-full object-contain bg-white'}
      onError={() => setHasError(true)}
      unoptimized
      loading="lazy"
    />
  );
}
