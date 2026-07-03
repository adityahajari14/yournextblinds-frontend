import type { Product } from '@/types';

export const ROLLER_BAND_F_PRODUCT_HANDLE = 'roller-blind-band-f-test';
export const ROLLER_BAND_F_TAG = 'roller-band-f';
export const ROLLER_BAND_F_PRICE_BAND_NAME = 'Roller - Band F';

export const ROLLER_BAND_F_SIZE_LIMITS = {
  minWidth: 12,
  maxWidth: 96,
  minHeight: 12,
  maxHeight: 108,
};

export const ROLLER_BAND_F_HEADRAIL_OPTIONS = [
  {
    id: 'roller-f-square-flat',
    name: 'Square Flat',
    description: 'Depth required: 3.8 inches',
    price: 0,
    image: '/products/headrail/square-headrail.webp',
  },
  {
    id: 'roller-f-curved',
    name: 'Curved',
    description: 'Depth required: 4.2 inches',
    price: 0,
    image: '/products/headrail/curved-headrail.webp',
  },
  {
    id: 'roller-f-no-drill-headrail',
    name: 'No Drill Headrail',
    description: 'Depth required: 2.78 inches',
    price: 44.49,
    image: '/products/headrail/no-drill-headrail.webp',
  },
  {
    id: 'roller-f-no-headrail',
    name: 'No Headrail - visible roll',
    description: 'No headrail',
    price: 0,
    image: '/products/headrail/noheadrail.webp',
  },
];

export const ROLLER_BAND_F_WRAPPED_CASSETTE_OPTIONS = [
  { id: 'roller-f-cassette-no', name: 'No', price: 0 },
  { id: 'roller-f-cassette-yes', name: 'Yes', price: 25 },
];

export const ROLLER_BAND_F_CONTROL_OPTIONS = [
  {
    id: 'roller-f-continuous-chain',
    name: 'Continuous Chain',
    description: 'Manual chain control with selectable left or right side.',
    price: 0,
    image: '/products/control/continues-chain-picture.webp',
  },
  {
    id: 'roller-f-cordless',
    name: 'Cordless',
    description: 'Child safe cordless operation.',
    price: 35.75,
    image: '/products/control/cordless-zebra-shade.webp',
  },
];

export const ROLLER_BAND_F_MOTORIZATION_OPTIONS = [
  {
    id: 'roller-f-single-channel',
    name: 'Single Channel',
    description: 'Single channel remote',
    price: 24,
    image: '/products/control/motorised-option.webp',
  },
  {
    id: 'roller-f-multi-channel',
    name: 'Multi Channel',
    description: 'Multi channel remote',
    price: 39,
    image: '/products/control/motorised-option.webp',
  },
];

export const ROLLER_BAND_F_ROOM_DARKENING_OPTIONS = [
  {
    id: 'dimout',
    name: 'Dimout',
    price: 0,
  },
  {
    id: 'blackout',
    name: 'Blackout',
    price: 49.99,
  },
];

export const ROLLER_BAND_F_ROLL_OPTIONS = [
  { id: 'standard-roll', name: 'Standard Roll' },
  { id: 'reverse-roll', name: 'Reverse Roll' },
];

export function isRollerBandFProduct(product: Pick<Product, 'slug' | 'tags'>) {
  return (
    product.slug === ROLLER_BAND_F_PRODUCT_HANDLE ||
    product.tags.some((tag) => tag.toLowerCase() === ROLLER_BAND_F_TAG)
  );
}

export function supportsRollerBandFWrappedCassette(headrail: string | null) {
  return headrail === 'roller-f-square-flat' || headrail === 'roller-f-curved';
}

export function rollerBandFShowsRollOption(headrail: string | null) {
  return headrail === 'roller-f-no-headrail';
}
