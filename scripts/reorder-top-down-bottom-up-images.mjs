/**
 * Reorder-only fix: the first pass of fix-top-down-bottom-up-images.mjs
 * correctly copied every missing image, but its thumbnail detection matched
 * the literal filename "topdownbottomup.webp" — since all 17 products
 * uploaded from the same local file, Shopify (file storage is shop-wide)
 * suffixed every upload after the first ("topdownbottomup_<hash>.webp"), so
 * the thumbnail landed at the END of the gallery instead of position 1 for
 * 16 of the 17 products. This does NOT add or remove any images — it only
 * reorders each product's existing image set to [thumbnail, ...base order].
 *
 *   node scripts/reorder-top-down-bottom-up-images.mjs                  # dry run
 *   node scripts/reorder-top-down-bottom-up-images.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminRest, findProductByHandle } from './shopify-admin.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'scripts', 'data');
const APPLY = process.argv.includes('--apply');
const HANDLE_PREFIX = 'top-down-bottom-up-cordless-';
const THUMBNAIL_STEM = 'topdownbottomup';

async function fullProduct(handle) {
  const found = await findProductByHandle(handle);
  if (!found) return null;
  const res = await adminRest(`/products/${found.id}.json`);
  return res.product;
}

async function reorder(baseHandle) {
  const tdbuHandle = `${HANDLE_PREFIX}${baseHandle}`;
  const base = await fullProduct(baseHandle);
  const tdbu = await fullProduct(tdbuHandle);
  if (!base) throw new Error(`Base product not found: ${baseHandle}`);
  if (!tdbu) throw new Error(`TDBU product not found: ${tdbuHandle}`);

  const thumbnail = tdbu.images.find((i) => path.basename(i.src).startsWith(THUMBNAIL_STEM));
  const currentFirst = tdbu.images[0];
  const alreadyOk = thumbnail && currentFirst && thumbnail.id === currentFirst.id;

  console.log(`${baseHandle}: thumbnail at position ${thumbnail ? tdbu.images.findIndex((i) => i.id === thumbnail.id) + 1 : '???'} of ${tdbu.images.length} — ${alreadyOk ? 'OK, skipping' : 'needs reorder'}`);
  if (alreadyOk || !APPLY) return;
  if (!thumbnail) throw new Error(`No thumbnail image found on ${tdbuHandle}`);

  const baseColorByVariantId = new Map(base.variants.map((v) => [v.id, v.option1]));
  const tdbuVariantIdByColor = new Map(tdbu.variants.map((v) => [v.option1, v.id]));
  const tdbuImageByVariantId = new Map();
  for (const img of tdbu.images) {
    for (const vid of img.variant_ids ?? []) tdbuImageByVariantId.set(vid, img.id);
  }
  // Unassigned tdbu images (lifestyle shots), in their current relative order,
  // consumed one at a time as we walk base's unassigned images in order — both
  // sides were appended in the same order by the first pass.
  const tdbuUnassignedInOrder = tdbu.images.filter((i) => (i.variant_ids ?? []).length === 0 && i.id !== thumbnail.id);
  let unassignedCursor = 0;

  const orderedIds = [thumbnail.id];
  for (const baseImg of base.images) {
    if ((baseImg.variant_ids ?? []).length === 0) {
      const img = tdbuUnassignedInOrder[unassignedCursor++];
      if (img) orderedIds.push(img.id);
      continue;
    }
    const color = baseColorByVariantId.get(baseImg.variant_ids[0]);
    const tdbuVariantId = tdbuVariantIdByColor.get(color);
    const tdbuImageId = tdbuVariantId ? tdbuImageByVariantId.get(tdbuVariantId) : null;
    if (tdbuImageId && !orderedIds.includes(tdbuImageId)) orderedIds.push(tdbuImageId);
  }
  for (const img of tdbu.images) {
    if (!orderedIds.includes(img.id)) orderedIds.push(img.id);
  }

  if (orderedIds.length !== tdbu.images.length) {
    throw new Error(`${tdbuHandle}: reorder produced ${orderedIds.length} ids, expected ${tdbu.images.length}`);
  }

  await adminRest(`/products/${tdbu.id}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      product: { id: tdbu.id, images: orderedIds.map((id, i) => ({ id, position: i + 1 })) },
    }),
  });
  console.log(`  reordered ${orderedIds.length} images`);
}

async function main() {
  const allProducts = JSON.parse(fs.readFileSync(path.join(DATA, 'honeycomb-cellular-products.json'), 'utf8'));
  const products = allProducts.filter((p) => !/sheer/i.test(p.title));
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} — ${products.length} product(s)`);
  for (const p of products) await reorder(p.handle);
  console.log(`\n${APPLY ? 'Done' : 'DRY RUN complete'}.`);
  if (!APPLY) console.log('Pass --apply to write to Shopify.');
}

main().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});
