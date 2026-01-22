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
  const url = `${API_BASE_URL}${endpoint}`;
  const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'development';

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });

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
    
    // Retry logic for network errors
    if (retries > 0 && (error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message?.includes('timeout'))) {
      if (!isBuildTime) {
        console.warn(`Retrying fetch (${retries} attempts remaining): ${url}`);
      }
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
  const response = await apiFetch<CategoriesResponse>('/api/categories');
  return response.data;
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
  return apiFetch<ApiProductsResponse>(`/api/products${query ? `?${query}` : ''}`);
}

export async function fetchProductBySlug(slug: string): Promise<ApiProductResponse> {
  return apiFetch<ApiProductResponse>(`/api/products/${slug}`);
}

/**
 * Map frontend category slugs to backend category slugs
 * Handles cases where frontend and backend use different naming
 */
function mapCategorySlug(frontendSlug: string): string {
  const slugMap: Record<string, string> = {
    'day-and-night-blinds': 'day-night-blinds', // Backend uses 'day-night-blinds' (no 'and')
  };

  return slugMap[frontendSlug] || frontendSlug;
}

/**
 * Fetch products filtered by category slug
 * Maps frontend slug to backend slug if needed
 */
export async function fetchProductsByCategory(categorySlug: string): Promise<ApiProduct[]> {
  const backendSlug = mapCategorySlug(categorySlug);
  const response = await fetchProducts({ limit: 500 });

  return response.data.filter((product) =>
    product.categories.some((cat) => cat.slug === backendSlug)
  );
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
  const response = await apiFetch<PricingApiResponse<SizeBands>>('/api/pricing/bands');
  return response.data;
}

/**
 * Get price band matrix for a product
 */
export async function fetchPriceMatrix(productId: string): Promise<PriceBandMatrix> {
  const response = await apiFetch<PricingApiResponse<PriceBandMatrix>>(`/api/pricing/matrix/${productId}`);
  return response.data;
}

/**
 * Get all customization options with their pricing
 */
export async function fetchCustomizationPricing(): Promise<CustomizationPricing[]> {
  const response = await apiFetch<PricingApiResponse<CustomizationPricing[]>>('/api/pricing/customizations');
  return response.data;
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
 * e.g., 124 in DB = £1.24 actual price
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
export function formatPriceWithCurrency(price: number, currency: string = 'GBP'): string {
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
  const categorySlug = apiProduct.categories[0]?.slug || 'default';
  const basePrice = parsePrice(apiProduct.basePrice);
  const oldPrice = parsePrice(apiProduct.oldPrice);

  // Get category-specific customization features
  const features = getCategoryCustomizations(categorySlug);

  return {
    id: apiProduct.id,
    name: apiProduct.title,
    slug: apiProduct.slug,
    category: categoryName,
    price: formatPrice(basePrice),
    originalPrice: formatPrice(oldPrice),
    currency: 'GBP',
    rating: DEFAULT_RATING,
    reviewCount: DEFAULT_REVIEW_COUNT,
    estimatedDelivery: DEFAULT_ESTIMATED_DELIVERY,
    description: apiProduct.description || '',
    images: apiProduct.images.length > 0 ? apiProduct.images : [],
    features: features,
    reviews: [],
    relatedProducts: [],
  };
}

/**
 * Get base price per square meter from API product
 */
export function getBasePricePerSqM(apiProduct: ApiProduct): number {
  return parsePrice(apiProduct.basePrice);
}

/**
 * Get original price per square meter from API product
 */
export function getOriginalPricePerSqM(apiProduct: ApiProduct): number {
  return parsePrice(apiProduct.oldPrice);
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
