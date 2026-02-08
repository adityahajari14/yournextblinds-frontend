// Navigation Data Structure
// Each category has its own unique slug at /collections/[slug]

// Navigation interfaces
export interface NavigationLink {
  label: string;
  href?: string;
}

export interface NavigationItem {
  label: string;
  href?: string;
  submenu?: NavigationLink[];
}

// Navigation data - used by NavBar component
export const navigationData: NavigationItem[] = [
  {
    label: 'Blinds',
    submenu: [
      { label: 'Light filtering Vertical blinds', href: '/collections/light-filtering-vertical-blinds' },
      { label: 'Blackout vertical blinds', href: '/collections/blackout-vertical-blinds' },
      { label: 'All blinds and shades', href: '/collections' },
    ]
  },
  {
    label: 'Shades',
    submenu: [
      { label: 'Light filtering roller Shades', href: '/collections/light-filtering-roller-shades' },
      { label: 'Blackout roller Shades', href: '/collections/blackout-roller-shades' },
      { label: 'Waterproof Blackout roller Shades', href: '/collections/waterproof-blackout-roller-shades' },
      { label: 'Dual zebra Shades', href: '/collections/dual-zebra-shades' },
      { label: 'All blinds and shades', href: '/collections' },
    ]
  },
  {
    label: 'Motorization',
    submenu: [
      { label: 'Motorised roller shades', href: '/collections/motorised-roller-shades' },
      { label: 'Motorised Dual / zebra shades', href: '/collections/motorised-dual-zebra-shades' },
      { label: 'Motorised EclipseCore', href: '/collections/motorised-eclipsecore' },
    ]
  },
  {
    label: 'Blackout',
    submenu: [
      { label: 'Roller Shades', href: '/collections/blackout-roller-shades-category' },
      { label: 'Dual/ zebra shades', href: '/collections/blackout-dual-zebra-shades' },
      { label: 'Vertical blinds', href: '/collections/blackout-vertical-blinds-category' },
      { label: 'EclipseCore shades', href: '/product/non-driii-honeycomb-blackout-blinds' },
    ]
  },
  {
    label: 'Shop by',
    submenu: [
      { label: 'Shop by Feature' },
      { label: 'Shop by room' },
    ]
  },
  {
    label: 'About us',
    href: '/about',
  },
  {
    label: 'Measure/fit guides',
  },
];

// Collection slugs from navigation (for static generation)
// Only includes slugs that are actually in the navigation menu
export const ALL_COLLECTION_SLUGS = [
  'light-filtering-vertical-blinds',
  'blackout-vertical-blinds',
  'light-filtering-roller-shades',
  'blackout-roller-shades',
  'waterproof-blackout-roller-shades',
  'dual-zebra-shades',
  'motorised-roller-shades',
  'motorised-dual-zebra-shades',
  'motorised-eclipsecore',
  'blackout-roller-shades-category',
  'blackout-dual-zebra-shades',
  'blackout-vertical-blinds-category',
  'eclipsecore-shades',
  'shop-by-feature',
  'shop-by-room',
];

// Display names for collection slugs (used when category not in backend)
export const COLLECTION_DISPLAY_NAMES: Record<string, string> = {
  'light-filtering-vertical-blinds': 'Light filtering Vertical blinds',
  'blackout-vertical-blinds': 'Blackout vertical blinds',
  'light-filtering-roller-shades': 'Light filtering roller Shades',
  'blackout-roller-shades': 'Blackout roller Shades',
  'waterproof-blackout-roller-shades': 'Waterproof Blackout roller Shades',
  'dual-zebra-shades': 'Dual zebra Shades',
  'motorised-roller-shades': 'Motorised roller shades',
  'motorised-dual-zebra-shades': 'Motorised Dual / zebra shades',
  'motorised-eclipsecore': 'Motorised EclipseCore',
  'blackout-roller-shades-category': 'Roller Shades',
  'blackout-dual-zebra-shades': 'Dual/ zebra shades',
  'blackout-vertical-blinds-category': 'Vertical blinds',
  'eclipsecore-shades': 'EclipseCore shades',
  'shop-by-feature': 'Shop by Feature',
  'shop-by-room': 'Shop by room',
};

// Mapping of custom navigation slugs to their backend collection slugs
// This allows custom page titles while fetching products from existing collections
// Note: Some navigation links filter by tags (e.g., blackout, thermal) rather than categories
export const NAVIGATION_SLUG_MAPPING: Record<string, string> = {
  // Blinds - map to primary category (filtering by tags will be handled separately)
  'light-filtering-vertical-blinds': 'vertical-blinds', // Primary: vertical-blinds, Tag: light-filtering
  'blackout-vertical-blinds': 'vertical-blinds', // Primary: vertical-blinds, Tag: blackout

  // Shades - map to primary category
  'light-filtering-roller-shades': 'roller-blinds', // Primary: roller-blinds, Tag: light-filtering
  'blackout-roller-shades': 'roller-blinds', // Primary: roller-blinds, Tag: blackout
  'waterproof-blackout-roller-shades': 'roller-blinds', // Primary: roller-blinds, Tags: waterproof, blackout
  'dual-zebra-shades': 'day-and-night-blinds', // Primary: day-and-night-blinds

  // Motorization - map to primary category (motorized is a secondary category)
  'motorised-roller-shades': 'roller-blinds', // Primary: roller-blinds, Secondary: motorized-blinds
  'motorised-dual-zebra-shades': 'day-and-night-blinds', // Primary: day-and-night-blinds, Secondary: motorized-blinds
  'motorised-eclipsecore': 'eclipsecore-shades', // Primary: eclipsecore-shades, Secondary: motorized-blinds

  // Blackout - map to primary category (blackout is a tag)
  'blackout-roller-shades-category': 'roller-blinds', // Primary: roller-blinds, Tag: blackout
  'blackout-dual-zebra-shades': 'day-and-night-blinds', // Primary: day-and-night-blinds, Tag: blackout
  'blackout-vertical-blinds-category': 'vertical-blinds', // Primary: vertical-blinds, Tag: blackout
  'eclipsecore-shades': 'eclipsecore-shades', // Primary: eclipsecore-shades, Tag: blackout

  // Shop by - map to primary category (features are tags)
  'shop-by-feature': 'roller-blinds', // Will filter by tags (thermal, blackout, etc.)
  'shop-by-room': 'roller-blinds', // Will filter by room tags
};

// Mapping of navigation slugs to required tags for filtering
// Products must have ALL specified tags to appear on these pages
export const NAVIGATION_TAG_FILTERS: Record<string, string[]> = {
  'light-filtering-vertical-blinds': ['light-filtering'],
  'blackout-vertical-blinds': ['blackout'],
  'light-filtering-roller-shades': ['light-filtering'],
  'blackout-roller-shades': ['blackout'],
  'waterproof-blackout-roller-shades': ['waterproof', 'blackout'],
  'blackout-roller-shades-category': ['blackout'],
  'blackout-dual-zebra-shades': ['blackout'],
  'blackout-vertical-blinds-category': ['blackout'],
};

// Mapping of navigation slugs to required secondary categories for filtering
// Products must have the specified secondary category to appear on these pages
export const NAVIGATION_CATEGORY_FILTERS: Record<string, string[]> = {
  'motorised-roller-shades': ['motorized-blinds'],
  'motorised-dual-zebra-shades': ['motorized-blinds'],
  'motorised-eclipsecore': ['motorized-blinds'],
};
