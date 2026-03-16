// ============================================
// Shopify Storefront API Client
// ============================================
// Fetches product catalog data (titles, descriptions, images,
// collections, tags) directly from Shopify's public Storefront API.
// Pricing and checkout use local Next.js API routes.

import type { ApiProduct, ApiCategory, ApiTag } from '@/types';

// ============================================
// Configuration
// ============================================

const SHOPIFY_STORE_DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
const SHOPIFY_STOREFRONT_TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '';
const SHOPIFY_API_VERSION = '2025-01';

const STOREFRONT_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

// ============================================
// Storefront GraphQL Types
// ============================================

interface StorefrontImage {
  url: string;
  altText: string | null;
}

interface StorefrontCollection {
  id: string;
  handle: string;
  title: string;
  description: string | null;
}

interface StorefrontProduct {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  images: {
    edges: Array<{ node: StorefrontImage }>;
  };
  collections: {
    edges: Array<{ node: StorefrontCollection }>;
  };
}

interface StorefrontProductsResponse {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: Array<{ node: StorefrontProduct }>;
  };
}

interface StorefrontProductByHandleResponse {
  product: StorefrontProduct | null;
}

interface StorefrontCollectionsResponse {
  collections: {
    edges: Array<{
      node: {
        id: string;
        handle: string;
        title: string;
        description: string | null;
      };
    }>;
  };
}

// ============================================
// Customer Types
// ============================================

export interface ShopifyCustomer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
}

// ============================================
// GraphQL Queries
// ============================================

const PRODUCT_FIELDS = `
  id
  handle
  title
  descriptionHtml
  tags
  createdAt
  updatedAt
  images(first: 20) {
    edges {
      node {
        url
        altText
      }
    }
  }
  collections(first: 10) {
    edges {
      node {
        id
        handle
        title
        description
      }
    }
  }
`;

const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ${PRODUCT_FIELDS}
        }
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      ${PRODUCT_FIELDS}
    }
  }
`;

const COLLECTIONS_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
        }
      }
    }
  }
`;

// ============================================
// Customer GraphQL Query
// ============================================

const CUSTOMER_FIELDS = `
  id
  firstName
  lastName
  emailAddress {
    emailAddress
  }
`;

const CUSTOMER_QUERY = `
  query customer($customerAccessToken: String!) {
    customer {
      ${CUSTOMER_FIELDS}
    }
  }
`;

// ============================================
// GraphQL Fetch Helper
// ============================================

async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error(
      'Shopify Storefront API credentials not configured. Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN.'
    );
  }

  const isServerSide = typeof window === 'undefined';

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  };

  // Use Next.js ISR cache for server-side requests
  if (isServerSide) {
    fetchOptions.next = { revalidate: 60 };
  }

  const response = await fetch(STOREFRONT_URL, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Shopify Storefront API error [${response.status}]: ${errorText}`
    );
  }

  const json = await response.json();

  if (json.errors) {
    console.error('Shopify GraphQL errors:', json.errors);
    throw new Error(
      `Shopify GraphQL error: ${json.errors[0]?.message || 'Unknown error'}`
    );
  }

  return json.data as T;
}

// ============================================
// Data Mapping Helpers
// ============================================

/**
 * Convert a string to a URL-friendly slug.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Map a Shopify Storefront product to our ApiProduct type.
 * Uses minimum prices map (handle → price) from the backend pricing engine.
 */
function mapStorefrontProduct(
  sfProduct: StorefrontProduct,
  minimumPrices: Record<string, number>
): ApiProduct {
  const categories: ApiCategory[] = sfProduct.collections.edges.map(
    (edge) => ({
      id: edge.node.id,
      slug: edge.node.handle,
      name: edge.node.title,
      description: edge.node.description,
    })
  );

  const tags: ApiTag[] = sfProduct.tags.map((tag) => ({
    id: slugify(tag),
    name: tag,
    slug: slugify(tag),
  }));

  return {
    id: sfProduct.id,
    slug: sfProduct.handle,
    title: sfProduct.title,
    description: sfProduct.descriptionHtml || null,
    images: sfProduct.images.edges.map((edge) => edge.node.url),
    videos: [],
    price: minimumPrices[sfProduct.handle] || 0,
    createdAt: sfProduct.createdAt,
    updatedAt: sfProduct.updatedAt,
    categories,
    tags,
  };
}

// ============================================
// Public API Functions
// ============================================

/**
 * Fetch all products from Shopify Storefront API (handles pagination).
 * Returns up to ~1000 products across multiple pages.
 */
export async function fetchAllShopifyProducts(
  searchQuery?: string
): Promise<StorefrontProduct[]> {
  const allProducts: StorefrontProduct[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const variables: Record<string, unknown> = {
      first: 250,
      after: cursor,
    };

    if (searchQuery) {
      variables.query = searchQuery;
    }

    const data =
      await storefrontFetch<StorefrontProductsResponse>(
        PRODUCTS_QUERY,
        variables
      );

    const { edges, pageInfo } = data.products;
    allProducts.push(...edges.map((edge) => edge.node));

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  return allProducts;
}

/**
 * Fetch a single product by its handle (slug) from Shopify.
 */
export async function fetchShopifyProductByHandle(
  handle: string
): Promise<StorefrontProduct | null> {
  const data =
    await storefrontFetch<StorefrontProductByHandleResponse>(
      PRODUCT_BY_HANDLE_QUERY,
      { handle }
    );

  return data.product;
}

/**
 * Fetch all collections from Shopify.
 */
export async function fetchShopifyCollections(): Promise<
  Array<{
    id: string;
    handle: string;
    title: string;
    description: string | null;
  }>
> {
  const data =
    await storefrontFetch<StorefrontCollectionsResponse>(
      COLLECTIONS_QUERY,
      { first: 50 }
    );

  return data.collections.edges.map((edge) => edge.node);
}

// ============================================
// Merged Fetch Functions
// (These combine Shopify catalog data with backend product IDs/prices)
// ============================================

/**
 * Fetch minimum prices (handle → price) from our backend pricing engine.
 * Cached for 60 seconds to avoid repeated calls.
 */
let cachedMinimumPrices: Record<string, number> | null = null;
let pricesCacheTime = 0;
const PRICES_CACHE_TTL = 60_000; // 60 seconds

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

async function getMinimumPrices(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedMinimumPrices && now - pricesCacheTime < PRICES_CACHE_TTL) {
    return cachedMinimumPrices;
  }

  const isServerSide = typeof window === 'undefined';

  // On the server, call pricing service directly instead of HTTP-calling our own API route.
  // This avoids 401 issues on Vercel deployments with protection enabled.
  if (isServerSide) {
    const pricingService = await import('@/lib/server/pricing.service');
    cachedMinimumPrices = await pricingService.getMinimumPricesByHandle();
    pricesCacheTime = now;
    return cachedMinimumPrices;
  }

  const base = getApiBaseUrl();

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
    headers: { 'Content-Type': 'application/json' },
  };

  const response = await fetch(`${base}/api/pricing/minimum-prices`, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch minimum prices: ${response.status}`);
  }

  const json = await response.json();
  cachedMinimumPrices = json.data;
  pricesCacheTime = now;
  return cachedMinimumPrices!;
}

/**
 * Fetch all products from Shopify, merged with backend minimum prices.
 * This is the primary product fetch function.
 */
export async function fetchShopifyProductsMerged(
  searchQuery?: string
): Promise<ApiProduct[]> {
  const [sfProducts, minimumPrices] = await Promise.all([
    fetchAllShopifyProducts(searchQuery),
    getMinimumPrices(),
  ]);

  return sfProducts.map((sfProduct) =>
    mapStorefrontProduct(sfProduct, minimumPrices)
  );
}

/**
 * Fetch a single product from Shopify by handle, merged with backend price.
 */
export async function fetchShopifyProductByHandleMerged(
  handle: string
): Promise<ApiProduct | null> {
  const [sfProduct, minimumPrices] = await Promise.all([
    fetchShopifyProductByHandle(handle),
    getMinimumPrices(),
  ]);

  if (!sfProduct) return null;

  return mapStorefrontProduct(sfProduct, minimumPrices);
}

/**
 * Fetch collections from Shopify, mapped to the Category type used in the frontend.
 */
export async function fetchShopifyCollectionsMapped(): Promise<
  Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    productCount: number;
  }>
> {
  const collections = await fetchShopifyCollections();

  return collections.map((col) => ({
    id: col.id,
    slug: col.handle,
    name: col.title,
    description: col.description,
    productCount: 0, // Count is determined from product data
  }));
}

// ============================================
// Customer Account Functions
// ============================================

/**
 * Fetch the currently authenticated customer's profile.
 */
export async function shopifyCustomerFetch(
  accessToken: string
): Promise<ShopifyCustomer | null> {
  const discoveryResponse = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/.well-known/customer-account-api`,
    { cache: 'no-store' }
  );

  if (!discoveryResponse.ok) {
    throw new Error(`Customer account API discovery failed: ${discoveryResponse.status}`);
  }

  const discoveryJson: { graphql_api: string } = await discoveryResponse.json();
  const response = await fetch(discoveryJson.graphql_api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken,
      Origin: typeof window === 'undefined'
        ? (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'))
        : window.location.origin,
      'User-Agent': 'yournextblinds-headless-auth',
    },
    body: JSON.stringify({
      query: `query Customer { customer { ${CUSTOMER_FIELDS} } }`,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Customer account API error: ${response.status}`);
  }

  const json: {
    data?: {
      customer?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        emailAddress?: { emailAddress: string } | null;
      } | null;
    };
    errors?: Array<{ message: string }>;
  } = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || 'Customer account GraphQL error');
  }

  const customer = json.data?.customer;
  if (!customer?.emailAddress?.emailAddress) {
    return null;
  }

  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.emailAddress.emailAddress,
    phone: null,
  };
}
