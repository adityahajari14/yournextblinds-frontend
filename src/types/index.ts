// ============================================
// Product Types
// ============================================

export interface ProductImage {
  src: string;
  alt: string;
}

export interface PriceOption {
  id: string;
  name: string;
  price?: number;
  image?: string;
  hex?: string;
}

export interface Room {
  id: string;
  name: string;
  icon: string;
}

export interface ProductReview {
  id: number;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
}

export interface ProductVariantOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  image?: string | null;
  imageAlt?: string | null;
  selectedOptions: ProductVariantOption[];
}

export interface ProductFeatures {
  hasSize: boolean;
  hasHeadrail: boolean;
  hasHeadrailColour: boolean;
  hasInstallationMethod: boolean;
  hasControlOption: boolean;
  hasStacking: boolean;
  hasControlSide: boolean;
  hasBottomChain: boolean;
  hasBracketType: boolean;
  hasChainColor: boolean;
  hasWrappedCassette: boolean;
  hasCassetteMatchingBar: boolean;
  hasMotorization: boolean;
  hasBlindColor: boolean;
  hasFrameColor: boolean;
  hasOpeningDirection: boolean;
  hasBottomBar: boolean;
  hasRollStyle: boolean;
  hasPvcFabric: boolean;
  hasRollerCassette: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  tags: string[];
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  estimatedDelivery: string;
  description: string;
  images: string[];
  variants?: ProductVariant[];
  videos?: string[];
  features: ProductFeatures;
  reviews: ProductReview[];
  relatedProducts: string[];
}

// ============================================
// Product Configuration Types
// ============================================

export interface ProductConfiguration {
  width: number;
  widthFraction: string;
  widthUnit: 'inches' | 'cm';
  height: number;
  heightFraction: string;
  heightUnit: 'inches' | 'cm';
  roomType: string | null;
  blindName: string | null;
  headrail: string | null;
  headrailColour: string | null;
  installationMethod: string | null;
  controlOption: string | null;
  stacking: string | null;
  controlSide: string | null;
  bottomChain: string | null;
  bracketType: string | null;
  chainColor: string | null;
  wrappedCassette: string | null;
  cassetteMatchingBar: string | null;
  motorization: string | null;
  blindColor: string | null;
  frameColor: string | null;
  openingDirection: string | null;
  bottomBar: string | null;
  rollStyle: string | null;
  roomDarkening: string | null;
  rollOption: string | null;
  selectedVariantId: string | null;
  selectedVariantTitle: string | null;
  selectedVariantImage: string | null;
  selectedVariantOptionName: string | null;
  selectedVariantOptionValue: string | null;
}

export const DEFAULT_CONFIGURATION: ProductConfiguration = {
  width: 0,
  widthFraction: '0',
  widthUnit: 'inches',
  height: 0,
  heightFraction: '0',
  heightUnit: 'inches',
  roomType: null,
  blindName: null,
  headrail: null,
  headrailColour: null,
  installationMethod: null,
  controlOption: null,
  stacking: null,
  controlSide: null,
  bottomChain: null,
  bracketType: null,
  chainColor: null,
  wrappedCassette: null,
  cassetteMatchingBar: null,
  motorization: null,
  blindColor: null,
  frameColor: null,
  openingDirection: null,
  bottomBar: null,
  rollStyle: null,
  roomDarkening: null,
  rollOption: null,
  selectedVariantId: null,
  selectedVariantTitle: null,
  selectedVariantImage: null,
  selectedVariantOptionName: null,
  selectedVariantOptionValue: null,
};

// ============================================
// Cart Types
// ============================================

export interface CartItem {
  id: string;
  product: Product;
  configuration: ProductConfiguration;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, configuration: ProductConfiguration) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCartItem: (itemId: string, product: Product, configuration: ProductConfiguration) => void;
  clearCart: () => void;
}

// ============================================
// Free Sample Types
// ============================================

/**
 * A single fabric/colour swatch requested as a free sample. This is deliberately
 * NOT a configured, priced product — samples carry no size, add-ons, or price, and
 * they never touch the priced cart or fire commerce analytics.
 */
export interface SampleItem {
  /** Shopify product handle the swatch belongs to. */
  productHandle: string;
  /** Human-readable product title, for display in the basket. */
  productTitle: string;
  /** Shopify variant GID — the canonical identity of the swatch (dedupe key). */
  variantId: string;
  /** Colour/fabric name shown to the customer. */
  colorName: string;
  /** Swatch image URL for the basket thumbnail. */
  swatchImage: string | null;
}

/**
 * A single selectable sample within a product. For multi-variant products this is
 * one colour/fabric variant; for products with no real variants it is the product
 * itself (a single "whole product" swatch).
 */
export interface SampleVariantOption {
  variantId: string;
  /** Display name — the colour name, or the product name for no-variant products. */
  label: string;
  image: string | null;
}

/** A sample-eligible product, grouped under its category, with its selectable swatches. */
export interface SampleProduct {
  handle: string;
  title: string;
  category: string;
  /** Product-level image, used as the card thumbnail. */
  image: string | null;
  /** True when the product has real colour variants to choose from. */
  hasVariants: boolean;
  variants: SampleVariantOption[];
}

/** Sample-eligible products grouped by category, for the stepped picker. */
export interface SampleCategory {
  name: string;
  /** Number of products in this category (for the category card). */
  productCount: number;
  products: SampleProduct[];
}

export interface SampleContextType {
  samples: SampleItem[];
  /** Number of swatches currently in the basket. */
  count: number;
  /** True once the basket has reached MAX_FREE_SAMPLES. */
  isFull: boolean;
  addSample: (sample: SampleItem) => void;
  removeSample: (variantId: string) => void;
  isInBasket: (variantId: string) => boolean;
  clearSamples: () => void;
}

// ============================================
// API Response Types
// ============================================

export interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface ApiTag {
  id: string;
  name: string;
  slug: string;
  type?: string;
}

export interface ApiProduct {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  descriptionHtml?: string | null;
  images: string[];
  imageAlts?: string[];
  variants?: ProductVariant[];
  videos?: string[];
  price: number; // Minimum price from 20x20 band
  createdAt: string;
  updatedAt: string;
  vendor?: string | null;
  productType?: string | null;
  subtitle?: string | null;
  estimatedDelivery?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  productDetails?: string | null;
  specifications?: string | null;
  measuringInstallation?: string | null;
  deliveryReturns?: string | null;
  categories: ApiCategory[];
  tags: ApiTag[];
}

export interface ApiProductsResponse {
  success: boolean;
  data: ApiProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiProductResponse {
  success: boolean;
  data: ApiProduct;
}

export interface ApiCategoriesResponse {
  success: boolean;
  data: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    productCount: number;
  }>;
}

export interface ApiTagsResponse {
  success: boolean;
  data: ApiTag[];
}

// ============================================
// Constants
// ============================================

export const DEFAULT_PRODUCT_FEATURES: ProductFeatures = {
  hasSize: true,
  hasHeadrail: false,
  hasHeadrailColour: false,
  hasInstallationMethod: false,
  hasControlOption: false,
  hasStacking: false,
  hasControlSide: false,
  hasBottomChain: false,
  hasBracketType: false,
  hasChainColor: false,
  hasWrappedCassette: false,
  hasCassetteMatchingBar: false,
  hasMotorization: false,
  hasBlindColor: false,
  hasFrameColor: false,
  hasOpeningDirection: false,
  hasBottomBar: false,
  hasRollStyle: false,
  hasPvcFabric: false,
  hasRollerCassette: false,
};

export const DEFAULT_ESTIMATED_DELIVERY = '22 December 2025';
export const DEFAULT_RATING = 5;
export const DEFAULT_REVIEW_COUNT = 0;

// ============================================
// Pricing Types
// ============================================

export interface WidthBand {
  id: string;
  mm: number;
  inches: number;
}

export interface HeightBand {
  id: string;
  mm: number;
  inches: number;
}

export interface SizeBands {
  widthBands: WidthBand[];
  heightBands: HeightBand[];
}

export interface PriceBandMatrix {
  id: string;
  name: string;
  widthBands: WidthBand[];
  heightBands: HeightBand[];
  prices: { widthMm: number; heightMm: number; price: number }[];
  /** Per-color maximum finished width (inches) for multi-table products; null when uncapped. */
  maxWidthInches?: number | null;
}

export interface CustomizationPricing {
  category: string;
  optionId: string;
  name: string;
  prices: { widthMm: number | null; price: number }[];
}

export interface PricingRequest {
  handle: string;
  widthInches: number;
  heightInches: number;
  customizations?: {
    category: string;
    optionId: string;
  }[];
  // Multi-table products (Roller Band F / Dayandnight Band H): the band depends
  // on the selected color variant. Any of these lets the server resolve it.
  variantPriceBandName?: string | null;
  variantCode?: string | null;
  variantId?: string | null;
  variantLabel?: string | null;
}

export interface PricingResponse {
  dimensionPrice: number;
  customizationPrices: {
    category: string;
    optionId: string;
    name: string;
    price: number;
  }[];
  totalPrice: number;
  widthBand: { mm: number; inches: number };
  heightBand: { mm: number; inches: number };
  oversizeSurcharge?: number;
}

export interface PriceValidationResponse {
  valid: boolean;
  calculatedPrice: number;
  difference: number;
}

// ============================================
// Checkout Types
// ============================================

export interface CheckoutItemRequest {
  handle: string;
  widthInches: number;
  heightInches: number;
  quantity: number;
  submittedPrice: number;
  configuration: Record<string, string | undefined>;
}

export interface CheckoutRequest {
  items: CheckoutItemRequest[];
  customerEmail?: string;
  note?: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  draftOrderId: string;
  lineItems: {
    handle: string;
    title: string;
    calculatedPrice: number;
    quantity: number;
  }[];
  subtotal: number;
}
