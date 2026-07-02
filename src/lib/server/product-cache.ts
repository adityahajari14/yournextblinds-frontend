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

const PRODUCTS_WITH_METAFIELD_QUERY = `
  query ProductsWithMetafield($cursor: String) {
    products(first: 100, after: $cursor) {
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
          variants(first: 100) {
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

interface ProductsQueryResponse {
  data?: {
    products?: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: { node: ProductNode }[];
    };
  };
  errors?: unknown;
}

function getGraphQLUrl(): string {
  const domain = shopifyConfig.storeDomain.replace(/^https?:\/\//, '');
  return `https://${domain}/admin/api/${shopifyConfig.apiVersion}/graphql.json`;
}

async function fetchAllShopifyProducts(): Promise<Record<string, CachedProduct>> {
  validateShopifyConfig();

  const cache: Record<string, CachedProduct> = {};
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response: Response = await fetch(getGraphQLUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyConfig.adminAccessToken,
      },
      body: JSON.stringify({
        query: PRODUCTS_WITH_METAFIELD_QUERY,
        variables: { cursor },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Shopify GraphQL request failed: ${response.status}`);
    }

    const json = (await response.json()) as ProductsQueryResponse;
    const data = json.data?.products;

    if (!data) {
      console.error('[Cache] Unexpected GraphQL response:', JSON.stringify(json.errors || json));
      break;
    }

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
