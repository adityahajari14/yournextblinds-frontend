/**
 * Creates or updates the Honeycomb Cellular Shades product in Shopify.
 * Hidden from all collections/search/related-products (hidden-test-product tag),
 * reachable only via its direct product URL. Color variants use placeholder
 * images borrowed from existing products — swap in real swatch photos later.
 * Uses the Admin API with the credentials from .env.local.
 */
import { getEnv } from './pricing-data-utils.mjs';

const PRODUCT_HANDLE = 'honeycomb-cellular-shades';
const PRODUCT_TAG = 'honeycomb-cellular-shades';
const HIDDEN_TAG = 'hidden-test-product';
const PRICE_BAND_NAME = 'Honeycomb Cellular - Band 1';
const PRICE_BAND_TAG = `price-band:${PRICE_BAND_NAME}`;

const PRICE = '50.00';
const COMPARE_AT_PRICE = '150.00';

// Placeholder swatches borrowed from existing live products — replace with real
// Honeycomb Cellular fabric photography when available.
const COLOR_VARIANTS = [
  { name: 'Beige', image: 'https://cdn.shopify.com/s/files/1/0729/6847/0563/files/AQUALUSHBEIGE_1_1800x1800_ec5a0832-a9b3-494d-8cdb-bd501a73ed14.jpg?v=1771330800' },
  { name: 'Black', image: 'https://cdn.shopify.com/s/files/1/0729/6847/0563/files/AqualushBlackVerticalBlind_81868bff-1893-49d6-ac1c-72fd11f59615.jpg?v=1771330813' },
  { name: 'Carmine', image: 'https://cdn.shopify.com/s/files/1/0729/6847/0563/files/AqualushCarmineVerticalBlind_6fac90e4-3fa2-467a-8ab5-054a83e88d1f.jpg?v=1771330825' },
  { name: 'Cream', image: 'https://cdn.shopify.com/s/files/1/0729/6847/0563/files/AqualushCreamVerticalBlind_ca1f011a-6284-48a3-9e8f-4417a6251660.jpg?v=1771330837' },
  { name: 'Navy Blue', image: 'https://cdn.shopify.com/s/files/1/0729/6847/0563/files/AQUALUSHNAVYBLUE_1_1800x1800_e8c87797-1bfc-4edc-8a7e-0c7c58546168.jpg?v=1771330850' },
];

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
        title: 'Honeycomb/Cellular Shades',
        handle: PRODUCT_HANDLE,
        body_html: '<p>Custom made-to-measure honeycomb cellular shades.</p>',
        vendor: 'Your Next Blinds',
        product_type: 'Honeycomb Cellular Shades',
        status: 'active',
        tags: [PRODUCT_TAG, HIDDEN_TAG, PRICE_BAND_TAG].join(', '),
        options: [{ name: 'Color', values: COLOR_VARIANTS.map((c) => c.name) }],
        variants: COLOR_VARIANTS.map((c) => ({
          option1: c.name,
          price: PRICE,
          compare_at_price: COMPARE_AT_PRICE,
          sku: `HONEYCOMB-CELLULAR-${c.name.toUpperCase().replace(/\s+/g, '-')}`,
          inventory_management: null,
          fulfillment_service: 'manual',
        })),
      },
    }),
  });
  return data.product;
}

async function attachVariantImages(product) {
  for (const variant of product.variants) {
    const colorVariant = COLOR_VARIANTS.find((c) => c.name === variant.option1);
    if (!colorVariant) continue;

    await shopifyAdminFetch(`/products/${product.id}/images.json`, {
      method: 'POST',
      body: JSON.stringify({
        image: {
          src: colorVariant.image,
          variant_ids: [variant.id],
        },
      }),
    });
    console.log(`  Attached image for variant: ${variant.option1}`);
  }
}

async function setPriceBandMetafield(productId) {
  await shopifyAdminFetch(`/products/${productId}/metafields.json`, {
    method: 'POST',
    body: JSON.stringify({
      metafield: {
        namespace: 'custom',
        key: 'price_band_name',
        type: 'single_line_text_field',
        value: PRICE_BAND_NAME,
      },
    }),
  });
  console.log(`  Set metafield custom.price_band_name = "${PRICE_BAND_NAME}"`);
}

async function updateProductTags(id, existingTags) {
  const tags = [...new Set([...existingTags, PRODUCT_TAG, HIDDEN_TAG, PRICE_BAND_TAG])].join(', ');
  const data = await shopifyAdminFetch(`/products/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      product: { id, handle: PRODUCT_HANDLE, status: 'active', tags },
    }),
  });
  return data.product;
}

async function main() {
  console.log(`Upserting Honeycomb Cellular Shades product (handle: ${PRODUCT_HANDLE})...`);

  let product = await findProductByHandle(PRODUCT_HANDLE);

  if (product) {
    console.log(`  Found existing product (id: ${product.id}) — updating tags + metafield...`);
    const existingTags = product.tags ? product.tags.split(', ').map((t) => t.trim()) : [];
    product = await updateProductTags(product.id, existingTags);
    console.log(`  Updated: ${product.title}`);
  } else {
    console.log('  No existing product found — creating...');
    product = await createProduct();
    console.log(`  Created: ${product.title} (id: ${product.id}) with ${product.variants.length} color variants`);

    console.log('  Attaching placeholder variant images...');
    await attachVariantImages(product);
  }

  await setPriceBandMetafield(product.id);

  console.log(`\nDone. Product handle: ${product.handle}`);
  console.log(`Product URL: https://${storeDomain}/admin/products/${product.id}`);
  console.log(`Storefront URL (once storefront-side cache revalidates): /product/${product.handle}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
