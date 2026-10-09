// ============================================
// Seasonal sale theme (temporary)
// ============================================
// Re-skins the existing offer for a festive period. Presentation only: the codes,
// percentages and pricing all still come from promo.ts and do not change.
//
// To end the season, set SEASONAL_SALE_ENABLED to false. Every themed surface
// (promo bar, sale section, price badges, coupon modal, popup, header line, footer,
// cart banner, hero slides, FAQ, chat knowledge) falls back to its regular styling
// and copy. The theme colours live in globals.css (--color-seasonal-*).

/** The one switch. `false` restores the regular storefront. */
export const SEASONAL_SALE_ENABLED = true;

/**
 * Flip to true once the Halloween banner files listed in HALLOWEEN_SALE.heroSlides
 * exist in public/home/hero/ — until then the slides are left out so the carousel
 * never shows a broken image. Prompts: docs/halloween-hero-banner-prompts.md
 */
const SEASONAL_HERO_BANNERS_READY = false;

export interface SeasonalHeroSlide {
  src: string;
  mobileSrc: string;
  alt: string;
  href: string;
}

export interface SeasonalSale {
  /** Customer-facing sale name, e.g. "50% Off Halloween Sale". */
  saleName: string;
  /** Heading of the full-width sale section. */
  sectionHeading: string;
  /** Slides shown ahead of the regular hero carousel. */
  heroSlides: SeasonalHeroSlide[];
}

const HALLOWEEN_SALE: SeasonalSale = {
  saleName: 'Halloween Sale',
  sectionHeading: 'THE HALLOWEEN SALE',
  heroSlides: SEASONAL_HERO_BANNERS_READY
    ? [
        {
          src: '/home/hero/hero-halloween.webp',
          mobileSrc: '/home/hero/hero-halloween-mobile.webp',
          alt: 'The Halloween Sale — extra 10% off with code FINAL10',
          href: '/collections',
        },
        {
          src: '/home/hero/hero-halloween-blackout.webp',
          mobileSrc: '/home/hero/hero-halloween-blackout-mobile.webp',
          alt: 'Halloween Sale — Blackout Roller Shades, extra 10% off with code FINAL10',
          href: '/collections/blackout-roller-shades',
        },
      ]
    : [],
};

/** The active seasonal sale, or null when the storefront is in its regular state. */
export const SEASONAL_SALE: SeasonalSale | null = SEASONAL_SALE_ENABLED ? HALLOWEEN_SALE : null;
