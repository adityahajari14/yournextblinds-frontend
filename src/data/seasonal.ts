import type { HeroSlide } from './hero';
import { FLASH_SALE_DISCOUNT_PERCENT, SALE_MAX_PERCENT } from './promo';

// ============================================
// Seasonal sale theme (temporary)
// ============================================
// Re-skins the existing offer for a festive period. Presentation only: the codes,
// percentages and pricing all still come from promo.ts and do not change.
// The campaign countdown targets endsAt; it never resets during the campaign.
//
// To end the season, set SEASONAL_SALE_ENABLED to false. Every themed surface
// (promo bar, sale section, price badges, coupon modal, popup, header line, footer,
// cart banner, hero slides, FAQ, chat knowledge) falls back to its regular styling
// and copy. The theme colours live in globals.css (--color-seasonal-*).
// Full removal guide: docs/black-friday-sale-theme.md

/** The one switch. `false` restores the regular storefront. */
export const SEASONAL_SALE_ENABLED = true;

/**
 * The seasonal slides reuse the same clean room photographs as the regular
 * carousel. Prompts and asset locations: docs/black-friday-hero-banner-prompts.md
 */
const SEASONAL_HERO_BANNERS_READY = true;

export type SeasonalHeroSlide = HeroSlide;

export interface SeasonalSale {
  /** Customer-facing sale name, e.g. "Black Friday Sale". */
  saleName: string;
  /** Heading of the full-width sale section. */
  sectionHeading: string;
  sectionDescription: string;
  ctaLabel: string;
  /** Campaign deadline in the visitor's local time, including the final second. */
  endsAt: string;
  endsLabel: string;
  /** Slides shown ahead of the regular hero carousel. */
  heroSlides: SeasonalHeroSlide[];
}

const BLACK_FRIDAY_SALE: SeasonalSale = {
  saleName: 'Black Friday Sale',
  sectionHeading: 'Your window upgrade starts here.',
  sectionDescription: 'Made-to-measure blinds at Black Friday prices.',
  ctaLabel: 'Find Your Blinds',
  endsAt: '2026-11-30T23:59:59',
  endsLabel: 'Nov 30',
  heroSlides: SEASONAL_HERO_BANNERS_READY
    ? [
        {
          id: 'black-friday',
          src: '/home/hero/room-zebra.webp',
          alt: 'Made-to-measure zebra shades in a bright living room',
          href: '/collections',
          eyebrow: 'Black Friday Event',
          headline: 'Better windows.',
          highlight: `Up to ${SALE_MAX_PERCENT}% off.`,
          description: 'Your window upgrade, at Black Friday prices.',
          ctaLabel: 'Shop Black Friday',
          seasonal: true,
        },
        {
          id: 'black-friday-blackout',
          src: '/home/hero/room-blackout.webp',
          alt: 'Made-to-measure blackout roller shade in a neutral bedroom',
          href: '/collections/blackout-roller-shades',
          eyebrow: 'Black Friday · Blackout Shades',
          headline: 'Blackout comfort.',
          highlight: `${FLASH_SALE_DISCOUNT_PERCENT}% off.`,
          description: 'A calmer room, made to your exact measurements.',
          ctaLabel: 'Shop Blackout Shades',
          seasonal: true,
        },
      ]
    : [],
};

/** The active seasonal sale, or null when the storefront is in its regular state. */
export const SEASONAL_SALE: SeasonalSale | null = SEASONAL_SALE_ENABLED ? BLACK_FRIDAY_SALE : null;
