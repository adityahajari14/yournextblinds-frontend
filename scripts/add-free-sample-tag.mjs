/**
 * Add the `free-sample` tag to every product in the store, which makes all of a
 * product's colour variants eligible for free fabric samples on the site.
 *
 * Note: Shopify tags live on PRODUCTS, not variants — there is no variant-level
 * tag. Tagging a product therefore makes all its variants sample-eligible, which
 * is exactly what the site's `isSampleEligible()` check reads.
 *
 * Dry-run by default. Pass --apply to write.
 * Optionally pass --remove to strip the tag from all products instead.
 *
 *   node scripts/add-free-sample-tag.mjs            # dry run (preview)
 *   node scripts/add-free-sample-tag.mjs --apply    # add the tag everywhere
 *   node scripts/add-free-sample-tag.mjs --apply --remove  # remove it everywhere
 */

import { getEnv } from './pricing-data-utils.mjs';

const env = getEnv();
const SHOPIFY_STORE_DOMAIN = env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_ACCESS_TOKEN = env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const APPLY = process.argv.includes('--apply');
const REMOVE = process.argv.includes('--remove');
const FREE_SAMPLE_TAG = 'free-sample';

if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_ACCESS_TOKEN) {
  console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in env/.env.local');
  process.exit(1);
}

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
  // Shopify GraphQL Admin throttles; back off if we're low on cost budget.
  const cost = json.extensions?.cost?.throttleStatus;
  if (cost && cost.currentlyAvailable < 200) {
    await new Promise((res) => setTimeout(res, 1000));
  }
  return json.data;
}

async function* iterateAllProducts() {
  let cursor = null;
  for (;;) {
    const data = await gql(
      `query AllProducts($cursor: String) {
        products(first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          edges { node { id handle title tags } }
        }
      }`,
      { cursor }
    );
    for (const edge of data.products.edges) {
      yield edge.node;
    }
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }
}

async function tagsAdd(productId) {
  const data = await gql(
    `mutation tagsAdd($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) { node { id } userErrors { field message } }
    }`,
    { id: productId, tags: [FREE_SAMPLE_TAG] }
  );
  const errs = data.tagsAdd.userErrors;
  if (errs.length) throw new Error(errs.map((e) => e.message).join(', '));
}

async function tagsRemove(productId) {
  const data = await gql(
    `mutation tagsRemove($id: ID!, $tags: [String!]!) {
      tagsRemove(id: $id, tags: $tags) { node { id } userErrors { field message } }
    }`,
    { id: productId, tags: [FREE_SAMPLE_TAG] }
  );
  const errs = data.tagsRemove.userErrors;
  if (errs.length) throw new Error(errs.map((e) => e.message).join(', '));
}

async function run() {
  const action = REMOVE ? 'REMOVE' : 'ADD';
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'} | Action: ${action} "${FREE_SAMPLE_TAG}"\n`);

  let total = 0;
  let changed = 0;
  let alreadyOk = 0;

  for await (const p of iterateAllProducts()) {
    total += 1;
    const hasTag = p.tags.some((t) => t.toLowerCase() === FREE_SAMPLE_TAG);

    if (REMOVE) {
      if (!hasTag) {
        alreadyOk += 1;
        continue;
      }
      console.log(`  ${APPLY ? 'REMOVE' : 'WOULD REMOVE'} ${p.handle}`);
      if (APPLY) await tagsRemove(p.id);
      changed += 1;
    } else {
      if (hasTag) {
        alreadyOk += 1;
        continue;
      }
      console.log(`  ${APPLY ? 'TAG' : 'WOULD TAG'} ${p.handle}`);
      if (APPLY) await tagsAdd(p.id);
      changed += 1;
    }
  }

  console.log(`\nProducts scanned: ${total}`);
  console.log(`${REMOVE ? 'Removed from' : 'Tagged'}: ${changed}`);
  console.log(`Already ${REMOVE ? 'untagged' : 'tagged'}: ${alreadyOk}`);
  console.log(`\n${APPLY ? 'Done.' : 'Re-run with --apply to write.'}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
