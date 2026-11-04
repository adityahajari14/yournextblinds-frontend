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
// Full removal guide: docs/black-friday-sale-theme.md

/** The one switch. `false` restores the regular storefront. */
export const SEASONAL_SALE_ENABLED = true;

/**
 * Flip to true once the Black Friday banner files listed in BLACK_FRIDAY_SALE.heroSlides
 * exist in public/home/hero/ — until then the slides are left out so the carousel
 * never shows a broken image. Prompts: docs/black-friday-hero-banner-prompts.md
 */
const SEASONAL_HERO_BANNERS_READY = true;

export interface SeasonalHeroSlide {
  src: string;
  mobileSrc: string;
  alt: string;
  href: string;
  /** Artwork dimensions; omitted values use the regular carousel banner sizes. */
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
}

export interface SeasonalSale {
  /** Customer-facing sale name, e.g. "Black Friday Sale". */
  saleName: string;
  /** Heading of the full-width sale section. */
  sectionHeading: string;
  /** Slides shown ahead of the regular hero carousel. */
  heroSlides: SeasonalHeroSlide[];
}

const BLACK_FRIDAY_SALE: SeasonalSale = {
  saleName: 'Black Friday Sale',
  sectionHeading: 'THE BLACK FRIDAY SALE',
  heroSlides: SEASONAL_HERO_BANNERS_READY
    ? [
        {
          src: '/home/hero/hero-black-friday.webp',
          mobileSrc: '/home/hero/hero-black-friday-mobile.webp',
          width: 1983,
          height: 793,
          mobileWidth: 1182,
          mobileHeight: 1330,
          alt: 'The Black Friday Sale — extra 10% off with code FINAL10',
          href: '/collections',
        },
        {
          src: '/home/hero/hero-black-friday-blackout.webp',
          mobileSrc: '/home/hero/hero-black-friday-blackout-mobile.webp',
          width: 1983,
          height: 793,
          mobileWidth: 1182,
          mobileHeight: 1330,
          alt: 'Black Friday Sale — Blackout Roller Shades, extra 10% off with code FINAL10',
          href: '/collections/blackout-roller-shades',
        },
      ]
    : [],
};

/** The active seasonal sale, or null when the storefront is in its regular state. */
export const SEASONAL_SALE: SeasonalSale | null = SEASONAL_SALE_ENABLED ? BLACK_FRIDAY_SALE : null;
