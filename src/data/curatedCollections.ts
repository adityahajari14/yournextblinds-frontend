// Curated Collections
// ============================================
// Cross-cutting landing pages (window type / feature / room) that cannot be
// expressed by the one-category-plus-tags model in navigation.ts, because a
// single page needs products from several Shopify collections at once
// (e.g. "Bedroom" = blackout verticals OR rollers OR zebra shades).
//
// Each definition owns everything about its page: identity, copy, hero image,
// nav presentation, and the rule that selects its products — deliberately one
// object per collection rather than the parallel Record<> maps in navigation.ts.
//
// Selection is hybrid. If `tagSlug` is set and ANY product in the catalog
// carries that tag, the tag wins outright and `include` is ignored. That means
// adding a real `bedroom` tag in Shopify later takes over automatically with no
// code change. Until then, the `include` rules below keep every page populated.

/**
 * One AND-ed condition set. A product matches the clause only if every
 * condition present on it holds.
 */
export interface CuratedClause {
  /** Product belongs to at least one of these Shopify collection handles. */
  categories?: string[];
  /** Product carries at least one of these tag slugs. */
  tagsAny?: string[];
  /** Product carries all of these tag slugs. */
  tagsAll?: string[];
}

export interface CuratedRule {
  /** Always included, whatever the clauses say. Shopify product handles. */
  productSlugs?: string[];
  /** Product matches if ANY clause matches (OR across clauses). */
  anyOf?: CuratedClause[];
}

/**
 * `product-family` collections are whole product lines rather than a facet of the
 * catalogue. They deliberately have no nav menu of their own — curatedLinks() and
 * curatedRoomCards() only read the other three groups — so adding one here will
 * not leak it into "Shop By Features" or the room cards.
 */
export type CuratedGroup = 'window-type' | 'feature' | 'room' | 'product-family';

export interface CuratedCollection {
  slug: string;
  /** H1 and <title>. */
  title: string;
  /** Hero paragraph and meta description. */
  description: string;
  /**
   * Path under /public, pre-encoded — several source files contain spaces.
   * Omitted on window-type and feature collections: a photo of one blind can't
   * represent a set spanning several product families, so those heroes are
   * text-only. Room collections keep an image because the room itself is the
   * subject.
   */
  heroImage?: string;
  /** Which mega-menu this belongs to. */
  group: CuratedGroup;
  /** Short label used in the nav (the title is usually too long for a menu). */
  navLabel: string;
  /** Icon shown beside the nav link, or the card image for room menus. */
  navIcon: string;
  /**
   * Hybrid switch: if any product in the catalog carries this tag, products are
   * selected by tag alone and `include` is ignored.
   */
  tagSlug?: string;
  include: CuratedRule;
  /** Subtracted after `include` resolves. */
  exclude?: CuratedRule;
}

// The only ranges that actually offer a cordless control and a no-drill
// headrail: Band F rollers (ROLLER_BAND_F_CONTROL_OPTIONS / _HEADRAIL_OPTIONS),
// Band H day-and-night (DAY_NIGHT_BAND_H_*), and EclipseCore honeycomb.
// Vertical blinds are deliberately excluded — CONTROL_OPTIONS in
// src/data/customizations.ts offers them wand and chain-cord only.
const CORDLESS_CAPABLE: CuratedClause[] = [
  { categories: ['pleated-blinds'] },
  { tagsAny: ['roller-band-f', 'day-night-band-h'] },
];

export const CURATED_COLLECTIONS: Record<string, CuratedCollection> = {
  // ============================================
  // Shop By Window Type
  // ============================================
  'bay-window-blinds': {
    slug: 'bay-window-blinds',
    title: 'Bay Window Blinds',
    description:
      'Made-to-measure blinds sized individually for every pane of your bay. Order each window to its own exact measurements so the angles line up cleanly and nothing binds when you open them.',
    group: 'window-type',
    navLabel: 'Bay Window',
    navIcon: '/nav-icons/bay-window.svg',
    tagSlug: 'bay-window',
    // Bays are dressed with one blind per pane. Verticals and rollers both suit
    // the narrow, often angled panes; zebra shades are excluded because their
    // wider cassettes leave visible gaps at the mullions.
    include: { anyOf: [{ categories: ['vertical-blinds', 'roller-blinds'] }] },
  },
  'french-door-blinds': {
    slug: 'french-door-blinds',
    title: 'French Door Blinds',
    description:
      'Slim blinds that sit tight to the glass on French doors, so handles stay clear and nothing swings as the doors move. The no-drill fit leaves the frame untouched.',
    group: 'window-type',
    navLabel: 'French Doors',
    navIcon: '/nav-icons/french-door.svg',
    tagSlug: 'french-door',
    // Door-mounted, so restricted to the no-drill headrail ranges.
    include: { anyOf: CORDLESS_CAPABLE },
  },
  'sliding-door-blinds': {
    slug: 'sliding-door-blinds',
    title: 'Sliding Door Blinds',
    description:
      'Wide-span coverage for patio and sliding doors. Vertical louvers stack tightly to one side to clear the doorway, and angle to control glare without closing the room off.',
    group: 'window-type',
    navLabel: 'Sliding Door',
    navIcon: '/nav-icons/sliding-door.svg',
    tagSlug: 'sliding-door',
    // Verticals only. They are the range that stacks clear of a sliding leaf;
    // zebra shades top out at 96in and don't traverse.
    include: { anyOf: [{ categories: ['vertical-blinds'] }] },
  },

  // ============================================
  // Shop By Features
  // ============================================
  'better-sleep-blinds': {
    slug: 'better-sleep-blinds',
    title: 'Better Sleep Blinds',
    description:
      'Blinds chosen for dark, quiet bedrooms — dense blackout fabrics that hold back streetlights and early sunrises, on cordless mechanisms that stay silent when you open them.',
    group: 'feature',
    navLabel: 'Better Sleep Blinds',
    navIcon: '/nav-icons/better-sleep-blinds.svg',
    tagSlug: 'better-sleep',
    // Blackout-capable ranges that are also silent to operate (cordless).
    include: {
      anyOf: [
        ...CORDLESS_CAPABLE,
        { tagsAny: ['room-darkening'] },
        { categories: ['roller-blinds', 'day-and-night-blinds'], tagsAny: ['blackout'] },
      ],
    },
  },
  'cordless-blinds': {
    slug: 'cordless-blinds',
    title: 'Cordless Blinds',
    description:
      'No hanging cords or chains — raise and lower these by hand and they hold wherever you leave them. The safest choice where children and pets are around, and the tidiest look on any window.',
    group: 'feature',
    navLabel: 'Cordless Blinds',
    navIcon: '/nav-icons/cordless-blinds.svg',
    tagSlug: 'cordless',
    include: { anyOf: CORDLESS_CAPABLE },
  },
  'no-drill-blinds': {
    slug: 'no-drill-blinds',
    title: 'No Drill Blinds',
    description:
      'Blinds that clip straight onto the window frame — no screws, no holes, no filling them in later. Ideal for rented homes, uPVC frames and anywhere you would rather not touch the plasterwork.',
    group: 'feature',
    navLabel: 'No Drill Blinds',
    navIcon: '/nav-icons/no-drill-blinds.svg',
    tagSlug: 'no-drill',
    include: { anyOf: CORDLESS_CAPABLE },
  },
  'blackout-blinds': {
    slug: 'blackout-blinds',
    title: 'Blackout Blinds',
    description:
      'Every blackout fabric we make, in one place. Opaque linings block daylight at the pane for bedrooms, nurseries and any room with a screen in it.',
    group: 'feature',
    navLabel: 'Blackout Blinds',
    navIcon: '/nav-icons/blackout-blinds.svg',
    tagSlug: 'blackout',
    include: { anyOf: [{ tagsAll: ['blackout'] }] },
  },
  'waterproof-blinds': {
    slug: 'waterproof-blinds',
    title: 'Waterproof Blinds',
    description:
      'Moisture-resistant PVC fabrics for steamy, splash-prone rooms. They will not swell, warp or grow mildew the way a standard fabric blind does above a bath or a sink.',
    group: 'feature',
    navLabel: 'Waterproof Blinds',
    navIcon: '/nav-icons/waterproof-blinds.svg',
    tagSlug: 'waterproof',
    include: { anyOf: [{ tagsAll: ['waterproof'] }] },
  },
  'easy-wipe-blinds': {
    slug: 'easy-wipe-blinds',
    title: 'Easy Wipe Blinds',
    description:
      'Smooth-faced blinds you can clean with a damp cloth. Grease, splashes and fingerprints come straight off, so kitchen and family-room windows stay presentable without taking anything down.',
    group: 'feature',
    navLabel: 'Easy Wipe Blinds',
    navIcon: '/nav-icons/easy-wipe-blinds.svg',
    tagSlug: 'easy-wipe',
    // The waterproof PVC fabrics are the wipe-clean ones — categoryContent.ts
    // describes exactly this range as wipe-clean.
    include: { anyOf: [{ tagsAll: ['waterproof'] }] },
  },

  // ============================================
  // Shop by Room
  // ============================================
  'conservatory-blinds': {
    slug: 'conservatory-blinds',
    title: 'Conservatory Blinds',
    description:
      'Make the conservatory usable year round. These fabrics cut the glare that makes the room unbearable by mid-afternoon and add insulation to the glass once the temperature drops.',
    heroImage: '/nav-icons/rooms-conservatory.webp',
    group: 'room',
    navLabel: 'Conservatory',
    navIcon: '/nav-icons/rooms-conservatory.webp',
    tagSlug: 'conservatory',
    include: {
      anyOf: [{ categories: ['pleated-blinds'] }, { tagsAny: ['light-filtering'] }],
    },
  },
  'bedroom-blinds': {
    slug: 'bedroom-blinds',
    title: 'Bedroom Blinds',
    description:
      'Darkness and privacy where it matters most. Blackout and room-darkening fabrics keep early light and street lamps out, so the room stays dark until you decide otherwise.',
    heroImage: '/nav-icons/rooms-bedroom.webp',
    group: 'room',
    navLabel: 'Bedroom',
    navIcon: '/nav-icons/rooms-bedroom.webp',
    tagSlug: 'bedroom',
    include: { anyOf: [{ tagsAny: ['blackout', 'room-darkening', 'better-sleep'] }] },
  },
  'kitchen-blinds': {
    slug: 'kitchen-blinds',
    title: 'Kitchen Blinds',
    description:
      'Blinds that cope with steam, splashes and cooking grease. Wipe-clean surfaces and moisture-resistant fabrics near the sink and hob, plus lighter options for the rest of the room.',
    heroImage: '/nav-icons/rooms-kitchen.webp',
    group: 'room',
    navLabel: 'Kitchen',
    navIcon: '/nav-icons/rooms-kitchen.webp',
    tagSlug: 'kitchen',
    include: {
      anyOf: [
        { tagsAll: ['waterproof'] },
        { categories: ['roller-blinds'], tagsAny: ['light-filtering'] },
      ],
    },
  },
  'office-blinds': {
    slug: 'office-blinds',
    title: 'Office Blinds',
    description:
      'Screen glare is the whole problem in a workspace. These light-filtering fabrics soften direct sun off monitors while keeping the room bright enough to work in without the lights on.',
    heroImage: '/nav-icons/rooms-office.webp',
    group: 'room',
    navLabel: 'Office',
    navIcon: '/nav-icons/rooms-office.webp',
    tagSlug: 'office',
    include: {
      anyOf: [{ categories: ['vertical-blinds', 'roller-blinds'], tagsAny: ['light-filtering'] }],
    },
  },
  'bathroom-blinds': {
    slug: 'bathroom-blinds',
    title: 'Bathroom Blinds',
    description:
      'Privacy in the one room that needs it, in fabrics that survive a hot shower. Moisture-resistant PVC will not sag or spot the way a standard fabric blind does in a humid bathroom.',
    heroImage: '/nav-icons/rooms-bathroom.webp',
    group: 'room',
    navLabel: 'Bathroom',
    navIcon: '/nav-icons/rooms-bathroom.webp',
    tagSlug: 'bathroom',
    include: { anyOf: [{ tagsAll: ['waterproof'] }] },
  },
  'living-room-blinds': {
    slug: 'living-room-blinds',
    title: 'Living Room Blinds',
    description:
      'Daytime light without the glare on the TV, and privacy after dark. Zebra shades let you switch between the two by moving the fabric a few inches, no swapping anything out.',
    heroImage: '/nav-icons/rooms-livingroom.webp',
    group: 'room',
    navLabel: 'Living Room',
    navIcon: '/nav-icons/rooms-livingroom.webp',
    tagSlug: 'living-room',
    include: {
      anyOf: [
        { categories: ['day-and-night-blinds'] },
        { categories: ['roller-blinds'], tagsAny: ['light-filtering'] },
      ],
    },
  },
  'dining-room-blinds': {
    slug: 'dining-room-blinds',
    title: 'Dining Room Blinds',
    description:
      'Soft, even daylight over the table and full privacy for evening meals. Angle the louvers or drop the fabric to set the light exactly where you want it as the day goes on.',
    heroImage: '/nav-icons/rooms-diningroom.webp',
    group: 'room',
    navLabel: 'Dining Room',
    navIcon: '/nav-icons/rooms-diningroom.webp',
    tagSlug: 'dining-room',
    include: {
      anyOf: [
        { categories: ['day-and-night-blinds'] },
        { categories: ['vertical-blinds'], tagsAny: ['light-filtering'] },
      ],
    },
  },
  'kids-room-blinds': {
    slug: 'kids-room-blinds',
    title: 'Kids Room Blinds',
    description:
      'Cordless blinds with nothing hanging within reach, in blackout fabrics that hold a dark room through summer evenings and early mornings. Safety and naptime, handled together.',
    heroImage: '/nav-icons/rooms-children.webp',
    group: 'room',
    navLabel: 'Children',
    navIcon: '/nav-icons/rooms-children.webp',
    tagSlug: 'kids-room',
    include: {
      anyOf: [
        ...CORDLESS_CAPABLE,
        { categories: ['roller-blinds', 'day-and-night-blinds'], tagsAny: ['blackout', 'room-darkening'] },
      ],
    },
  },

  // The 19-product Honeycomb/Cellular line. Every product carries the
  // `honeycomb-cellular-shades` tag, so the tagSlug override (>=5 tagged products)
  // selects the whole family directly; `include` is the pre-provisioning fallback.
  // The "Shop by type" cards on this page link to standalone sub-collections
  // (src/data/honeycombSubCollections.ts), each narrowed from the generated
  // catalogue (HONEYCOMB_SUBCATEGORIES_BY_HANDLE), not from Shopify tags.
  'honeycomb-cellular-shades': {
    slug: 'honeycomb-cellular-shades',
    title: 'Honeycomb / Cellular Shades',
    description:
      'Cellular shades built from honeycomb-shaped cells that trap air at the window, so rooms hold their temperature and stay quieter. Choose single or double cell, light filtering through to full room darkening, and finishes from plain weaves to printed, metallic sheer and waterproof fabrics.',
    heroImage: '/collections/honeycomb-cellular/all.webp',
    group: 'product-family',
    navLabel: 'Honeycomb / Cellular Shades',
    navIcon: '/collections/honeycomb-cellular/all.webp',
    tagSlug: 'honeycomb-cellular-shades',
    include: { anyOf: [{ tagsAny: ['honeycomb-cellular-shades'] }] },
  },

  // Standalone "Top Down Bottom Up Cordless" products — real, separately
  // created Shopify products (one per non-sheer honeycomb base product),
  // tagged `top-down-bottom-up-cordless` and deliberately NOT tagged
  // `honeycomb-cellular-shades`, so they show up here but not on the main
  // Honeycomb/Cellular page above. See src/data/honeycombCellular.ts.
  'top-down-bottom-up-cellular-shades': {
    slug: 'top-down-bottom-up-cellular-shades',
    title: 'Top Down Bottom Up Cellular Shades',
    description:
      'Cellular honeycomb shades with a top-down bottom-up headrail, so you can lower the shade from the top for daylight and privacy at once. Cordless operation is built in — available across the honeycomb fabric range.',
    heroImage: '/collections/honeycomb-cellular/top-down-bottom-up.webp',
    group: 'product-family',
    navLabel: 'Top Down Bottom Up Cellular Shades',
    navIcon: '/collections/honeycomb-cellular/top-down-bottom-up.webp',
    tagSlug: 'top-down-bottom-up-cordless',
    include: { anyOf: [{ tagsAny: ['top-down-bottom-up-cordless'] }] },
  },
};

export const CURATED_COLLECTION_SLUGS = Object.keys(CURATED_COLLECTIONS);

export function getCuratedCollection(slug: string): CuratedCollection | undefined {
  return CURATED_COLLECTIONS[slug];
}

export function getCuratedCollectionsByGroup(group: CuratedGroup): CuratedCollection[] {
  return CURATED_COLLECTION_SLUGS.map((slug) => CURATED_COLLECTIONS[slug]).filter(
    (collection) => collection.group === group
  );
}
