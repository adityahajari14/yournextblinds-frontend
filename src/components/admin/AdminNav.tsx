'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const TABS = [
  { href: '/admin/analytics', label: 'Overview', exact: true },
  { href: '/admin/analytics/abandonment', label: 'Abandonment', exact: false },
];

/** Tab strip shared by the analytics pages; carries the active date range in the URL. */
export default function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : '';

  return (
    <nav className="mb-6 flex gap-1 border-b border-gray-200">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={`${tab.href}${suffix}`}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'border-[#00473c] text-[#00473c]'
                : 'border-transparent text-gray-500 hover:text-[#3a3a3a]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
