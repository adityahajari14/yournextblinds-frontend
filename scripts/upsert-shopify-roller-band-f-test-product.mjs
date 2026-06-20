/**
 * Creates or updates the Roller Band F test product in Shopify.
 * Uses the Admin API with the credentials from .env.local.
 */
import { getEnv } from './pricing-data-utils.mjs';

const PRODUCT_HANDLE = 'roller-blind-band-f-test';
const PRODUCT_TAG = 'roller-band-f';
const HIDDEN_TAG = 'hidden-test-product';
const PRICE_BAND_TAG = 'price-band:Roller - Band F';

const env = getEnv();
const storeDomain = env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '');
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || '2025-01';

if (!storeDomain || !token) {
  console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local');
  process.exit(1);
}

const BASE_URL = `https://${storeDomain}/admin/api/${apiVersion}`;

async function shopifyAdminFetch(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Admin API error ${res.status}: ${text}`);
  }

  return res.json();
}

async function findProductByHandle(handle) {
  const data = await shopifyAdminFetch(`/products.json?handle=${handle}&limit=1`);
  return data.products?.[0] ?? null;
}

async function createProduct() {
  const data = await shopifyAdminFetch('/products.json', {
    method: 'POST',
    body: JSON.stringify({
      product: {
        title: 'Roller Blind — Band F (Test)',
        handle: PRODUCT_HANDLE,
        body_html: '<p>Test product for Roller Blind Band F configuration.</p>',
        vendor: 'Your Next Blinds',
        product_type: 'Roller Blind',
        status: 'active',
        tags: [PRODUCT_TAG, HIDDEN_TAG, PRICE_BAND_TAG].join(', '),
        variants: [
          {
            price: '139.79',
            sku: 'ROLLER-BAND-F-TEST',
            inventory_management: null,
            fulfillment_service: 'manual',
          },
        ],
      },
    }),
  });
  return data.product;
}

async function updateProduct(id, existingTags) {
  const tags = [...new Set([...existingTags, PRODUCT_TAG, HIDDEN_TAG, PRICE_BAND_TAG])].join(', ');
  const data = await shopifyAdminFetch(`/products/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      product: {
        id,
        handle: PRODUCT_HANDLE,
        status: 'active',
        tags,
      },
    }),
  });
  return data.product;
}

async function addToCollection(productId, collectionHandle) {
  // Find collection by handle
  const colData = await shopifyAdminFetch(`/custom_collections.json?handle=${collectionHandle}&limit=1`);
  const collection = colData.custom_collections?.[0];
  if (!collection) {
    console.warn(`  Collection "${collectionHandle}" not found — skipping`);
    return;
  }

  await shopifyAdminFetch('/collects.json', {
    method: 'POST',
    body: JSON.stringify({
      collect: {
        product_id: productId,
        collection_id: collection.id,
      },
    }),
  });
  console.log(`  Added to collection: ${collectionHandle}`);
}

async function main() {
  console.log(`Upserting Roller Band F test product (handle: ${PRODUCT_HANDLE})...`);

  let product = await findProductByHandle(PRODUCT_HANDLE);

  if (product) {
    console.log(`  Found existing product (id: ${product.id}) — updating...`);
    const existingTags = product.tags ? product.tags.split(', ').map(t => t.trim()) : [];
    product = await updateProduct(product.id, existingTags);
    console.log(`  Updated: ${product.title}`);
  } else {
    console.log('  No existing product found — creating...');
    product = await createProduct();
    console.log(`  Created: ${product.title} (id: ${product.id})`);

    // Add to roller-blinds collection
    await addToCollection(product.id, 'roller-blinds');
  }

  console.log(`\nDone. Product handle: ${product.handle}`);
  console.log(`Product URL: https://${storeDomain}/admin/products/${product.id}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
