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
} from '@/types';
import { getCategoryCustomizations } from '@/data/categoryCustomizations';

// ============================================
// API Configuration
// ============================================

const API_BASE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  if (typeof window !== 'undefined') {
    return 'http://localhost:5000';
  }
  return 'http://127.0.0.1:5000';
})();

// Log API URL in development
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[API] Backend URL:', API_BASE_URL);
}

// ============================================
// API Fetch Helpers
// ============================================

async function apiFetch<T>(endpoint: string, options?: RequestInit, retries: number = 2): Promise<T> {
  // Ensure endpoint starts with / and API_BASE_URL doesn't end with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const url = `${normalizedBase}${normalizedEndpoint}`;
  const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
  const isServerSide = typeof window === 'undefined';

  // Create AbortController for timeout
  // Use longer timeout for server-side requests (30s) vs client-side (10s)
  const controller = new AbortController();
  const timeout = isServerSide ? 30000 : 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Build fetch options - only include 'next' option for Next.js server-side fetches
    const fetchOptions: RequestInit = {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    };

    // Only add Next.js cache options for server-side requests
    if (isServerSide) {
      (fetchOptions as any).next = { revalidate: 60 };
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

    // Handle connection refused errors during build time gracefully
    const isConnectionError = error.code === 'ECONNREFUSED' || 
                              error.cause?.code === 'ECONNREFUSED' ||
                              (error.cause as any)?.code === 'ECONNREFUSED' ||
                              error.message?.includes('ECONNREFUSED') ||
                              error.message?.includes('fetch failed') ||
                              (error.cause as any)?.errors?.some((e: any) => e.code === 'ECONNREFUSED');

    if (isBuildTime && isConnectionError) {
      // During build, if backend is not available, throw a special error
      // that calling functions can catch and handle gracefully
      const buildError = new Error(`Backend unavailable during build: ${endpoint}`);
      (buildError as any).isBuildTimeError = true;
      throw buildError;
    }

    // Retry logic for network errors (but not during build)
    if (!isBuildTime && retries > 0 && (error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message?.includes('timeout'))) {
      console.warn(`Retrying fetch (${retries} attempts remaining): ${url}`);
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiFetch<T>(endpoint, options, retries - 1);
    }

    // Only log errors in development or client-side
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

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

/**
 * Fetch all categories from backend
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await apiFetch<CategoriesResponse>('/api/categories');
    return response.data || [];
  } catch (error: any) {
    // Return empty array during build if backend is unavailable
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime && (error.isBuildTimeError || error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      return [];
    }
    throw error;
  }
}

// ============================================
// Product API
// ============================================

interface FetchProductsParams {
  page?: number;
  limit?: number;
  tags?: string[];
  search?: string;
}

export async function fetchProducts(params?: FetchProductsParams): Promise<ApiProductsResponse> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.tags?.length) queryParams.append('tags', params.tags.join(','));
  if (params?.search) queryParams.append('search', params.search);

  const query = queryParams.toString();
  try {
    return await apiFetch<ApiProductsResponse>(`/api/products${query ? `?${query}` : ''}`);
  } catch (error: any) {
    // Return empty response during build if backend is unavailable
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime && (error.isBuildTimeError || error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      return {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: params?.limit || 20,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
    throw error;
  }
}

export async function fetchProductBySlug(slug: string): Promise<ApiProductResponse> {
  try {
    return await apiFetch<ApiProductResponse>(`/api/products/${slug}`);
  } catch (error: any) {
    // Return empty response during build if backend is unavailable
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime && (error.isBuildTimeError || error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      // Return a minimal product structure that will trigger notFound()
      return {
        success: false,
        data: {
          id: '',
          slug: '',
          title: '',
          description: null,
          images: [],
          videos: [],
          price: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categories: [],
          tags: [],
        },
      };
    }
    throw error;
  }
}

/**
 * Map frontend category slugs to backend category slugs
 * Handles cases where frontend and backend use different naming
 */
function mapCategorySlug(frontendSlug: string): string {
  // Backend uses 'day-and-night-blinds' (with 'and'), no conversion needed
  return frontendSlug;
}

/**
 * Fetch products filtered by category slug and optional tags
 * Maps frontend slug to backend slug if needed
 */
export async function fetchProductsByCategory(
  categorySlug: string,
  requiredTags?: string[],
  requiredCategories?: string[]
): Promise<ApiProduct[]> {
  try {
    const backendSlug = mapCategorySlug(categorySlug);
    const response = await fetchProducts({ limit: 500 });

    return response.data.filter((product) => {
      // Must have the primary category
      const hasPrimaryCategory = product.categories.some((cat) => cat.slug === backendSlug);
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
    // Return empty array during build if backend is unavailable
    const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';
    if (isBuildTime && (error.isBuildTimeError || error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED'))) {
      return [];
    }
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
 * Get price band matrix for a product
 */
export async function fetchPriceMatrix(productId: string): Promise<PriceBandMatrix> {
  try {
    const response = await apiFetch<PricingApiResponse<PriceBandMatrix>>(`/api/pricing/matrix/${productId}`);
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
export function transformProduct(apiProduct: ApiProduct): Product {
  const categoryName = apiProduct.categories[0]?.name || 'Blinds';
  
  // Get all category slugs for the product (products can have multiple categories)
  const categorySlugs = apiProduct.categories.map(c => c.slug);

  // Price is now the minimum band price (20x20) from the backend
  const price = typeof apiProduct.price === 'string' ? parseFloat(apiProduct.price) : apiProduct.price;

  // Get category-specific customization features (pass all categories to handle multiple)
  const features = getCategoryCustomizations(categorySlugs);

  return {
    id: apiProduct.id,
    name: apiProduct.title,
    slug: apiProduct.slug,
    category: categoryName,
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
