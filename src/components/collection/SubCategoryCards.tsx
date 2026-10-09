'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HoneycombSubCategoryCard } from '@/data/honeycombCellularCatalog';
import { HONEYCOMB_SUB_COLLECTIONS } from '@/data/honeycombSubCollections';

interface SubCategoryCardsProps {
  cards: HoneycombSubCategoryCard[];
  /** Sub-category id of the page currently being viewed, highlighted as active. */
  activeId: string;
}

/** Sub-category id -> its standalone collection URL. */
const HREF_BY_ID: Record<string, string> = Object.fromEntries(
  HONEYCOMB_SUB_COLLECTIONS.map((c) => [c.subCategoryId, `/collections/${c.slug}`])
);

/**
 * Every label besides "all" already ends in "Cellular Shades" (redundant next
 * to the "Shop by type" heading and the page's own ".../ Cellular Shades"
 * title), so the mobile chip strip strips it to leave room for the word that
 * actually distinguishes the type, e.g. "Top Down Bottom Up" instead of
 * "Top Down Bottom Up Cellular Shades".
 */
function getChipLabel(card: HoneycombSubCategoryCard): string {
  if (card.id === 'all') return 'All';
  return card.label.replace(/ Cellular Shades$/i, '').trim() || card.label;
}

/**
 * Sub-category cards shown above a collection's product grid. Each one links to
 * its own standalone collection page (see src/data/honeycombSubCollections.ts) —
 * they used to filter the grid in place, but now navigate like the homepage
 * CategoryGrid. The card matching the current page is marked active.
 */
const SubCategoryCards = ({ cards, activeId }: SubCategoryCardsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Fraction of the strip that's visible (thumb width) and how far scrolled
  // (thumb position), so the indicator bar below the chips tracks 1:1 with
  // the swipe instead of a fixed step count.
  const [scrollThumb, setScrollThumb] = useState({ widthPct: 100, leftPct: 0 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateThumb = () => {
      const { scrollWidth, clientWidth, scrollLeft } = el;
      if (scrollWidth <= clientWidth) {
        setScrollThumb({ widthPct: 100, leftPct: 0 });
        return;
      }
      const widthPct = (clientWidth / scrollWidth) * 100;
      const leftPct = (scrollLeft / (scrollWidth - clientWidth)) * (100 - widthPct);
      setScrollThumb({ widthPct, leftPct });
    };

    updateThumb();
    el.addEventListener('scroll', updateThumb, { passive: true });
    window.addEventListener('resize', updateThumb);
    return () => {
      el.removeEventListener('scroll', updateThumb);
      window.removeEventListener('resize', updateThumb);
    };
  }, [cards]);

  if (cards.length === 0) return null;

  return (
    <div className="mb-8 md:mb-10">
      <h2 className="mb-3 text-base font-medium text-[#3a3a3a] md:mb-4 md:text-lg">
        Shop by type
      </h2>

      {/* Mobile (<sm): a horizontal strip of compact circular chips — the tall
          2-col image grid below cost 5+ screens of scroll before any product
          was visible, so on small screens this trades big photos for a single
          swipeable row that fits the "shop by type" step in ~140px. */}
      <div className="sm:hidden">
        <div ref={scrollRef} className="-mx-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-4">
            {cards.map((card) => {
              const isActive = card.id === activeId;
              return (
                <Link
                  key={card.id}
                  href={HREF_BY_ID[card.id] ?? '#'}
                  aria-current={isActive ? 'page' : undefined}
                  title={card.label}
                  className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 text-center"
                >
                  <span
                    className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 transition-colors ${
                      isActive ? 'border-[#00473c]' : 'border-transparent'
                    }`}
                  >
                    <span className="relative h-full w-full overflow-hidden rounded-full bg-gray-50">
                      <Image
                        src={card.image}
                        alt={card.label}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </span>
                  </span>
                  <span
                    className={`line-clamp-2 text-xs leading-tight font-medium ${
                      isActive ? 'text-[#00473c]' : 'text-[#3a3a3a]'
                    }`}
                  >
                    {getChipLabel(card)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Scroll-position indicator — only meaningful once the strip actually
            overflows (widthPct < 100), so a short list of cards renders no bar. */}
        {scrollThumb.widthPct < 100 && (
          <div className="mt-2.5 h-1 w-full rounded-full bg-gray-200">
            <div
              className="h-1 rounded-full bg-[#00473c] transition-[width,left] duration-150"
              style={{ width: `${scrollThumb.widthPct}%`, marginLeft: `${scrollThumb.leftPct}%` }}
            />
          </div>
        )}
      </div>

      {/* sm and up: the original photo-card grid. */}
      <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {cards.map((card) => {
          const isActive = card.id === activeId;
          return (
            <Link
              key={card.id}
              href={HREF_BY_ID[card.id] ?? '#'}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex flex-col overflow-hidden rounded-sm border bg-white text-left transition-all duration-200 ${
                isActive
                  ? 'border-[#00473c] shadow-md ring-1 ring-[#00473c]'
                  : 'border-[#e8e8e8] hover:border-[#00473c] hover:shadow-md'
              }`}
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-50">
                <Image
                  src={card.image}
                  alt={card.label}
                  fill
                  sizes="(max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {isActive && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#00473c]">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>

              <span
                className={`px-3 py-2.5 text-sm font-medium transition-colors md:text-base ${
                  isActive ? 'text-[#00473c]' : 'text-[#3a3a3a] group-hover:text-[#00473c]'
                }`}
              >
                {card.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SubCategoryCards;
