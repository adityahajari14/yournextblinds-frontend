import Link from 'next/link';
import type { Metadata } from 'next';
import { Header, NavBar, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Page Not Found | Your Next Blinds',
  description: 'The page you are looking for could not be found. Browse our made-to-measure blinds and shades.',
};

const POPULAR_COLLECTIONS = [
  { label: 'All Blinds & Shades', href: '/collections' },
  { label: 'Blackout Roller Shades', href: '/collections/blackout-roller-shades' },
  { label: 'Dual Zebra Shades', href: '/collections/dual-zebra-shades' },
  { label: 'Blackout Vertical Blinds', href: '/collections/blackout-vertical-blinds' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <Header />
        <NavBar />
      </header>

      <main className="flex-1 px-4 md:px-6 lg:px-20 py-16 md:py-24">
        <div className="max-w-[640px] mx-auto text-center">
          <p className="text-sm font-medium tracking-wide text-[#00473c] uppercase mb-3">404</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#3a3a3a] mb-4">
            We couldn&apos;t find that page
          </h1>
          <p className="text-gray-600 mb-8">
            The page may have moved or no longer exists. Try searching, or start from one of our
            most popular collections below.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              href="/"
              className="inline-block bg-[#00473c] text-white py-3 px-8 rounded-lg text-base font-medium hover:bg-[#003830] transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/search"
              className="inline-block border border-[#00473c] text-[#00473c] py-3 px-8 rounded-lg text-base font-medium hover:bg-[#f0fdf9] transition-colors"
            >
              Search Products
            </Link>
          </div>

          <div className="bg-white rounded-lg p-6 text-left">
            <p className="text-sm font-semibold text-[#3a3a3a] mb-3">Popular collections</p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {POPULAR_COLLECTIONS.map((collection) => (
                <li key={collection.href}>
                  <Link
                    href={collection.href}
                    className="text-sm text-[#00473c] hover:underline"
                  >
                    {collection.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
