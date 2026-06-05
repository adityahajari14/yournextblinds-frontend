import type { Product } from '@/types';

export const DAY_NIGHT_BAND_H_PRODUCT_HANDLE = 'day-and-night-band-h-test';
export const DAY_NIGHT_BAND_H_TAG = 'day-night-band-h';
export const HIDDEN_TEST_PRODUCT_TAG = 'hidden-test-product';
export const DAY_NIGHT_BAND_H_PRICE_BAND_NAME = 'Dayandnight - Band H';

export const DAY_NIGHT_BAND_H_SIZE_LIMITS = {
  minWidth: 13,
  maxWidth: 96,
  minHeight: 11,
  maxHeight: 96,
};

export const DAY_NIGHT_BAND_H_HEADRAIL_OPTIONS = [
  {
    id: 'square-flat',
    name: 'Square Flat',
    description: 'Depth required: 3.8 inches',
    price: 0,
    image: '/products/cassette/cassette-zebra.png',
  },
  {
    id: 'curved',
    name: 'Curved',
    description: 'Depth required: 4.2 inches',
    price: 0,
    image: '/products/cassette/cassette-zebra.png',
  },
  {
    id: 'no-drill-headrail',
    name: 'No Drill Headrail',
    description: 'Depth required: 2.78 inches',
    price: 0,
    image: '/products/installation/zebra-insideMount.png',
  },
];

export const DAY_NIGHT_BAND_H_WRAPPED_CASSETTE_OPTIONS = [
  { id: 'band-h-cassette-no', name: 'No', price: 0 },
  { id: 'band-h-cassette-yes', name: 'Yes', price: 25 },
];

export const DAY_NIGHT_BAND_H_CONTROL_OPTIONS = [
  {
    id: 'continuous-chain',
    name: 'Continuous Chain',
    description: 'Manual chain control with selectable left or right side.',
    price: 0,
    image: '/products/chainColor/continuous-chain-zebra.png',
  },
  {
    id: 'cordless',
    name: 'Cordless',
    description: 'Child safe cordless operation.',
    price: 35.75,
    image: '/products/control/wand.png',
  },
  {
    id: 'no-drill-control',
    name: 'No Drill',
    description: 'Child safe no-drill control option.',
    price: 44.49,
    image: '/products/installation/zebra-insideMount.png',
  },
];

export const DAY_NIGHT_BAND_H_MOTORIZATION_OPTIONS = [
  {
    id: 'single-channel',
    name: 'Single Channel',
    description: 'Single channel remote',
    price: 24,
    image: '/products/motorization/1ch.png',
  },
  {
    id: 'multi-channel',
    name: 'Multi Channel',
    description: 'Multi channel remote',
    price: 39,
    image: '/products/motorization/6ch.png',
  },
];

export function isDayNightBandHProduct(product: Pick<Product, 'slug' | 'tags'>) {
  return (
    product.slug === DAY_NIGHT_BAND_H_PRODUCT_HANDLE ||
    product.tags.some((tag) => tag.toLowerCase() === DAY_NIGHT_BAND_H_TAG)
  );
}

export function isHiddenTestProduct(tags: Array<{ slug: string }>) {
  return tags.some((tag) => tag.slug.toLowerCase() === HIDDEN_TEST_PRODUCT_TAG);
}

export function supportsBandHWrappedCassette(headrail: string | null) {
  return headrail === 'square-flat' || headrail === 'curved';
}
