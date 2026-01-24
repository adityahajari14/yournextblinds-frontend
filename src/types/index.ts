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
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  estimatedDelivery: string;
  description: string;
  images: string[];
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
  clearCart: () => void;
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
  images: string[];
  videos?: string[];
  oldPrice: number | string;
  basePrice: number | string;
  createdAt: string;
  updatedAt: string;
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
}

export interface CustomizationPricing {
  category: string;
  optionId: string;
  name: string;
  prices: { widthMm: number | null; price: number }[];
}

export interface PricingRequest {
  productId: string;
  widthInches: number;
  heightInches: number;
  customizations?: {
    category: string;
    optionId: string;
  }[];
}

export interface PricingResponse {
  basePrice: number;
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
}

export interface PriceValidationResponse {
  valid: boolean;
  calculatedPrice: number;
  difference: number;
}

