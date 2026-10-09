'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Forces the window back to the top on forward (push/replace) navigations.
 *
 * Next's App Router is supposed to do this itself, but its scroll handler bails
 * out when the destination's first non-skipped element is already within the
 * viewport band — which happens routinely here because every page opens with a
 * `position: sticky` header (skipped by the router) followed by content that
 * streams in behind `loading.tsx` / `<Suspense>`. The net effect is that a new
 * page inherits the previous page's scroll offset (e.g. open a product from a
 * collection scrolled 40% and the product page also opens at 40%).
 *
 * Back/forward navigations are left untouched so the browser's own scroll
 * restoration still works, and in-page `#anchor` links are left alone.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const isPopNavigation = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const markPop = () => {
      isPopNavigation.current = true;
    };
    window.addEventListener('popstate', markPop);
    return () => window.removeEventListener('popstate', markPop);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      // Initial document load / reload: leave the browser's own scroll
      // restoration alone.
      isFirstRender.current = false;
      return;
    }
    if (isPopNavigation.current) {
      // Back/forward: let the browser restore the remembered position.
      isPopNavigation.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
