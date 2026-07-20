'use client';

import { usePathname } from 'next/navigation';
import { PromoBar, SubscribePopup } from '@/components/layout';

/**
 * Renders the storefront-wide chrome (promo bar + newsletter popup) everywhere
 * except the admin dashboard, which is a standalone internal tool and should not
 * carry marketing chrome.
 */
export function StorefrontPromoBar() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <PromoBar />;
}

export function StorefrontSubscribePopup() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <SubscribePopup />;
}
