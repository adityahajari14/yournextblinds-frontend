/**
 * Copies the images the first pass missed onto the 17 "Top Down Bottom Up
 * Cordless" products.
 *
 * The base honeycomb products carry TWO images per colour for most (not all)
 * products: an unassigned "lifestyle" shot (variant_ids: [], e.g.
 * "H25000LuminaPureWhite.LTX.png") plus the per-variant swatch (e.g.
 * "H25000.jpg", variant_ids: [<variant>]). The original upsert script only
 * attached the swatch (from the local optimised-swatch folder) — this script
 * finds every base image with NO variant assigned (the ones it missed) and
 * copies it onto the matching TDBU product directly from Shopify's CDN (by
 * `src` URL, no local file needed), then reorders the gallery so it reads:
 * [thumbnail, ...base product's original image order (translated to the new
 * product's variant ids)].
 *
 *   node scripts/fix-top-down-bottom-up-images.mjs                  # dry run
 *   node scripts/fix-top-down-bottom-up-images.mjs --apply
 *   node scripts/fix-top-down-bottom-up-images.mjs --apply --only <base-handle>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminRest, findProductByHandle } from './shopify-admin.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'scripts', 'data');
const APPLY = process.argv.includes('--apply');
const ONLY = (() => {
  const i = process.argv.indexOf('--only');
  return i >= 0 ? process.argv[i + 1] : null;
})();

const HANDLE_PREFIX = 'top-down-bottom-up-cordless-';
const THUMBNAIL_FILENAME = 'topdownbottomup.webp';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fullProduct(handle) {
  const found = await findProductByHandle(handle);
  if (!found) return null;
  const res = await adminRest(`/products/${found.id}.json`);
  return res.product;
}

async function fixProduct(baseHandle) {
  const tdbuHandle = `${HANDLE_PREFIX}${baseHandle}`;
  const base = await fullProduct(baseHandle);
  const tdbu = await fullProduct(tdbuHandle);
  if (!base) throw new Error(`Base product not found: ${baseHandle}`);
  if (!tdbu) throw new Error(`TDBU product not found: ${tdbuHandle}`);

  const baseColorByVariantId = new Map(base.variants.map((v) => [v.id, v.option1]));
  const tdbuVariantIdByColor = new Map(tdbu.variants.map((v) => [v.option1, v.id]));

  const missing = base.images.filter((img) => (img.variant_ids ?? []).length === 0);
  console.log(`\n${baseHandle}`);
  console.log(`  base images ${base.images.length} (${base.variants.length} variants) — tdbu currently has ${tdbu.images.length}`);
  console.log(`  missing (unassigned) images to copy: ${missing.length}`);

  if (!APPLY) return;

  // Add the missing images, tracking base image id -> newly created tdbu image id.
  const newIdByBaseImageId = new Map();
  for (const img of missing) {
    const res = await adminRest(`/products/${tdbu.id}/images.json`, {
      method: 'POST',
      body: JSON.stringify({ image: { src: img.src } }),
    });
    newIdByBaseImageId.set(img.id, res.image.id);
    await sleep(150);
  }

  // Re-fetch to get the current full image set (thumbnail + originally
  // attached swatches + the ones just added) before reordering.
  const refreshed = await fullProduct(tdbuHandle);
  // Every product's thumbnail was uploaded from the same local filename, so
  // Shopify (file storage is shop-wide, not per-product) appended a
  // disambiguating suffix from the 2nd upload onward — match by the stem
  // ("topdownbottomup"), not an exact filename.
  const thumbnail = refreshed.images.find((i) => path.basename(i.src).startsWith(THUMBNAIL_FILENAME.replace(/\.webp$/, '')));

  // Existing swatch images are matched back to their base image via the
  // variant they're assigned to (one swatch per variant, both sides).
  const tdbuImageByVariantId = new Map();
  for (const img of refreshed.images) {
    for (const vid of img.variant_ids ?? []) tdbuImageByVariantId.set(vid, img.id);
  }

  const orderedIds = [];
  if (thumbnail) orderedIds.push(thumbnail.id);
  for (const baseImg of base.images) {
    if ((baseImg.variant_ids ?? []).length === 0) {
      const createdId = newIdByBaseImageId.get(baseImg.id);
      if (createdId) orderedIds.push(createdId);
      continue;
    }
    const color = baseColorByVariantId.get(baseImg.variant_ids[0]);
    const tdbuVariantId = tdbuVariantIdByColor.get(color);
    const tdbuImageId = tdbuVariantId ? tdbuImageByVariantId.get(tdbuVariantId) : null;
    if (tdbuImageId && !orderedIds.includes(tdbuImageId)) orderedIds.push(tdbuImageId);
  }
  // Anything not placed (shouldn't normally happen) goes at the end so nothing is lost.
  for (const img of refreshed.images) {
    if (!orderedIds.includes(img.id)) orderedIds.push(img.id);
  }

  await adminRest(`/products/${tdbu.id}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      product: {
        id: tdbu.id,
        images: orderedIds.map((id, i) => ({ id, position: i + 1 })),
      },
    }),
  });

  console.log(`  added ${missing.length} image(s), reordered ${orderedIds.length} total`);
}

async function main() {
  const allProducts = JSON.parse(fs.readFileSync(path.join(DATA, 'honeycomb-cellular-products.json'), 'utf8'));
  const products = allProducts.filter((p) => !/sheer/i.test(p.title));
  const targets = ONLY ? products.filter((p) => p.handle === ONLY) : products;
  if (ONLY && !targets.length) throw new Error(`No eligible (non-sheer) product with handle "${ONLY}"`);

  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} — ${targets.length} product(s)`);
  for (const p of targets) {
    await fixProduct(p.handle);
  }
  console.log(`\n${APPLY ? 'Done' : 'DRY RUN complete'}.`);
  if (!APPLY) console.log('Pass --apply to write to Shopify.');
}

main().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});
