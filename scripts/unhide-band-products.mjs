/**
 * Unhide Band F and Band H products:
 *   - Remove hidden-test-product, hidden, test-product tags
 *   - Add Band H products to day-and-night-blinds collection
 *
 * Dry-run by default. Pass --apply to write.
 */

import { getEnv } from './pricing-data-utils.mjs';

const env = getEnv();
const SHOPIFY_STORE_DOMAIN = env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_ACCESS_TOKEN = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const APPLY = process.argv.includes('--apply');

const DAY_NIGHT_COLLECTION_ID = 'gid://shopify/Collection/469549482019';
const TAGS_TO_REMOVE = new Set(['hidden-test-product', 'hidden', 'test-product']);
// Template product — skip it
const SKIP_HANDLES = new Set(['roller-shades-template']);

async function gql(query, variables = {}) {
  const r = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await r.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

async function fetchTagged(tag) {
  const data = await gql(`{
    products(first: 50, query: "tag:${tag}") {
      edges { node { id handle title tags } }
    }
  }`);
  return data.products.edges.map((e) => e.node);
}

async function updateTags(productId, newTags) {
  const data = await gql(`
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id tags }
        userErrors { field message }
      }
    }
  `, { input: { id: productId, tags: newTags } });
  const errs = data.productUpdate.userErrors;
  if (errs.length) throw new Error(errs.map((e) => e.message).join(', '));
}

async function addToCollection(productId) {
  const data = await gql(`
    mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        collection { id handle }
        userErrors { field message }
      }
    }
  `, { id: DAY_NIGHT_COLLECTION_ID, productIds: [productId] });
  const errs = data.collectionAddProducts.userErrors;
  if (errs.length) throw new Error(errs.map((e) => e.message).join(', '));
}

async function run() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  const [bandFProducts, bandHProducts] = await Promise.all([
    fetchTagged('roller-band-f'),
    fetchTagged('day-night-band-h'),
  ]);

  // --- Band F: remove hidden tags ---
  console.log(`=== Band F (${bandFProducts.length} products) ===`);
  for (const p of bandFProducts) {
    if (SKIP_HANDLES.has(p.handle)) {
      console.log(`  SKIP ${p.handle} (template)`);
      continue;
    }
    const removedTags = p.tags.filter((t) => TAGS_TO_REMOVE.has(t));
    if (removedTags.length === 0) {
      console.log(`  OK   ${p.handle} — no hidden tags`);
      continue;
    }
    const newTags = p.tags.filter((t) => !TAGS_TO_REMOVE.has(t));
    console.log(`  ${APPLY ? 'UPDATE' : 'WOULD UPDATE'} ${p.handle}`);
    console.log(`         remove: [${removedTags.join(', ')}]`);
    console.log(`         keep:   [${newTags.join(', ')}]`);
    if (APPLY) {
      await updateTags(p.id, newTags);
      console.log(`         ✓ done`);
    }
  }

  // --- Band H: remove hidden tags + add to collection ---
  console.log(`\n=== Band H (${bandHProducts.length} products) ===`);
  for (const p of bandHProducts) {
    if (SKIP_HANDLES.has(p.handle)) {
      console.log(`  SKIP ${p.handle}`);
      continue;
    }
    const removedTags = p.tags.filter((t) => TAGS_TO_REMOVE.has(t));
    const newTags = p.tags.filter((t) => !TAGS_TO_REMOVE.has(t));

    if (removedTags.length === 0) {
      console.log(`  OK   ${p.handle} — no hidden tags`);
    } else {
      console.log(`  ${APPLY ? 'UPDATE' : 'WOULD UPDATE'} ${p.handle}`);
      console.log(`         remove: [${removedTags.join(', ')}]`);
      console.log(`         keep:   [${newTags.join(', ')}]`);
      if (APPLY) {
        await updateTags(p.id, newTags);
        console.log(`         ✓ tags updated`);
      }
    }

    console.log(`         ${APPLY ? 'ADD' : 'WOULD ADD'} to day-and-night-blinds collection`);
    if (APPLY) {
      await addToCollection(p.id);
      console.log(`         ✓ added to collection`);
    }
  }

  console.log(`\n${APPLY ? 'Done.' : 'Re-run with --apply to write.'}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
