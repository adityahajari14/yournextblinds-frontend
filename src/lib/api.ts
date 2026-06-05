import {
  ApiProduct,
  ApiProductsResponse,
  ApiProductResponse,
  Product,
  DEFAULT_ESTIMATED_DELIVERY,
  DEFAULT_RATING,
  DEFAULT_REVIEW_COUNT,
  SizeBands,
  PriceBandMatrix,
  CustomizationPricing,
  PricingRequest,
  PricingResponse,
  PriceValidationResponse,
  CheckoutItemRequest,
  CheckoutResponse,
} from '@/types';
import { getCategoryCustomizations } from '@/data/categoryCustomizations';
import {
  DAY_NIGHT_BAND_H_PRODUCT_HANDLE,
  DAY_NIGHT_BAND_H_TAG,
  HIDDEN_TEST_PRODUCT_TAG,
} from '@/data/dayNightBandH';

const SERVER_API_CACHE_REVALIDATE_SECONDS =
  Number(process.env.SERVER_API_CACHE_REVALIDATE_SECONDS || 3_600);

// ============================================
// API Configuration
// ============================================

// API routes are now local Next.js Route Handlers.
// On the server side, we need the full origin; on the client side, relative URLs work.
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return ''; // Client-side: relative URLs
  }
  // Server-side: need absolute URL for fetch
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

// ============================================
// API Fetch Helpers
// ============================================

async function apiFetch<T>(endpoint: string, options?: RequestInit, retries: number = 2): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  const url = `${base}${normalizedEndpoint}`;
  const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
  const isServerSide = typeof window === 'undefined';

  const controller = new AbortController();
  const timeout = 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchOptions: RequestInit = {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    };

    const method = (fetchOptions.method || 'GET').toUpperCase();
    if (isServerSide && method === 'GET') {
      (fetchOptions as any).next = { revalidate: SERVER_API_CACHE_REVALIDATE_SECONDS };
    }

    const response = await fetch(url, fetchOptions);

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      if (!isBuildTime) {
        console.error(`API Error [${response.status}]: ${errorText}`);
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    const isConnectionError = error.code === 'ECONNREFUSED' || 
                              error.cause?.code === 'ECONNREFUSED' ||
                              (error.cause as any)?.code === 'ECONNREFUSED' ||
                              error.message?.includes('ECONNREFUSED') ||
                              error.message?.includes('fetch failed') ||
                              (error.cause as any)?.errors?.some((e: any) => e.code === 'ECONNREFUSED');

    if (isBuildTime && isConnectionError) {
      const buildError = new Error(`Backend unavailable during build: ${endpoint}`);
      (buildError as any).isBuildTimeError = true;
      throw buildError;
    }

    if (!isBuildTime && retries > 0 && (error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message?.includes('timeout'))) {
      console.warn(`Retrying fetch (${retries} attempts remaining): ${url}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetch<T>(endpoint, options, retries - 1);
    }

    if (!isBuildTime) {
      console.error('Fetch error:', error);
      console.error('Attempted URL:', url);
    }
    throw error;
  }
}

// ============================================
// Category Types & API
// ============================================

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
}

import {
  fetchShopifyProductsMerged,
  fetchShopifyProductByHandleMerged,
  fetchShopifyCollectionsMapped,
} from './shopify';

/**
 * Fetch all categories from Shopify collections.
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    return await fetchShopifyCollectionsMapped();
  } catch (error: any) {
    console.warn('Shopify categories unavailable:', error.message);
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime) return [];
    throw error;
  }
}

// ============================================
// Product API (Shopify Storefront + Backend Pricing)
// ============================================

interface FetchProductsParams {
  page?: number;
  limit?: number;
  tags?: string[];
  search?: string;
}

/**
 * Fetch products from Shopify Storefront API, merged with backend prices.
 * Falls back to backend REST API if Shopify is unavailable.
 */
export async function fetchProducts(params?: FetchProductsParams): Promise<ApiProductsResponse> {
  try {
    let allProducts = await fetchShopifyProductsMerged(params?.search);

    allProducts = allProducts.filter((product) =>
      !product.tags.some((tag) => tag.slug.toLowerCase() === HIDDEN_TEST_PRODUCT_TAG)
    );

    // Apply tag filter if specified
    if (params?.tags?.length) {
      allProducts = allProducts.filter((product) => {
        const productTagSlugs = product.tags.map((t) => t.slug);
        return params.tags!.every((tag) => productTagSlugs.includes(tag));
      });
    }

    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = allProducts.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(allProducts.length / limit);

    return {
      success: true,
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total: allProducts.length,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error: any) {
    console.warn('Shopify products unavailable:', error.message);
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime) {
      return {
        success: true,
        data: [],
        pagination: { page: 1, limit: params?.limit || 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
      };
    }
    throw error;
  }
}

/**
 * Fetch a single product by slug from Shopify.
 */
export async function fetchProductBySlug(slug: string): Promise<ApiProductResponse> {
  const emptyProduct: ApiProductResponse = {
    success: false,
    data: {
      id: '', slug: '', title: '', description: null, images: [], videos: [],
      price: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      categories: [], tags: [],
    },
  };
  const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';

  try {
    const product = await fetchShopifyProductByHandleMerged(slug);
    if (product) {
      return { success: true, data: product };
    }
    console.warn(`Product "${slug}" not found in Shopify`);
    if (isBuildTime) return emptyProduct;
    throw new Error(`Product not found: ${slug}`);
  } catch (error: any) {
    if (isBuildTime) return emptyProduct;
    throw error;
  }
}

/**
 * Fetch products filtered by category slug and optional tags.
 * Products are fetched from Shopify and filtered by their collection memberships.
 */
export async function fetchProductsByCategory(
  categorySlug: string,
  requiredTags?: string[],
  requiredCategories?: string[]
): Promise<ApiProduct[]> {
  try {
    const response = await fetchProducts({ limit: 500 });

    return response.data.filter((product) => {
      // Must have the primary category
      const hasPrimaryCategory = product.categories.some((cat) => cat.slug === categorySlug);
      if (!hasPrimaryCategory) return false;

      // Must have all required tags (if specified)
      if (requiredTags && requiredTags.length > 0) {
        const productTagSlugs = product.tags.map((tag) => tag.slug);
        const hasAllTags = requiredTags.every((tag) => productTagSlugs.includes(tag));
        if (!hasAllTags) return false;
      }

      // Must have all required secondary categories (if specified)
      if (requiredCategories && requiredCategories.length > 0) {
        const productCategorySlugs = product.categories.map((cat) => cat.slug);
        const hasAllCategories = requiredCategories.every((cat) => productCategorySlugs.includes(cat));
        if (!hasAllCategories) return false;
      }

      return true;
    });
  } catch (error: any) {
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime) return [];
    throw error;
  }
}

// ============================================
// Pricing API
// ============================================

interface PricingApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Get size bands (width and height bands) for pricing lookup
 */
export async function fetchSizeBands(): Promise<SizeBands> {
  try {
    const response = await apiFetch<PricingApiResponse<SizeBands>>('/api/pricing/bands');
    return response.data;
  } catch (error: any) {
    // Return empty structure during build if backend is unavailable
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime && (error.isBuildTimeError || error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      return { widthBands: [], heightBands: [] };
    }
    throw error;
  }
}

/**
 * Get price band matrix for a product (by handle/slug)
 */
export async function fetchPriceMatrix(handle: string): Promise<PriceBandMatrix> {
  try {
    const response = await apiFetch<PricingApiResponse<PriceBandMatrix>>(`/api/pricing/matrix/${handle}`);
    return response.data;
  } catch (error: any) {
    // Return empty structure during build if backend is unavailable
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime && (error.isBuildTimeError || error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      return { id: '', name: '', widthBands: [], heightBands: [], prices: [] };
    }
    throw error;
  }
}

/**
 * Get all customization options with their pricing
 */
export async function fetchCustomizationPricing(): Promise<CustomizationPricing[]> {
  try {
    const response = await apiFetch<PricingApiResponse<CustomizationPricing[]>>('/api/pricing/customizations');
    return response.data;
  } catch (error: any) {
    // Return empty array during build if backend is unavailable
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime && (error.isBuildTimeError || error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      return [];
    }
    throw error;
  }
}

/**
 * Calculate price for a product configuration
 */
export async function calculatePriceFromBackend(request: PricingRequest): Promise<PricingResponse> {
  const response = await apiFetch<PricingApiResponse<PricingResponse>>('/api/pricing/calculate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.data;
}

/**
 * Validate cart item price against backend calculation
 */
export async function validateCartPrice(
  request: PricingRequest,
  submittedPrice: number
): Promise<PriceValidationResponse> {
  const response = await apiFetch<PricingApiResponse<PriceValidationResponse>>('/api/pricing/validate', {
    method: 'POST',
    body: JSON.stringify({ ...request, submittedPrice }),
  });
  return response.data;
}

// ============================================
// Checkout API
// ============================================

interface CheckoutApiResponse {
  success: boolean;
  data: CheckoutResponse;
  error?: { message: string };
}

/**
 * Create a Shopify checkout session via Draft Order.
 * Sends cart items to the backend for server-side price validation,
 * which creates a Shopify Draft Order and returns a checkout URL.
 */
export async function createCheckout(
  items: CheckoutItemRequest[],
  customerEmail?: string
): Promise<CheckoutResponse> {
  const response = await apiFetch<CheckoutApiResponse>('/api/orders/create-checkout', {
    method: 'POST',
    body: JSON.stringify({
      items,
      customerEmail,
    }),
  });

  if (!response.success) {
    throw new Error((response as any).error?.message || 'Failed to create checkout');
  }

  return response.data;
}

// ============================================
// Price Utilities
// ============================================

/**
 * Converts backend price (stored without decimal point) to actual price
 * e.g., 124 in DB = $1.24 actual price
 */
function parsePrice(price: number | string): number {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return numPrice / 100;
}

/**
 * Parse fraction string to decimal (e.g., "1/4" => 0.25)
 */
function parseFraction(fraction: string): number {
  if (!fraction || fraction === '0') return 0;
  const parts = fraction.split('/');
  if (parts.length !== 2) return 0;
  const [num, denom] = parts.map(parseFloat);
  if (isNaN(num) || isNaN(denom) || denom === 0) return 0;
  return num / denom;
}

/**
 * Convert inches to meters
 */
function inchesToMeters(inches: number, fraction: string = '0'): number {
  return (inches + parseFraction(fraction)) * 0.0254;
}

/**
 * Calculate price based on area (price per square meter * area)
 */
export function calculatePrice(
  pricePerSqMeter: number | string,
  width: number,
  widthFraction: string,
  height: number,
  heightFraction: string
): number {
  const price = typeof pricePerSqMeter === 'string' ? parseFloat(pricePerSqMeter) : pricePerSqMeter;
  const widthM = inchesToMeters(width, widthFraction);
  const heightM = inchesToMeters(height, heightFraction);
  return price * widthM * heightM;
}

/**
 * Format price to 2 decimal places
 */
export function formatPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    GBP: '£', EUR: '€', USD: '$', CAD: 'C$', AUD: 'A$',
    JPY: '¥', CHF: 'CHF', CNY: '¥', INR: '₹',
  };
  return symbols[code.toUpperCase()] || code;
}

/**
 * Format price with currency symbol
 */
export function formatPriceWithCurrency(price: number, currency: string = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = formatPrice(price);
  if (['JPY', 'KRW'].includes(currency.toUpperCase())) {
    return `${symbol}${Math.round(formatted).toLocaleString()}`;
  }
  return `${symbol}${formatted.toFixed(2)}`;
}

// ============================================
// Data Transformation
// ============================================

/**
 * Transform API product data to frontend Product type
 */
/** Slug for EclipseCore / honeycomb blackout product - homepage links here; must use eclipsecore-shades features */
const ECLIPSECORE_HONEYCOMB_SLUG = 'non-driii-honeycomb-blackout-blinds';

export function transformProduct(apiProduct: ApiProduct): Product {
  const apiTagSlugs = apiProduct.tags.map(t => t.slug.toLowerCase());
  const isBandHProduct =
    apiProduct.slug === DAY_NIGHT_BAND_H_PRODUCT_HANDLE ||
    apiTagSlugs.includes(DAY_NIGHT_BAND_H_TAG);
  const categoryName = isBandHProduct
    ? 'Day and Night Blinds'
    : apiProduct.categories[0]?.name || 'Blinds';

  // Get all category slugs for the product (products can have multiple categories)
  let categorySlugs = apiProduct.categories.map(c => c.slug);

  if (isBandHProduct && !categorySlugs.includes('day-and-night-blinds')) {
    categorySlugs = ['day-and-night-blinds', ...categorySlugs];
  }

  // EclipseCore / honeycomb blackout product: ensure we use eclipsecore-shades features so
  // "Measure your window" and "Customize your blind" show Size, Blind Color, Frame Color, Opening Direction
  if (apiProduct.slug === ECLIPSECORE_HONEYCOMB_SLUG) {
    const hasEclipse = categorySlugs.some(
      (s) => s.toLowerCase().includes('eclipse') || s === 'eclipsecore-shades'
    );
    if (!hasEclipse) {
      categorySlugs = ['eclipsecore-shades', ...categorySlugs];
    }
  }

  // Price is now the minimum band price (20x20) from the backend
  const price = typeof apiProduct.price === 'string' ? parseFloat(apiProduct.price) : apiProduct.price;

  // Get category-specific customization features (pass all categories to handle multiple)
  const features = getCategoryCustomizations(categorySlugs);

  // Enable pet-friendly chain option for waterproof vertical blinds
  // 'waterproof-blackout-vertical-blinds' is a nav slug; backend products use category 'vertical-blinds' + 'waterproof' tag
  const hasPvcFabric = categorySlugs.some(s => s.toLowerCase() === 'vertical-blinds') &&
    apiTagSlugs.includes('waterproof');
  features.hasPvcFabric = hasPvcFabric;

  return {
    id: apiProduct.id,
    name: apiProduct.title,
    slug: apiProduct.slug,
    category: categoryName,
    tags: apiProduct.tags.map(t => t.slug),
    price: formatPrice(price),
    currency: 'USD',
    rating: DEFAULT_RATING,
    reviewCount: DEFAULT_REVIEW_COUNT,
    estimatedDelivery: DEFAULT_ESTIMATED_DELIVERY,
    description: apiProduct.description || '',
    images: apiProduct.images.length > 0 ? apiProduct.images : [],
    videos: apiProduct.videos || [],
    features: features,
    reviews: [],
    relatedProducts: [],
  };
}

/**
 * Get price from API product (minimum band price - 20x20)
 */
export function getProductPrice(apiProduct: ApiProduct): number {
  return typeof apiProduct.price === 'string' ? parseFloat(apiProduct.price) : apiProduct.price;
}

/**
 * Extract unique tags from products for filter options
 */
export function extractFilterOptions(products: ApiProduct[]) {
  const colors = new Set<string>();
  const patterns = new Set<string>();

  // Common color keywords
  const colorKeywords = ['white', 'black', 'grey', 'gray', 'blue', 'red', 'green', 'yellow', 'orange', 'pink', 'purple', 'brown', 'beige', 'cream', 'ivory', 'silver', 'gold'];

  // Pattern keywords
  const patternKeywords = ['floral', 'striped', 'geometric', 'abstract', 'animal', 'wood', 'plain', 'solid'];

  products.forEach((product) => {
    product.tags.forEach((tag) => {
      const tagLower = tag.slug.toLowerCase();

      // Check for colors
      for (const color of colorKeywords) {
        if (tagLower.includes(color)) {
          colors.add(color);
          break;
        }
      }

      // Check for patterns
      for (const pattern of patternKeywords) {
        if (tagLower.includes(pattern)) {
          patterns.add(pattern);
          break;
        }
      }
    });
  });

  return {
    colors: Array.from(colors).sort(),
    patterns: Array.from(patterns).sort(),
  };
}
