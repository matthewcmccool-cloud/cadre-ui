'use client';

import { useEffect } from 'react';
import { captureUtmParams } from '@/lib/analytics';

/** Captures UTM params from the URL on first client render. */
export default function AnalyticsProvider() {
  useEffect(() => {
    captureUtmParams();
  }, []);

  return null;
}
