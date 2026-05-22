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
      { label: 'Waterproof Blackout vertical blinds', href: '/collections/waterproof-blackout-vertical-blinds' },
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
      { label: 'Motorised Dual zebra shades', href: '/collections/motorised-dual-zebra-shades' },
      { label: 'Motorised EclipseCore', href: '/product/non-driii-honeycomb-blackout-blinds?motorized=true' },
    ]
  },
  {
    label: 'Blackout',
    submenu: [
      { label: 'Blackout Roller Shades', href: '/collections/blackout-roller-shades-category' },
      { label: 'Blackout Dual zebra shades', href: '/collections/blackout-dual-zebra-shades' },
      { label: 'Blackout Vertical blinds', href: '/collections/blackout-vertical-blinds-category' },
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
    href: '/guides',
  },
];

// Collection slugs from navigation (for static generation)
// Only includes slugs that are actually in the navigation menu
export const ALL_COLLECTION_SLUGS = [
  'light-filtering-vertical-blinds',
  'blackout-vertical-blinds',
  'waterproof-blackout-vertical-blinds',
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

// Custom descriptions for collection hero sections
export const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  'light-filtering-vertical-blinds': 'Custom made-to-measure light filtering vertical blinds that softly diffuse natural light while maintaining privacy. Perfect for modern homes with quality materials and easy installation.',
  'blackout-vertical-blinds': 'Made-to-measure blackout vertical blinds providing complete privacy, light control, and modern style. Custom sized for a perfect fit with quality materials and easy installation.',
  'waterproof-blackout-vertical-blinds': 'Durable waterproof blackout vertical blinds crafted from premium PVC soft fabric with 89mm slats. Custom made, easy to install, and backed by a 5-year warranty.',
  'light-filtering-roller-shades': 'Elegant light filtering roller shades that soften sunlight while maintaining natural brightness and privacy. Custom sized with premium fabrics for a perfect fit in any room.',
  'blackout-roller-shades': 'Stylish blackout roller shades designed to block sunlight, improve privacy, and enhance comfort. Custom made to measure with premium fabrics for the perfect window treatment.',
  'waterproof-blackout-roller-shades': 'Durable waterproof blackout roller shades ideal for moisture-prone environments. Custom made with premium materials for excellent light control, privacy, and long-lasting performance.',
  'dual-zebra-shades': 'Versatile dual zebra shades offering flexible light control and modern style. Custom made to measure with premium materials for the perfect day and night window covering.',
  'motorised-roller-shades': 'Convenient motorised roller shades with smooth remote-controlled operation. Custom sized with durable materials for effortless light control and modern design in any room.',
  'motorised-dual-zebra-shades': 'Stylish motorised dual zebra shades combining flexible light control with remote operation. Custom made to measure for a perfect fit in any contemporary home.',
  'blackout-roller-shades-category': 'Stylish blackout roller shades designed to block sunlight, improve privacy, and enhance comfort. Custom made to measure with premium fabrics for the perfect window treatment.',
  'blackout-dual-zebra-shades': 'Blackout dual zebra shades combining the layered zebra design with maximum light blocking. Custom made for complete privacy, light control, and modern style.',
  'blackout-vertical-blinds-category': 'Made-to-measure blackout vertical blinds providing complete privacy, light control, and modern style. Custom sized for a perfect fit with quality materials and easy installation.',
};

// Display names for collection slugs (used when category not in backend)
export const COLLECTION_DISPLAY_NAMES: Record<string, string> = {
  'light-filtering-vertical-blinds': 'Light filtering Vertical blinds',
  'blackout-vertical-blinds': 'Blackout vertical blinds',
  'waterproof-blackout-vertical-blinds': 'Waterproof Blackout vertical blinds',
  'light-filtering-roller-shades': 'Light filtering roller Shades',
  'blackout-roller-shades': 'Blackout roller Shades',
  'waterproof-blackout-roller-shades': 'Waterproof Blackout roller Shades',
  'dual-zebra-shades': 'Dual zebra Shades',
  'motorised-roller-shades': 'Motorised roller shades',
  'motorised-dual-zebra-shades': 'Motorised Dual zebra shades',
  'motorised-eclipsecore': 'Motorised EclipseCore',
  'blackout-roller-shades-category': 'Roller Shades',
  'blackout-dual-zebra-shades': 'Dual zebra shades',
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
  'waterproof-blackout-vertical-blinds': 'vertical-blinds', // Primary: vertical-blinds, Tags: waterproof, blackout

  // Shades - map to primary category
  'light-filtering-roller-shades': 'roller-blinds', // Primary: roller-blinds, Tag: light-filtering
  'blackout-roller-shades': 'roller-blinds', // Primary: roller-blinds, Tag: blackout
  'waterproof-blackout-roller-shades': 'roller-blinds', // Primary: roller-blinds, Tags: waterproof, blackout
  'dual-zebra-shades': 'day-and-night-blinds', // Primary: day-and-night-blinds

  // Motorization - map to primary category (motorized is a secondary category)
  'motorised-roller-shades': 'roller-blinds', // Primary: roller-blinds, Secondary: motorized-blinds
  'motorised-dual-zebra-shades': 'day-and-night-blinds', // Primary: day-and-night-blinds, Secondary: motorized-blinds
  'motorised-eclipsecore': 'pleated-blinds', // Primary: pleated-blinds, Secondary: motorized-blinds

  // Blackout - map to primary category (blackout is a tag)
  'blackout-roller-shades-category': 'roller-blinds', // Primary: roller-blinds, Tag: blackout
  'blackout-dual-zebra-shades': 'day-and-night-blinds', // Primary: day-and-night-blinds, Tag: blackout
  'blackout-vertical-blinds-category': 'vertical-blinds', // Primary: vertical-blinds, Tag: blackout
  'eclipsecore-shades': 'pleated-blinds', // Primary: pleated-blinds

  // Shop by - map to primary category (features are tags)
  'shop-by-feature': 'roller-blinds', // Will filter by tags (thermal, blackout, etc.)
  'shop-by-room': 'roller-blinds', // Will filter by room tags
};

// Mapping of navigation slugs to required tags for filtering
// Products must have ALL specified tags to appear on these pages
export const NAVIGATION_TAG_FILTERS: Record<string, string[]> = {
  'light-filtering-vertical-blinds': ['light-filtering'],
  'blackout-vertical-blinds': ['blackout'],
  'waterproof-blackout-vertical-blinds': ['waterproof', 'blackout'],
  'light-filtering-roller-shades': ['light-filtering'],
  'blackout-roller-shades': ['blackout'],
  'waterproof-blackout-roller-shades': ['waterproof', 'blackout'],
  'blackout-roller-shades-category': ['blackout'],
  'blackout-dual-zebra-shades': ['blackout'],
  'blackout-vertical-blinds-category': ['blackout'],
  'dual-zebra-shades': [],
  'eclipsecore-shades': [],
};

// Mapping of navigation slugs to required secondary categories for filtering
// Products must have the specified secondary category to appear on these pages
export const NAVIGATION_CATEGORY_FILTERS: Record<string, string[]> = {
  // motorised-eclipsecore intentionally omitted — shows all EclipseCore products with motorization pre-selected
};
