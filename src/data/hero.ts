/** Shared content model for every responsive home-page carousel slide. */
export interface HeroSlide {
  id: string;
  src: string;
  alt: string;
  href: string;
  eyebrow: string;
  headline: string;
  highlight: string;
  description: string;
  ctaLabel: string;
  seasonal?: boolean;
  imagePosition?: string;
}

export const REGULAR_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'made-to-fit',
    src: '/home/hero/room-zebra.webp',
    alt: 'Made-to-measure zebra shades in a bright, neutral living room',
    href: '/collections',
    eyebrow: 'Your Next Blinds',
    headline: 'Made to fit.',
    highlight: 'Made for your home.',
    description: 'Made-to-measure blinds, backed by our Fit Guarantee.',
    ctaLabel: 'Shop with Confidence',
  },
  {
    id: 'dual-zebra',
    src: '/home/hero/room-zebra.webp',
    alt: 'Dual zebra shades filtering natural light into a living room',
    href: '/collections/dual-zebra-shades',
    eyebrow: 'Dual Zebra Shades',
    headline: 'Light, your way.',
    highlight: 'Privacy on demand.',
    description: 'Switch between soft daylight and privacy in seconds.',
    ctaLabel: 'Shop Zebra Shades',
  },
  {
    id: 'blackout-roller',
    src: '/home/hero/room-blackout.webp',
    alt: 'Charcoal blackout roller shade in a calm, softly lit bedroom',
    href: '/collections/blackout-roller-shades',
    eyebrow: 'Blackout Roller Shades',
    headline: 'Switch off the day.',
    highlight: 'Rest in comfort.',
    description: 'Create a darker, more private room with shades made to fit.',
    ctaLabel: 'Shop Blackout Shades',
  },
  {
    id: 'vertical',
    src: '/home/hero/room-vertical.webp',
    alt: 'White vertical blinds across large living-room windows',
    href: '/collections/light-filtering-vertical-blinds',
    eyebrow: 'Vertical Blinds',
    headline: 'A perfect fit.',
    highlight: 'A brighter room.',
    description: 'Simple light control for wide windows and sliding doors.',
    ctaLabel: 'Shop Vertical Blinds',
  },
  {
    id: 'honeycomb',
    src: '/home/hero/room-honeycomb.webp',
    alt: 'Charcoal honeycomb shade in a warm, contemporary room',
    href: '/product/non-driii-honeycomb-blackout-blinds',
    eyebrow: 'Honeycomb Shades',
    headline: 'Less light.',
    highlight: 'More comfort.',
    description: 'Discover cellular shades with a clean finish and a custom fit.',
    ctaLabel: 'Explore Honeycomb Shades',
  },
];
