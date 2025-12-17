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
  hasRoom: boolean;
  hasMount: boolean;
  hasHeadrail: boolean;
  hasOpenStyle: boolean;
  hasWandPosition: boolean;
  hasValance: boolean;
  hasBottomChain: boolean;
  hasBracketType: boolean;
  hasControl: boolean;
  hasColour: boolean;
  hasRollerStyle: boolean;
  hasFabricType: boolean;
  hasBottomBar: boolean;
  hasLift: boolean;
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
  widthUnit: string;
  height: number;
  heightFraction: string;
  heightUnit: string;
  room: string | null;
  mount: string;
  headrail: string | null;
  openStyle: string | null;
  wandPosition: string | null;
  valance: string | null;
  bottomChain: string | null;
  bracketType: string | null;
  control: string | null;
  controlPosition: string | null;
  colour: string | null;
  rollerStyle: string | null;
  fabricType: string | null;
  bottomBar: string | null;
  lift: string | null;
  liftPosition: string | null;
}

export const DEFAULT_CONFIGURATION: ProductConfiguration = {
  width: 0,
  widthFraction: '0',
  widthUnit: 'inches',
  height: 0,
  heightFraction: '0',
  heightUnit: 'inches',
  room: null,
  mount: 'inside',
  headrail: null,
  openStyle: null,
  wandPosition: null,
  valance: null,
  bottomChain: null,
  bracketType: null,
  control: null,
  controlPosition: null,
  colour: null,
  rollerStyle: null,
  fabricType: null,
  bottomBar: null,
  lift: null,
  liftPosition: null,
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
  hasRoom: true,
  hasMount: true,
  hasHeadrail: false,
  hasOpenStyle: false,
  hasWandPosition: false,
  hasValance: false,
  hasBottomChain: false,
  hasBracketType: false,
  hasControl: false,
  hasColour: false,
  hasRollerStyle: false,
  hasFabricType: false,
  hasBottomBar: false,
  hasLift: false,
};

export const DEFAULT_ESTIMATED_DELIVERY = '22 December 2025';
export const DEFAULT_RATING = 5;
export const DEFAULT_REVIEW_COUNT = 0;
