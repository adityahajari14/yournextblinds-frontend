import type { Product } from '@/types';

export const HONEYCOMB_CELLULAR_PRODUCT_HANDLE = 'honeycomb-cellular-shades';
export const HONEYCOMB_CELLULAR_TAG = 'honeycomb-cellular-shades';
export const HONEYCOMB_CELLULAR_PRICE_BAND_NAME = 'Honeycomb Cellular - Band 1';

// Compare-at price is a flat override for this product only — the sitewide
// FLASH_SALE_DISCOUNT_PERCENT (50%) doesn't produce $50 -> $150 (~67% off).
export const HONEYCOMB_CELLULAR_COMPARE_AT_PRICE = 150;

// Mirrors the width/height bands actually present in the "Honeycomb Cellular - Band 1"
// price band (pricing-data.json) — keep these in sync if that band's bands change.
export const HONEYCOMB_CELLULAR_SIZE_LIMITS = {
  minWidth: 24,
  maxWidth: 96,
  minHeight: 36,
  maxHeight: 108,
};

export const HONEYCOMB_CELLULAR_CONTROL_OPTIONS = [
  {
    id: 'hc-continuous-chain',
    name: 'Continuous Chain',
    description: 'Manual chain control with selectable left or right side.',
    price: 0,
    image: '/products/control/continues-chain-picture.webp',
  },
  {
    id: 'hc-cordless',
    name: 'Cordless',
    description: 'Child safe cordless operation.',
    price: 35.75,
    image: '/products/control/cordless-zebra-shade.webp',
  },
];

export const HONEYCOMB_CELLULAR_MOTORIZATION_OPTIONS = [
  {
    id: 'hc-single-channel',
    name: 'Single Channel',
    description: 'Single channel remote',
    price: 24,
    image: '/products/control/motorised-option.webp',
  },
  {
    id: 'hc-multi-channel',
    name: 'Multi Channel',
    description: 'Multi channel remote',
    price: 39,
    image: '/products/control/motorised-option.webp',
  },
];

export function isHoneycombCellularProduct(product: Pick<Product, 'slug' | 'tags'>) {
  return (
    product.slug === HONEYCOMB_CELLULAR_PRODUCT_HANDLE ||
    product.tags.some((tag) => tag.toLowerCase() === HONEYCOMB_CELLULAR_TAG)
  );
}
