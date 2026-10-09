/**
 * Removes the `hidden-test-product` staging tag from the 19 Honeycomb/Cellular
 * products, making them visible in search, related products and listings.
 *
 * Run this once the collection page is live and reviewed. Until then the
 * products exist and their PDPs work by direct link, but nothing surfaces them.
 *
 *   node scripts/unhide-honeycomb-cellular-products.mjs           # dry run
 *   node scripts/unhide-honeycomb-cellular-products.mjs --apply
 *
 * To re-hide, run upsert-honeycomb-cellular-products.mjs --apply --hidden.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminRest, findProductByHandle } from './shopify-admin.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS_JSON = path.join(ROOT, 'scripts', 'data', 'honeycomb-cellular-products.json');

const APPLY = process.argv.includes('--apply');
const HIDDEN_TAG = 'hidden-test-product';

async function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} — removing "${HIDDEN_TAG}" from ${products.length} products\n`);

  let changed = 0;
  let missing = 0;

  for (const p of products) {
    const product = await findProductByHandle(p.handle);
    if (!product) {
      console.warn(`  MISSING  ${p.handle}`);
      missing++;
      continue;
    }

    const tags = product.tags ? product.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    if (!tags.some((t) => t.toLowerCase() === HIDDEN_TAG)) {
      console.log(`  already visible  ${p.handle}`);
      continue;
    }

    const nextTags = tags.filter((t) => t.toLowerCase() !== HIDDEN_TAG);
    console.log(`  unhide  ${p.handle}`);
    changed++;

    if (APPLY) {
      await adminRest(`/products/${product.id}.json`, {
        method: 'PUT',
        body: JSON.stringify({ product: { id: product.id, tags: nextTags.join(', ') } }),
      });
    }
  }

  console.log(`\n${changed} to unhide, ${missing} missing.`);
  if (!APPLY) console.log('Pass --apply to write to Shopify.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
