// Honeycomb / Cellular sub-collections
// ============================================
// The "Shop by type" cards on /collections/honeycomb-cellular-shades used to
// filter the product grid in place. They are now standalone collection pages —
// /collections/<slug> — each showing only the products in one sub-category.
//
// Membership still comes from the generated catalogue
// (HONEYCOMB_SUBCATEGORIES_BY_HANDLE), not Shopify tags: several sub-categories
// (cordless, motorized, no-drill, top-down-bottom-up) are control options every
// product supports, so there is nothing to tag. The route therefore fetches the
// whole honeycomb family (via the `honeycomb-cellular-shades` curated collection)
// and filters it down to `subCategoryId` — see src/app/collections/[category]/page.tsx.
//
// The parent `all` card is intentionally dropped: /collections/honeycomb-cellular-shades
// itself is the "all" page.

import {
  HONEYCOMB_SUBCATEGORY_CARDS,
  type HoneycombSubCategoryCard,
} from './honeycombCellularCatalog';

export interface HoneycombSubCollection {
  /** Sub-category id in the generated catalogue (HONEYCOMB_SUBCATEGORIES_BY_HANDLE keys). */
  subCategoryId: string;
  /** /collections/<slug> */
  slug: string;
  /** H1 and <title>. */
  title: string;
  /** Hero paragraph and meta description. */
  description: string;
  /** Path under /public. Every sub-category has its own card image. */
  heroImage: string;
  /** The "Shop by type" card this page belongs to (carries label / image / preselect). */
  card: HoneycombSubCategoryCard;
}

/** Per-sub-category page copy, keyed by the catalogue sub-category id. */
const SUB_COLLECTION_COPY: Record<string, { slug: string; description: string }> = {
  'light-filtering': {
    slug: 'light-filtering-cellular-shades',
    description:
      'Cellular honeycomb shades that soften daylight and cut glare while keeping the room bright and private. Single and double cell weaves, plus gray-back, printed, sheer and metallic finishes.',
  },
  blackout: {
    slug: 'blackout-cellular-shades',
    description:
      'Room-darkening cellular honeycomb shades with an opaque backing that blocks outside light for bedrooms, nurseries and media rooms. The honeycomb cells add insulation at the window as well.',
  },
  'top-down-bottom-up': {
    slug: 'top-down-bottom-up-cellular-shades',
    description:
      'Cellular honeycomb shades with a top-down bottom-up headrail, so you can lower the shade from the top for daylight and privacy at once. Available across the whole honeycomb fabric range.',
  },
  motorized: {
    slug: 'motorized-cellular-shades',
    description:
      'Motorized cellular honeycomb shades operated by remote — ideal for hard-to-reach or large windows. Choose any honeycomb fabric, from light filtering through to full room darkening.',
  },
  cordless: {
    slug: 'cordless-cellular-shades',
    description:
      'Child- and pet-safe cordless cellular honeycomb shades with no operating cord. A clean look and a smooth lift, available in every honeycomb fabric and cell size we offer.',
  },
  'no-drill': {
    slug: 'no-drill-cellular-shades',
    description:
      'Cellular honeycomb shades with a no-drill mounting system that clips to the window frame — no screws, no holes. A renter-friendly fit across the full honeycomb fabric range.',
  },
  'water-resistant': {
    slug: 'water-resistant-cellular-shades',
    description:
      'Waterproof cellular honeycomb shades built for kitchens, bathrooms and other humid rooms. The fabric resists moisture and stays true without warping or staining.',
  },
  printed: {
    slug: 'printed-cellular-shades',
    description:
      'Printed cellular honeycomb shades that bring pattern and colour to the window while keeping the insulation and light control of a honeycomb cell. Light filtering and room darkening options.',
  },
  'metallic-sheer': {
    slug: 'metallic-sheer-cellular-shades',
    description:
      'Metallic sheer cellular honeycomb shades with a subtle shimmer that diffuses light softly across the room. A light-filtering finish that adds a little sparkle to the glass.',
  },
};

/**
 * "top-down-bottom-up" is deliberately excluded from routing through this
 * file even though it keeps a card in HONEYCOMB_SUBCATEGORY_CARDS: those
 * products are now standalone Shopify products selected by tag, not a filter
 * over the 19 base honeycomb products, so the slug is defined as a
 * CuratedCollection instead (src/data/curatedCollections.ts) and page.tsx
 * falls through to that lookup when getHoneycombSubCollection returns
 * undefined for it.
 */
const TAG_DRIVEN_SUBCATEGORY_IDS = new Set(['top-down-bottom-up']);

export const HONEYCOMB_SUB_COLLECTIONS: HoneycombSubCollection[] = HONEYCOMB_SUBCATEGORY_CARDS
  .filter((card) => card.id !== 'all')
  .map((card) => {
    const copy = SUB_COLLECTION_COPY[card.id];
    if (!copy) {
      throw new Error(`Honeycomb sub-category "${card.id}" has no sub-collection copy`);
    }
    return {
      subCategoryId: card.id,
      slug: copy.slug,
      title: card.label,
      description: copy.description,
      heroImage: card.image,
      card,
    };
  });

export const HONEYCOMB_SUB_COLLECTION_SLUGS = HONEYCOMB_SUB_COLLECTIONS
  .filter((c) => !TAG_DRIVEN_SUBCATEGORY_IDS.has(c.subCategoryId))
  .map((c) => c.slug);

const BY_SLUG: Record<string, HoneycombSubCollection> = Object.fromEntries(
  HONEYCOMB_SUB_COLLECTIONS
    .filter((c) => !TAG_DRIVEN_SUBCATEGORY_IDS.has(c.subCategoryId))
    .map((c) => [c.slug, c])
);

export function getHoneycombSubCollection(slug: string): HoneycombSubCollection | undefined {
  return BY_SLUG[slug];
}
