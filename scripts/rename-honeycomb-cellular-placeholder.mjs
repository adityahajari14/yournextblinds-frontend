/**
 * Retires the phase-1 Honeycomb/Cellular placeholder product.
 *
 * It squats on the `honeycomb-cellular-shades` handle, which the new collection
 * page needs, and it carries the family tag, which would pull a fake 5-variant
 * $50 product into the curated collection alongside the 19 real ones.
 *
 *   handle  honeycomb-cellular-shades -> honeycomb-cellular-test
 *   tags    drop `honeycomb-cellular-shades`, keep `hidden-test-product`
 *   band    -> Honeycomb Cellular - Group 1  (its old band was deleted; a dangling
 *             metafield makes calculateProductPrice throw for this handle)
 *
 *   node scripts/rename-honeycomb-cellular-placeholder.mjs           # dry run
 *   node scripts/rename-honeycomb-cellular-placeholder.mjs --apply
 */
import { adminRest, findProductByHandle, storeDomain } from './shopify-admin.mjs';

const APPLY = process.argv.includes('--apply');

const OLD_HANDLE = 'honeycomb-cellular-shades';
const NEW_HANDLE = 'honeycomb-cellular-test';
const FAMILY_TAG = 'honeycomb-cellular-shades';
const HIDDEN_TAG = 'hidden-test-product';
const NEW_BAND = 'Honeycomb Cellular - Group 1';

async function main() {
  let product = await findProductByHandle(OLD_HANDLE);

  if (!product) {
    const already = await findProductByHandle(NEW_HANDLE);
    if (already) {
      console.log(`Already renamed — "${NEW_HANDLE}" exists (id ${already.id}). Nothing to do.`);
      return;
    }
    console.log(`No product at "${OLD_HANDLE}" and none at "${NEW_HANDLE}". Nothing to do.`);
    return;
  }

  const currentTags = product.tags ? product.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const nextTags = [...new Set(currentTags.filter((t) => t.toLowerCase() !== FAMILY_TAG))];
  if (!nextTags.some((t) => t.toLowerCase() === HIDDEN_TAG)) nextTags.push(HIDDEN_TAG);

  console.log(`Placeholder product ${product.id} — "${product.title}"`);
  console.log(`  handle : ${product.handle} -> ${NEW_HANDLE}`);
  console.log(`  tags   : ${currentTags.join(', ') || '(none)'}`);
  console.log(`        -> ${nextTags.join(', ')}`);
  console.log(`  band   : -> ${NEW_BAND}`);

  if (!APPLY) {
    console.log('\nDRY RUN — pass --apply to write');
    return;
  }

  await adminRest(`/products/${product.id}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      product: { id: product.id, handle: NEW_HANDLE, tags: nextTags.join(', ') },
    }),
  });

  await adminRest(`/products/${product.id}/metafields.json`, {
    method: 'POST',
    body: JSON.stringify({
      metafield: {
        namespace: 'custom',
        key: 'price_band_name',
        type: 'single_line_text_field',
        value: NEW_BAND,
      },
    }),
  });

  product = await findProductByHandle(NEW_HANDLE);
  console.log(`\nDone. Now at https://${storeDomain}/admin/products/${product.id}`);
  console.log(`  handle: ${product.handle}`);
  console.log(`  tags  : ${product.tags}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
