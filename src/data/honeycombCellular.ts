import type { Product } from '@/types';

/** Tag carried by all 19 Honeycomb/Cellular products; drives the bespoke PDP. */
export const HONEYCOMB_CELLULAR_TAG = 'honeycomb-cellular-shades';

/** Collection page slug. Also the curated collection's tagSlug. */
export const HONEYCOMB_CELLULAR_COLLECTION_SLUG = 'honeycomb-cellular-shades';

/**
 * Tag carried by the standalone "Top Down Bottom Up Cordless" products —
 * separate, real Shopify products (not a filtered view of the 19 above), one
 * per non-sheer honeycomb base product. They're deliberately NOT tagged
 * HONEYCOMB_CELLULAR_TAG so they stay off the main /collections/honeycomb-
 * cellular-shades page; this tag alone drives the Top Down Bottom Up
 * collection (see curatedCollections.ts) and the bespoke PDP.
 */
export const TOP_DOWN_BOTTOM_UP_CORDLESS_TAG = 'top-down-bottom-up-cordless';

// Selectable size range for this product family, taken directly from the supplier
// catalogue's "Size Considerations for All Shades" table
// (HoneyComb_ProductCatalog_032626.pdf, p.1): min width 9" (Cordless), max width 96"
// (107" is offered via Special Quote in the doc — not reachable here, since this
// instant-quote flow has no special-quote path), min height 18", max height 120".
//
// This range is WIDER than the price grid's own coverage (24-96"W x 36-96"H, the 12
// groups in pricing-data.json). That is intentional and safe: ProductPage bypasses
// the price-matrix-derived `sizeRanges` for Honeycomb Cellular specifically so these
// bounds always win, and any size outside the grid is still priced correctly by the
// existing ceiling logic — findCeilingWidthBand/findCeilingHeightBand (client:
// src/lib/pricing.ts, server: src/lib/server/pricing.service.ts) round UP to the
// smallest available band for a too-small size, and fall back to the LARGEST band's
// price for a too-large one. So e.g. a 9"-wide order prices at the 24" rate, and a
// 120"-tall order prices at the 96" rate — never undercharged, just not a bespoke
// per-size price for the sizes the supplier hasn't priced individually.
export const HONEYCOMB_CELLULAR_SIZE_LIMITS = {
  minWidth: 9,
  maxWidth: 96,
  minHeight: 18,
  maxHeight: 120,
};

export const HONEYCOMB_CELLULAR_INSTALLATION_OPTIONS = [
  {
    id: 'inside-mount',
    name: 'Inside Mount',
    description: 'Shade is mounted inside the window recess.',
    price: 0,
    image: '/products/installation/inside-mount-cellular.webp',
  },
  {
    id: 'outside-mount',
    name: 'Outside Mount',
    description: 'Shade is mounted outside the window recess on the wall or frame.',
    price: 0,
    image: '/products/installation/outside-mount-cellular.webp',
  },
];

export const HONEYCOMB_CELLULAR_CONTROL_OPTIONS = [
  {
    id: 'hc-continuous-chain',
    name: 'Continuous Chain',
    description: 'Manual chain control with selectable left or right side.',
    price: 0,
    image: '/products/control/continuous-chain-cellular.png',
  },
  {
    id: 'hc-cordless',
    name: 'Cordless',
    description: 'Child safe cordless operation.',
    price: 35.75,
    image: '/products/control/cordless-cellular.webp',
  },
];

// A single fixed option — there is no remote-channel choice for this card, the
// flat $95 motorization base (see calculateTotalPrice / calculateProductPrice)
// already covers it. Kept as a one-item array so the surrounding code (which
// expects an options list: .find/.map/[0]) needs no special-casing.
export const HONEYCOMB_CELLULAR_MOTORIZATION_OPTIONS = [
  {
    id: 'hc-motorized-wand',
    name: 'Motorized Wand',
    description: 'Motorized control operated by wand.',
    price: 0,
    image: '/products/control/motorized-cellular.webp',
  },
];

export const HONEYCOMB_CELLULAR_NO_DRILL_UPGRADE_OPTION = {
  id: 'hc-no-drill-upgrade',
  name: 'Upgrade to No Drill System',
  description: 'Drill-free installation system.',
  price: 39,
};

/** Top Down Bottom Up Cordless only: optional sheer fabric layer added above the cellular shade. */
export const HONEYCOMB_CELLULAR_TDBU_SHEER_UPGRADE_OPTION = {
  id: 'hc-tdbu-sheer',
  name: 'Top Down Bottom Up with Additional Sheer',
  description: 'Adds a sheer fabric layer above the cellular shade for softened light with the top section lowered.',
  price: 35.99,
  image: '/products/control/top-down-bottom-up-sheer.webp',
};

/**
 * Tag-only: all 19 products carry HONEYCOMB_CELLULAR_TAG, and each has its own
 * handle, so there is no single product handle to match on. The Top Down
 * Bottom Up Cordless products also count — they use the same bespoke PDP,
 * just with the control-options section hidden (see
 * isTopDownBottomUpCordlessProduct).
 */
export function isHoneycombCellularProduct(product: Pick<Product, 'tags'>) {
  return product.tags.some(
    (tag) => tag.toLowerCase() === HONEYCOMB_CELLULAR_TAG || tag.toLowerCase() === TOP_DOWN_BOTTOM_UP_CORDLESS_TAG
  );
}

/** True for the standalone Top Down Bottom Up Cordless products (cordless-only, no control-option picker). */
export function isTopDownBottomUpCordlessProduct(product: Pick<Product, 'tags'>) {
  return product.tags.some((tag) => tag.toLowerCase() === TOP_DOWN_BOTTOM_UP_CORDLESS_TAG);
}
