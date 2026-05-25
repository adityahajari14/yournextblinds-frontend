import { unstable_cache } from 'next/cache';
import { shopifyConfig, validateShopifyConfig } from './shopify-admin';

const SHOPIFY_ADMIN_PRODUCT_CACHE_REVALIDATE_SECONDS =
  Number(process.env.SHOPIFY_ADMIN_PRODUCT_CACHE_REVALIDATE_SECONDS || 3_600);

// Shopify Product Cache
// Uses Next.js unstable_cache with a long TTL so product-to-price-band metadata
// does not refresh every few minutes during normal browsing.

export interface CachedProduct {
  priceBandName: string | null;
  title: string;
  tags: string[];
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
        }
      }
    }
  }
`;

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

    const json: any = await response.json();
    const data = json.data?.products;

    if (!data) {
      console.error('[Cache] Unexpected GraphQL response:', JSON.stringify(json.errors || json));
      break;
    }

    for (const edge of data.edges) {
      const node = edge.node;
      cache[node.handle] = {
        priceBandName: node.priceBandName?.value ?? null,
        title: node.title,
        tags: node.tags ?? [],
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

export async function getAllCachedProducts(): Promise<Record<string, CachedProduct>> {
  return getCachedProducts();
}
