/**
 * Honeycomb/Cellular Shades catalogue — GENERATED FILE, DO NOT EDIT BY HAND.
 *
 * Regenerate with:
 *   node scripts/extract-honeycomb-cellular-source.mjs
 *   node scripts/generate-honeycomb-cellular-catalog.mjs
 *
 * Source of truth: scripts/data/honeycomb-cellular-products.json
 */

/**
 * A sub-category card shown at the top of the honeycomb collection pages.
 * Each links to its own standalone collection (src/data/honeycombSubCollections.ts);
 * the `all` card is dropped from that list since the family page is the "all" view.
 */
export interface HoneycombSubCategoryCard {
  id: string;
  label: string;
  image: string;
  /** Control option to preselect on the product page when arriving via this card. */
  preselect?: 'motorized' | 'cordless';
}

export interface HoneycombCellularProduct {
  handle: string;
  title: string;
  priceBandName: string;
  priceGroup: number;
  subCategoryIds: string[];
}

export const HONEYCOMB_SUBCATEGORY_CARDS: HoneycombSubCategoryCard[] = [
  { id: 'all', label: 'Cellular Honeycomb Shades', image: '/collections/honeycomb-cellular/all.webp' }, // 19 products
  { id: 'light-filtering', label: 'Light Filtering Cellular Shades', image: '/collections/honeycomb-cellular/light-filtering.webp' }, // 10 products
  { id: 'blackout', label: 'Blackout Cellular Shades', image: '/collections/honeycomb-cellular/blackout.webp' }, // 9 products
  { id: 'top-down-bottom-up', label: 'Top Down Bottom Up Cellular Shades', image: '/collections/honeycomb-cellular/top-down-bottom-up.webp' }, // 0 products
  { id: 'motorized', label: 'Motorized Cellular Shades', image: '/collections/honeycomb-cellular/motorized.webp', preselect: 'motorized' }, // 19 products
  { id: 'cordless', label: 'Cordless Cellular Shades', image: '/collections/honeycomb-cellular/cordless.webp', preselect: 'cordless' }, // 19 products
  { id: 'no-drill', label: 'No Drill Cellular Shades', image: '/collections/honeycomb-cellular/no-drill.webp' }, // 19 products
  { id: 'water-resistant', label: 'Water Resistant Cellular Shades', image: '/collections/honeycomb-cellular/water-resistant.webp' }, // 2 products
  { id: 'printed', label: 'Printed Cellular Shades', image: '/collections/honeycomb-cellular/printed.webp' }, // 4 products
  { id: 'metallic-sheer', label: 'Metallic Sheer Cellular Shades', image: '/collections/honeycomb-cellular/metallic-sheer.webp' }, // 2 products
];

export const HONEYCOMB_CELLULAR_PRODUCTS: HoneycombCellularProduct[] = [
  {
    handle: 'lumina-light-filtering-cellular-honeycomb-shade-25mm-single-cell',
    title: 'Lumina Light Filtering Cellular Honeycomb Shade – 25mm Single Cell',
    priceBandName: 'Honeycomb Cellular - Group 1',
    priceGroup: 1,
    subCategoryIds: ['all', 'light-filtering', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'lumina-room-darkening-cellular-honeycomb-shade-25mm-single-cell',
    title: 'Lumina Room Darkening Cellular Honeycomb Shade – 25mm Single Cell',
    priceBandName: 'Honeycomb Cellular - Group 2',
    priceGroup: 2,
    subCategoryIds: ['all', 'blackout', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'lumina-gray-back-light-filtering-cellular-honeycomb-shade-25mm-single-cell',
    title: 'Lumina Gray Back Light Filtering Cellular Honeycomb Shade – 25mm Single Cell',
    priceBandName: 'Honeycomb Cellular - Group 3',
    priceGroup: 3,
    subCategoryIds: ['all', 'light-filtering', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'lumina-printed-light-filtering-cellular-honeycomb-shade-25mm-single-cell',
    title: 'Lumina Printed Light Filtering Cellular Honeycomb Shade – 25mm Single Cell',
    priceBandName: 'Honeycomb Cellular - Group 3',
    priceGroup: 3,
    subCategoryIds: ['all', 'light-filtering', 'printed', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'lumina-waterproof-room-darkening-cellular-honeycomb-shade-25mm-single-cell',
    title: 'Lumina Waterproof Room Darkening Cellular Honeycomb Shade – 25mm Single Cell',
    priceBandName: 'Honeycomb Cellular - Group 4',
    priceGroup: 4,
    subCategoryIds: ['all', 'blackout', 'water-resistant', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'lumina-silver-back-room-darkening-cellular-honeycomb-shade-25mm-single-cell',
    title: 'Lumina Silver Back Room Darkening Cellular Honeycomb Shade – 25mm Single Cell',
    priceBandName: 'Honeycomb Cellular - Group 4',
    priceGroup: 4,
    subCategoryIds: ['all', 'blackout', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'lumina-printed-room-darkening-cellular-honeycomb-shade-25mm-single-cell',
    title: 'Lumina Printed Room Darkening Cellular Honeycomb Shade – 25mm Single Cell',
    priceBandName: 'Honeycomb Cellular - Group 4',
    priceGroup: 4,
    subCategoryIds: ['all', 'blackout', 'printed', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'lumina-sheer-light-filtering-cellular-honeycomb-shade-25mm-single-cell',
    title: 'Lumina Sheer Light Filtering Cellular Honeycomb Shade – 25mm Single Cell',
    priceBandName: 'Honeycomb Cellular - Group 5',
    priceGroup: 5,
    subCategoryIds: ['all', 'light-filtering', 'metallic-sheer', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'element-38mm-double-cell-room-darkening-cellular-honeycomb-shade',
    title: 'Element 38mm Double Cell Room Darkening Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 7',
    priceGroup: 7,
    subCategoryIds: ['all', 'blackout', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'haven-45mm-single-cell-light-filtering-cellular-honeycomb-shade',
    title: 'Haven 45mm Single Cell Light Filtering Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 8',
    priceGroup: 8,
    subCategoryIds: ['all', 'light-filtering', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'premium-knit-45mm-single-cell-light-filtering-cellular-honeycomb-shade',
    title: 'Premium Knit 45mm Single Cell Light Filtering Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 8',
    priceGroup: 8,
    subCategoryIds: ['all', 'light-filtering', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'haven-45mm-single-cell-room-darkening-cellular-honeycomb-shade',
    title: 'Haven 45mm Single Cell Room Darkening Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 9',
    priceGroup: 9,
    subCategoryIds: ['all', 'blackout', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'element-38mm-double-cell-light-filtering-cellular-honeycomb-shade',
    title: 'Element 38mm Double Cell Light Filtering Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 6',
    priceGroup: 6,
    subCategoryIds: ['all', 'light-filtering', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'haven-45mm-single-cell-silver-back-light-filtering-cellular-honeycomb-shade',
    title: 'Haven 45mm Single Cell Silver Back Light Filtering Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 10',
    priceGroup: 10,
    subCategoryIds: ['all', 'light-filtering', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'haven-45mm-single-cell-printed-light-filtering-cellular-honeycomb-shade',
    title: 'Haven 45mm Single Cell Printed Light Filtering Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 10',
    priceGroup: 10,
    subCategoryIds: ['all', 'light-filtering', 'printed', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'haven-45mm-single-cell-waterproof-room-darkening-cellular-honeycomb-shade',
    title: 'Haven 45mm Single Cell Waterproof Room Darkening Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 11',
    priceGroup: 11,
    subCategoryIds: ['all', 'blackout', 'water-resistant', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'haven-45mm-single-cell-silver-back-room-darkening-cellular-honeycomb-shade',
    title: 'Haven 45mm Single Cell Silver Back Room Darkening Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 11',
    priceGroup: 11,
    subCategoryIds: ['all', 'blackout', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'haven-45mm-single-cell-printed-room-darkening-cellular-honeycomb-shade',
    title: 'Haven 45mm Single Cell Printed Room Darkening Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 11',
    priceGroup: 11,
    subCategoryIds: ['all', 'blackout', 'printed', 'cordless', 'motorized', 'no-drill'],
  },
  {
    handle: 'haven-45mm-single-cell-metallic-sheer-light-filtering-cellular-honeycomb-shade',
    title: 'Haven 45mm Single Cell Metallic Sheer Light Filtering Cellular Honeycomb Shade',
    priceBandName: 'Honeycomb Cellular - Group 12',
    priceGroup: 12,
    subCategoryIds: ['all', 'light-filtering', 'metallic-sheer', 'cordless', 'motorized', 'no-drill'],
  },
];

/** handle -> sub-category ids, for filtering a product list by an active card. */
export const HONEYCOMB_SUBCATEGORIES_BY_HANDLE: Record<string, string[]> =
  Object.fromEntries(HONEYCOMB_CELLULAR_PRODUCTS.map((p) => [p.handle, p.subCategoryIds]));

/** True when the product belongs to the given sub-category card. */
export function matchesHoneycombSubCategory(handle: string, subCategoryId: string): boolean {
  return HONEYCOMB_SUBCATEGORIES_BY_HANDLE[handle]?.includes(subCategoryId) ?? false;
}
