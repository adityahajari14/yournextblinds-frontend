// Navigation Data Structure for Mega Menu
// Each category has its own unique slug at /collections/[slug]

export interface NavigationLink {
  label: string;
  href: string;
  icon?: string;
}

export interface MegaMenuColumn {
  title?: string;
  links: NavigationLink[];
  image?: {
    src: string;
    alt: string;
    href?: string;
  };
}

export interface ColorOption {
  name: string;
  color: string;
  href: string;
}

export interface RoomOption {
  name: string;
  image: string;
  href: string;
}

export interface NavigationItem {
  label: string;
  href?: string;
  megaMenu?: MegaMenuColumn[];
  colorMenu?: {
    colors: ColorOption[];
    woodFinish: ColorOption[];
    patterns: NavigationLink[];
  };
  roomMenu?: RoomOption[];
}

// Navigation items - each with unique slugs
export const navigationData: NavigationItem[] = [
  {
    label: 'Shop by Blinds Types',
    megaMenu: [
      {
        links: [
          { label: 'Vertical Blinds', href: '/collections/vertical-blinds', icon: '/nav-icons/vertical-blinds.webp' },
          { label: 'Roller Blinds', href: '/collections/roller-blinds', icon: '/nav-icons/roller-blinds.webp' },
          { label: 'Roman Blinds', href: '/collections/roman-blinds', icon: '/nav-icons/roman-blinds.webp' },
          { label: 'Venetian Blinds', href: '/collections/venetian-blinds', icon: '/nav-icons/venetian-blinds.webp' },
          { label: 'Day and Night Blinds', href: '/collections/day-and-night-blinds', icon: '/nav-icons/day-night-blinds.webp' },
        ]
      },
      {
        links: [
          { label: 'Blackout Blinds', href: '/collections/blackout-blinds', icon: '/nav-icons/vertical-blinds.webp' },
          { label: 'Skylight Blinds', href: '/collections/skylight-blinds', icon: '/nav-icons/skylight-blinds.webp' },
          { label: 'Wooden Blinds', href: '/collections/wooden-blinds', icon: '/nav-icons/wooden-blinds.webp' },
          { label: 'No Drill Blinds', href: '/collections/no-drill-blinds', icon: '/nav-icons/day-night-blinds.webp' },
        ]
      },
      {
        links: [
          { label: 'Motorized Blinds', href: '/collections/motorized-blinds', icon: '/nav-icons/roller-blinds.webp' },
          { label: 'Pleated Blinds', href: '/collections/pleated-blinds', icon: '/nav-icons/pleated-blind.webp' },
          { label: 'All Collections', href: '/collections', icon: '/nav-icons/day-night-blinds.webp' },
        ]
      }
    ]
  },
  {
    label: 'Shop by Colours',
    colorMenu: {
      colors: [
        { name: 'White', color: '#FFFFFF', href: '/collections/white-blinds' },
        { name: 'Black', color: '#292F36', href: '/collections/black-blinds' },
        { name: 'Blue', color: '#30638E', href: '/collections/blue-blinds' },
        { name: 'Yellow', color: '#DBD56E', href: '/collections/yellow-blinds' },
        { name: 'Gold', color: '#FDF3D7', href: '/collections/gold-blinds' },
        { name: 'Green', color: '#4AAD52', href: '/collections/green-blinds' },
        { name: 'Grey / Silver', color: '#BABABA', href: '/collections/grey-blinds' },
        { name: 'Purple', color: '#A23B72', href: '/collections/purple-blinds' },
        { name: 'Orange', color: '#F18F01', href: '/collections/orange-blinds' },
        { name: 'Red', color: '#CD533B', href: '/collections/red-blinds' },
        { name: 'Pink', color: '#EAB8AE', href: '/collections/pink-blinds' },
      ],
      woodFinish: [
        { name: 'Light Wood', color: '/nav-icons/light-wood.webp', href: '/collections/light-wood-blinds' },
        { name: 'Medium Wood', color: '/nav-icons/medium-wood.webp', href: '/collections/medium-wood-blinds' },
      ],
      patterns: [
        { label: 'Animal', href: '/collections/animal-pattern-blinds', icon: '/nav-icons/animal-pattern.webp' },
        { label: 'Floral', href: '/collections/floral-pattern-blinds', icon: '/nav-icons/floral-pattern.webp' },
        { label: 'Geometric', href: '/collections/geometric-pattern-blinds', icon: '/nav-icons/geometric-pattern.webp' },
        { label: 'Striped', href: '/collections/striped-pattern-blinds', icon: '/nav-icons/stripped-pattern.webp' },
      ]
    }
  },
  {
    label: 'Shop No Drill Blinds',
    megaMenu: [
      {
        links: [
          { label: 'Perfect Fit Shutter Blind', href: '/collections/perfect-fit-shutter-blinds', icon: '/nav-icons/shutter-blind.webp' },
          { label: 'Perfect Fit - Pleated', href: '/collections/perfect-fit-pleated-blinds', icon: '/nav-icons/pleated-blind.webp' },
        ]
      },
      {
        links: [
          { label: 'No Drill Rollers', href: '/collections/no-drill-roller-blinds', icon: '/nav-icons/no-drill-rollers.webp' },
          { label: 'Perfect Fit - Wooden', href: '/collections/perfect-fit-wooden-blinds', icon: '/nav-icons/vertical-blinds.webp' },
          { label: 'Perfect Fit - Metal', href: '/collections/perfect-fit-metal-blinds', icon: '/nav-icons/metal-blinds.webp' },
        ]
      }
    ]
  },
  {
    label: 'Shop By Window Type',
    megaMenu: [
      {
        links: [
          { label: 'Bay Window', href: '/collections/bay-window-blinds', icon: '/nav-icons/bay-window.svg' },
          { label: 'Conservatory Window', href: '/collections/conservatory-window-blinds', icon: '/nav-icons/conservatory-window.svg' },
          { label: 'Roof Skylight', href: '/collections/roof-skylight-blinds', icon: '/nav-icons/roof-skylight.svg' },
          { label: 'Tilt and Turn Window', href: '/collections/tilt-turn-window-blinds', icon: '/nav-icons/tilt-turn-window.svg' },
        ]
      },
      {
        links: [
          { label: 'Bi Fold Window', href: '/collections/bi-fold-window-blinds', icon: '/nav-icons/bi-fold-window.svg' },
          { label: 'French Doors', href: '/collections/french-door-blinds', icon: '/nav-icons/french-door.svg' },
          { label: 'Sliding Door', href: '/collections/sliding-door-blinds', icon: '/nav-icons/sliding-door.svg' },
        ]
      }
    ]
  },
  {
    label: 'Shop By Solution',
    megaMenu: [
      {
        links: [
          { label: 'Thermal Blinds', href: '/collections/thermal-blinds', icon: '/nav-icons/thermal-blinds.svg' },
          { label: 'Better Sleep Blinds', href: '/collections/better-sleep-blinds', icon: '/nav-icons/better-sleep-blinds.svg' },
        ]
      },
      {
        links: [
          { label: 'Cordless Blinds', href: '/collections/cordless-blinds', icon: '/nav-icons/cordless-blinds.svg' },
          { label: 'No Drill Blinds', href: '/collections/no-drill-blinds', icon: '/nav-icons/no-drill-blinds.svg' },
          { label: 'Blackout Blinds', href: '/collections/blackout-blinds', icon: '/nav-icons/blackout-blinds.svg' },
        ]
      },
      {
        links: [
          { label: 'Waterproof Blinds', href: '/collections/waterproof-blinds', icon: '/nav-icons/waterproof-blinds.svg' },
          { label: 'Easy Wipe Blinds', href: '/collections/easy-wipe-blinds', icon: '/nav-icons/easy-wipe-blinds.svg' },
        ]
      }
    ]
  },
  {
    label: 'Shop by Room',
    roomMenu: [
      { name: 'Conservatory', image: '/nav-icons/rooms-conservatory.webp', href: '/collections/conservatory-blinds' },
      { name: 'Bedroom', image: '/nav-icons/rooms-bedroom.webp', href: '/collections/bedroom-blinds' },
      { name: 'Kitchen', image: '/nav-icons/rooms-kitchen.webp', href: '/collections/kitchen-blinds' },
      { name: 'Office', image: '/nav-icons/rooms-office.webp', href: '/collections/office-blinds' },
      { name: 'Bathroom', image: '/nav-icons/rooms-bathroom.webp', href: '/collections/bathroom-blinds' },
      { name: 'Living Room', image: '/nav-icons/rooms-livingroom.webp', href: '/collections/living-room-blinds' },
      { name: 'Dining Room', image: '/nav-icons/rooms-diningroom.webp', href: '/collections/dining-room-blinds' },
      { name: 'Children', image: '/nav-icons/rooms-children.webp', href: '/collections/childrens-blinds' },
    ]
  }
];

// All possible collection slugs from navigation (for static generation)
export const ALL_COLLECTION_SLUGS = [
  // Blinds Types
  'vertical-blinds',
  'roller-blinds',
  'roman-blinds',
  'venetian-blinds',
  'day-and-night-blinds',
  'blackout-blinds',
  'skylight-blinds',
  'wooden-blinds',
  'no-drill-blinds',
  'motorized-blinds',
  'pleated-blinds',
  // Colors
  'white-blinds',
  'black-blinds',
  'blue-blinds',
  'yellow-blinds',
  'gold-blinds',
  'green-blinds',
  'grey-blinds',
  'purple-blinds',
  'orange-blinds',
  'red-blinds',
  'pink-blinds',
  'light-wood-blinds',
  'medium-wood-blinds',
  // Patterns
  'animal-pattern-blinds',
  'floral-pattern-blinds',
  'geometric-pattern-blinds',
  'striped-pattern-blinds',
  // No Drill
  'perfect-fit-shutter-blinds',
  'perfect-fit-pleated-blinds',
  'no-drill-roller-blinds',
  'perfect-fit-wooden-blinds',
  'perfect-fit-metal-blinds',
  // Window Types
  'bay-window-blinds',
  'conservatory-window-blinds',
  'roof-skylight-blinds',
  'tilt-turn-window-blinds',
  'bi-fold-window-blinds',
  'french-door-blinds',
  'sliding-door-blinds',
  // Solutions
  'thermal-blinds',
  'better-sleep-blinds',
  'cordless-blinds',
  'waterproof-blinds',
  'easy-wipe-blinds',
  // Rooms
  'conservatory-blinds',
  'bedroom-blinds',
  'kitchen-blinds',
  'office-blinds',
  'bathroom-blinds',
  'living-room-blinds',
  'dining-room-blinds',
  'childrens-blinds',
  // Custom Navigation Pages
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

// Display names for slugs (used when category not in backend)
export const COLLECTION_DISPLAY_NAMES: Record<string, string> = {
  'vertical-blinds': 'Vertical Blinds',
  'roller-blinds': 'Roller Blinds',
  'roman-blinds': 'Roman Blinds',
  'venetian-blinds': 'Venetian Blinds',
  'day-and-night-blinds': 'Day and Night Blinds',
  'blackout-blinds': 'Blackout Blinds',
  'skylight-blinds': 'Skylight Blinds',
  'wooden-blinds': 'Wooden Blinds',
  'no-drill-blinds': 'No Drill Blinds',
  'motorized-blinds': 'Motorized Blinds',
  'pleated-blinds': 'Pleated Blinds',
  'white-blinds': 'White Blinds',
  'black-blinds': 'Black Blinds',
  'blue-blinds': 'Blue Blinds',
  'yellow-blinds': 'Yellow Blinds',
  'gold-blinds': 'Gold Blinds',
  'green-blinds': 'Green Blinds',
  'grey-blinds': 'Grey Blinds',
  'purple-blinds': 'Purple Blinds',
  'orange-blinds': 'Orange Blinds',
  'red-blinds': 'Red Blinds',
  'pink-blinds': 'Pink Blinds',
  'light-wood-blinds': 'Light Wood Blinds',
  'medium-wood-blinds': 'Medium Wood Blinds',
  'animal-pattern-blinds': 'Animal Pattern Blinds',
  'floral-pattern-blinds': 'Floral Pattern Blinds',
  'geometric-pattern-blinds': 'Geometric Pattern Blinds',
  'striped-pattern-blinds': 'Striped Pattern Blinds',
  'perfect-fit-shutter-blinds': 'Perfect Fit Shutter Blinds',
  'perfect-fit-pleated-blinds': 'Perfect Fit Pleated Blinds',
  'no-drill-roller-blinds': 'No Drill Roller Blinds',
  'perfect-fit-wooden-blinds': 'Perfect Fit Wooden Blinds',
  'perfect-fit-metal-blinds': 'Perfect Fit Metal Blinds',
  'bay-window-blinds': 'Bay Window Blinds',
  'conservatory-window-blinds': 'Conservatory Window Blinds',
  'roof-skylight-blinds': 'Roof Skylight Blinds',
  'tilt-turn-window-blinds': 'Tilt and Turn Window Blinds',
  'bi-fold-window-blinds': 'Bi Fold Window Blinds',
  'french-door-blinds': 'French Door Blinds',
  'sliding-door-blinds': 'Sliding Door Blinds',
  'thermal-blinds': 'Thermal Blinds',
  'better-sleep-blinds': 'Better Sleep Blinds',
  'cordless-blinds': 'Cordless Blinds',
  'waterproof-blinds': 'Waterproof Blinds',
  'easy-wipe-blinds': 'Easy Wipe Blinds',
  'conservatory-blinds': 'Conservatory Blinds',
  'bedroom-blinds': 'Bedroom Blinds',
  'kitchen-blinds': 'Kitchen Blinds',
  'office-blinds': 'Office Blinds',
  'bathroom-blinds': 'Bathroom Blinds',
  'living-room-blinds': 'Living Room Blinds',
  'dining-room-blinds': 'Dining Room Blinds',
  'childrens-blinds': "Children's Blinds",
  // Custom Navigation Pages
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

// ===========================
// NEW NAVIGATION DATA
// ===========================

export interface NewNavigationLink {
  label: string;
  href?: string;
}

export interface NewNavigationItem {
  label: string;
  href?: string;
  submenu?: NewNavigationLink[];
}

export const newNavigationData: NewNavigationItem[] = [
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
      { label: 'Motorised EclipseCore', href: '/product/non-driii-honeycomb-blackout-blinds' },
    ]
  },
  {
    label: 'Blackout',
    submenu: [
      { label: 'Roller Shades', href: '/collections/blackout-roller-shades-category' },
      { label: 'Dual/ zebra shades', href: '/collections/blackout-dual-zebra-shades' },
      { label: 'Vertical blinds', href: '/collections/blackout-vertical-blinds-category' },
      { label: 'EclipseCore shades', href: '/collections/eclipsecore-shades' },
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

// Mapping of custom navigation slugs to their backend collection slugs
// This allows custom page titles while fetching products from existing collections
export const NAVIGATION_SLUG_MAPPING: Record<string, string> = {
  // Blinds
  'light-filtering-vertical-blinds': 'vertical-blinds',
  'blackout-vertical-blinds': 'blackout-blinds',

  // Shades
  'light-filtering-roller-shades': 'roller-blinds',
  'blackout-roller-shades': 'blackout-blinds',
  'waterproof-blackout-roller-shades': 'waterproof-blinds',
  'dual-zebra-shades': 'day-and-night-blinds',

  // Motorization
  'motorised-roller-shades': 'motorized-blinds',
  'motorised-dual-zebra-shades': 'day-and-night-blinds',
  'motorised-eclipsecore': 'motorized-blinds',

  // Blackout
  'blackout-roller-shades-category': 'blackout-blinds',
  'blackout-dual-zebra-shades': 'day-and-night-blinds',
  'blackout-vertical-blinds-category': 'vertical-blinds',
  'eclipsecore-shades': 'blackout-blinds',

  // Shop by
  'shop-by-feature': 'thermal-blinds',
  'shop-by-room': 'living-room-blinds',
};
