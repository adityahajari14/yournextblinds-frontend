'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { track } from '@/lib/track';

/** Fires a first-party page_view on every route change. Mounted in the root layout. */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    track('page_view');
    // searchParams included so query-only navigations (e.g. search) count too.
  }, [pathname, searchParams]);

  return null;
}
