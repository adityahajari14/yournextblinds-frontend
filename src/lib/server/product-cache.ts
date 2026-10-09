import { unstable_cache } from 'next/cache';
import { shopifyConfig, validateShopifyConfig } from './shopify-admin';

const SHOPIFY_ADMIN_PRODUCT_CACHE_REVALIDATE_SECONDS =
  Number(process.env.SHOPIFY_ADMIN_PRODUCT_CACHE_REVALIDATE_SECONDS || 3_600);

// Shopify Product Cache
// Uses Next.js unstable_cache with a long TTL so product-to-price-band metadata
// does not refresh every few minutes during normal browsing.

export interface CachedVariant {
  /** Shopify variant GID, e.g. gid://shopify/ProductVariant/123 */
  id: string;
  title: string;
  sku: string | null;
  /** Per-variant custom.price_band_name metafield, if set (multi-table products). */
  priceBandName: string | null;
  /** Color option label (e.g. "Almond Silk R12001"). */
  colorLabel: string | null;
}

export interface CachedProduct {
  priceBandName: string | null;
  title: string;
  tags: string[];
  variants: CachedVariant[];
}

// Shopify's Admin GraphQL API caps a single query's cost (~1000 points), and
// connection fields multiply: products(first: N) each carrying variants(first: M)
// costs roughly N * (1 + M). At 100 * 100 that approaches/exceeds the cap once
// the catalog has products with many color variants (Band F/H), causing Shopify
// to return a MAX_COST_EXCEEDED / THROTTLED error — which previously got
// swallowed and cached as a partial/empty result (see fetchAllShopifyProducts).
// Keep the product page small so the per-request cost stays comfortably under
// the limit; pagination still covers the whole catalog.
const PRODUCTS_PAGE_SIZE = 25;
const VARIANTS_PAGE_SIZE = 100;

const PRODUCTS_WITH_METAFIELD_QUERY = `
  query ProductsWithMetafield($first: Int!, $cursor: String, $variantsFirst: Int!) {
    products(first: $first, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          handle
          title
          tags
          priceBandName: metafield(namespace: "custom", key: "price_band_name") {
            value
          }
          variants(first: $variantsFirst) {
            edges {
              node {
                id
                title
                sku
                selectedOptions {
                  name
                  value
                }
                priceBandName: metafield(namespace: "custom", key: "price_band_name") {
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface MetafieldValue {
  value: string | null;
}

interface VariantNode {
  id: string;
  title: string;
  sku: string | null;
  selectedOptions?: { name: string; value: string }[];
  priceBandName: MetafieldValue | null;
}

interface ProductNode {
  handle: string;
  title: string;
  tags: string[] | null;
  priceBandName: MetafieldValue | null;
  variants?: { edges: { node: VariantNode }[] };
}

interface GraphQLError {
  message?: string;
  extensions?: { code?: string };
}

interface ProductsConnection {
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  edges: { node: ProductNode }[];
}

interface ProductsQueryResponse {
  data?: {
    products?: ProductsConnection;
  };
  errors?: GraphQLError[];
}

function getGraphQLUrl(): string {
  const domain = shopifyConfig.storeDomain.replace(/^https?:\/\//, '');
  return `https://${domain}/admin/api/${shopifyConfig.apiVersion}/graphql.json`;
}

const MAX_PAGE_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 1_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a single page, retrying on Shopify throttling (THROTTLED). Any other
 * GraphQL error — or exhausting retries — throws, so a bad/partial response is
 * NEVER returned as a success (and therefore never cached by unstable_cache).
 * This is the fix for products silently showing $0: previously a throttled or
 * cost-limited response was swallowed and its incomplete product map cached.
 */
async function fetchProductsPage(
  cursor: string | null
): Promise<ProductsConnection> {
  for (let attempt = 0; attempt <= MAX_PAGE_RETRIES; attempt++) {
    const response = await fetch(getGraphQLUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyConfig.adminAccessToken,
      },
      body: JSON.stringify({
        query: PRODUCTS_WITH_METAFIELD_QUERY,
        variables: { first: PRODUCTS_PAGE_SIZE, cursor, variantsFirst: VARIANTS_PAGE_SIZE },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Shopify GraphQL request failed: ${response.status}`);
    }

    const json = (await response.json()) as ProductsQueryResponse;

    // Shopify returns HTTP 200 with a data:null + errors body on throttling and
    // cost-limit failures. Treat any GraphQL error as a hard failure — retry if
    // it's a transient throttle, otherwise throw.
    if (json.errors?.length) {
      const isThrottled = json.errors.some((e) => e.extensions?.code === 'THROTTLED');
      if (isThrottled && attempt < MAX_PAGE_RETRIES) {
        await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
      throw new Error(
        `Shopify GraphQL error while loading product cache: ${JSON.stringify(json.errors)}`
      );
    }

    const products = json.data?.products;
    if (!products) {
      throw new Error(
        `Shopify GraphQL returned no product data: ${JSON.stringify(json)}`
      );
    }

    return products;
  }

  // Unreachable — the loop either returns or throws — but satisfies the type checker.
  throw new Error('Shopify GraphQL product cache: retries exhausted');
}

async function fetchAllShopifyProducts(): Promise<Record<string, CachedProduct>> {
  validateShopifyConfig();

  const cache: Record<string, CachedProduct> = {};
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await fetchProductsPage(cursor);

    for (const edge of data.edges) {
      const node = edge.node;
      const variants: CachedVariant[] = (node.variants?.edges ?? []).map((variantEdge) => {
        const variant = variantEdge.node;
        const colorOption =
          (variant.selectedOptions ?? []).find((option) => /colou?r/i.test(option.name)) ??
          (variant.selectedOptions ?? [])[0];
        return {
          id: variant.id,
          title: variant.title,
          sku: variant.sku ?? null,
          priceBandName: variant.priceBandName?.value ?? null,
          colorLabel: colorOption?.value ?? variant.title ?? null,
        };
      });
      cache[node.handle] = {
        priceBandName: node.priceBandName?.value ?? null,
        title: node.title,
        tags: node.tags ?? [],
        variants,
      };
    }

    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }

  return cache;
}

const getCachedProducts = unstable_cache(
  async () => {
    console.log('[Cache] Refreshing Shopify product cache...');
    const products = await fetchAllShopifyProducts();
    console.log(`[Cache] Loaded ${Object.keys(products).length} products from Shopify`);
    return products;
  },
  ['shopify-product-cache'],
  { revalidate: SHOPIFY_ADMIN_PRODUCT_CACHE_REVALIDATE_SECONDS }
);

export async function getPriceBandNameByHandle(handle: string): Promise<string | null> {
  const products = await getCachedProducts();
  return products[handle]?.priceBandName ?? null;
}

export async function getCachedProduct(handle: string): Promise<CachedProduct | null> {
  const products = await getCachedProducts();
  return products[handle] ?? null;
}

/** Normalizes a variant identifier to a Shopify GID for comparison. */
function toVariantGid(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id.startsWith('gid://')) return id;
  if (/^\d+$/.test(id)) return `gid://shopify/ProductVariant/${id}`;
  return id;
}

/** Looks up a specific variant within a product by its GID (or numeric id). */
export async function getCachedVariant(
  handle: string,
  variantId: string | null | undefined
): Promise<CachedVariant | null> {
  if (!variantId) return null;
  const product = await getCachedProduct(handle);
  if (!product) return null;
  const gid = toVariantGid(variantId);
  return product.variants.find((variant) => variant.id === gid) ?? null;
}

export async function getAllCachedProducts(): Promise<Record<string, CachedProduct>> {
  return getCachedProducts();
}
