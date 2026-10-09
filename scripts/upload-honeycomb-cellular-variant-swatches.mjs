/**
 * Uploads per-colour fabric swatch images (the "*.LTX" shots) to a Honeycomb
 * Cellular product and slots each one immediately BEFORE that colour's existing
 * bare-code image — mirroring how the Roller Band F products are arranged
 * (e.g. versailles-roller-shades media order:
 *   R12001VersaillesAlmondSilk.LTX.webp, R12001.webp,
 *   R12002VersaillesDoveBeige.LTX.webp,  R12002.webp).
 *
 * The existing bare-code image stays each variant's featured image; the new
 * swatch is added as product media only (no variant association).
 *
 * Source folder: one PNG per colour, named "<CODE> <Color option value> .LTX.png"
 * e.g. "H25047 Lumina Midnight Navy .LTX.png". Colours are matched to variants
 * by the option value embedded in the filename (the leading code is only a
 * label and is kept in the uploaded filename).
 *
 * Usage:
 *   node scripts/upload-honeycomb-cellular-variant-swatches.mjs            # dry run
 *   node scripts/upload-honeycomb-cellular-variant-swatches.mjs --apply    # write
 *   ...--handle <product-handle> --dir "<folder>"                          # target override
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { adminRest, findProductByHandle } from './shopify-admin.mjs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const handleArg = valueOf('--handle');
const dirArg = valueOf('--dir');

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

const PRODUCT_HANDLE =
  handleArg || 'lumina-light-filtering-cellular-honeycomb-shade-25mm-single-cell';
const SOURCE_DIR = resolve(
  dirArg ||
    'Honeycomb-cellular/lumina light filtering cellular honeycomb shade - 25mm single cell'
);

/**
 * "H25047 Lumina Midnight Navy .LTX.png" -> { code: "H25047", color: "Lumina Midnight Navy" }
 * "H45145PD.png"                          -> { code: "H45145PD", color: null }  (code-only)
 * Codes may carry a letter suffix (P / D / S / WD / PD / K / M).
 */
function parseSwatchFilename(file) {
  const stem = basename(file, extname(file)).replace(/\.LTX$/i, '').trim();
  const withColor = stem.match(/^(H\d+[A-Z]*)\s+(.*)$/i);
  if (withColor) {
    return { code: withColor[1].toUpperCase(), color: withColor[2].replace(/\s+/g, ' ').trim() };
  }
  const codeOnly = stem.match(/^(H\d+[A-Z]*)$/i);
  if (codeOnly) return { code: codeOnly[1].toUpperCase(), color: null };
  return null;
}

/** basename without extension, e.g. ".../H45145PD.jpg?v=1" -> "H45145PD" */
function imageStem(src) {
  const path = new URL(src).pathname;
  return basename(path, extname(path));
}

/** Roller-Band-F style: "<CODE><ColorNoSpaces>.LTX.png" (code-only files drop the colour part). */
function uploadFilename(code, color, ext) {
  return `${code}${color ? color.replace(/\s+/g, '') : ''}.LTX${ext}`;
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** adminRest retries HTTP 429/5xx; this also retries thrown network errors ("fetch failed"). */
async function restWithRetry(endpoint, options, attempts = 6) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await adminRest(endpoint, options);
    } catch (err) {
      if (i === attempts - 1) throw err;
      const wait = 2000 * 2 ** i;
      console.warn(`  ${options?.method || 'GET'} ${endpoint} failed (${err.message || err}); retry in ${wait}ms`);
      await sleep(wait);
    }
  }
}

async function main() {
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — swatch upload for "${PRODUCT_HANDLE}"`);
  console.log(`Source: ${SOURCE_DIR}\n`);

  const product = await findProductByHandle(PRODUCT_HANDLE);
  if (!product) throw new Error(`Product not found for handle "${PRODUCT_HANDLE}"`);

  const [{ images }, { variants }] = await Promise.all([
    adminRest(`/products/${product.id}/images.json?limit=250`),
    adminRest(`/products/${product.id}/variants.json?limit=250`),
  ]);

  const imageById = new Map(images.map((img) => [img.id, img]));
  const variantByColor = new Map(variants.map((v) => [v.option1.trim().toLowerCase(), v]));

  const files = readdirSync(SOURCE_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();

  // Resolve every source file to a variant + that variant's current image.
  const plan = [];
  const problems = [];
  for (const file of files) {
    const parsed = parseSwatchFilename(file);
    if (!parsed) {
      problems.push(`Cannot parse code/colour from "${file}"`);
      continue;
    }
    // Colour name in the filename -> match by variant option value.
    // Code only -> match by the code on the variant's current image (e.g.
    // "H45145PD.png" anchors before the variant whose image is "H45145PD.jpg").
    const variant = parsed.color
      ? variantByColor.get(parsed.color.toLowerCase())
      : variants.find((v) => {
          const img = v.image_id ? imageById.get(v.image_id) : null;
          return img && imageStem(img.src).toLowerCase() === parsed.code.toLowerCase();
        });
    if (!variant) {
      problems.push(
        parsed.color
          ? `No variant for colour "${parsed.color}" (file "${file}")`
          : `No variant whose image is "${parsed.code}" (file "${file}")`
      );
      continue;
    }
    const existingImage = variant.image_id ? imageById.get(variant.image_id) : null;
    if (!existingImage) {
      problems.push(`Variant "${variant.option1}" has no existing image to anchor before`);
      continue;
    }
    plan.push({ file, ...parsed, variant, existingImage });
  }

  if (problems.length) {
    console.error('Blocking issues:\n' + problems.map((p) => `  - ${p}`).join('\n'));
    process.exit(1);
  }

  // Anything that already has a swatch sitting right before its code image.
  const already = new Set();
  for (const p of plan) {
    const target = uploadFilename(p.code, p.color, extname(p.file).toLowerCase());
    if (images.some((img) => decodeURIComponent(img.src).includes(target))) already.add(p.file);
  }

  console.log('Planned media order (per colour: NEW swatch, then existing code image):\n');
  for (const p of plan) {
    const codeImg = basename(new URL(p.existingImage.src).pathname);
    const mark = already.has(p.file) ? ' [already present — skip]' : '';
    console.log(`  ${p.variant.option1}`);
    console.log(`     + ${uploadFilename(p.code, p.color, extname(p.file).toLowerCase())}  (new)${mark}`);
    console.log(`       ${codeImg}  (existing, stays variant image)`);
  }

  const toUpload = plan.filter((p) => !already.has(p.file));
  console.log(`\n${toUpload.length} to upload, ${plan.length - toUpload.length} already present.`);

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to upload and reorder.');
    return;
  }

  // 1) Upload each new swatch (appended to the end for now).
  const newImageIdByFile = new Map();
  for (const p of toUpload) {
    const ext = extname(p.file).toLowerCase();
    const attachment = readFileSync(join(SOURCE_DIR, p.file)).toString('base64');
    const filename = uploadFilename(p.code, p.color, ext);
    const res = await restWithRetry(`/products/${product.id}/images.json`, {
      method: 'POST',
      body: JSON.stringify({ image: { attachment, filename } }),
    });
    newImageIdByFile.set(p.file, res.image.id);
    console.log(`  uploaded ${filename} -> image ${res.image.id}`);
  }

  // 2) Reorder: for every variant, [new swatch, existing code image]; then any
  //    leftover product media (none expected here) appended in current order.
  const refreshed = (await restWithRetry(`/products/${product.id}/images.json?limit=250`)).images;
  const refreshedById = new Map(refreshed.map((img) => [img.id, img]));

  const orderedIds = [];
  for (const p of plan) {
    const newId =
      newImageIdByFile.get(p.file) ??
      refreshed.find((img) =>
        decodeURIComponent(img.src).includes(
          uploadFilename(p.code, p.color, extname(p.file).toLowerCase())
        )
      )?.id;
    if (newId) orderedIds.push(newId);
    orderedIds.push(p.existingImage.id);
  }
  for (const img of refreshed) {
    if (!orderedIds.includes(img.id)) orderedIds.push(img.id);
  }

  const imagesPayload = orderedIds.map((id) => {
    const img = refreshedById.get(id);
    return img?.variant_ids?.length ? { id, variant_ids: img.variant_ids } : { id };
  });

  await restWithRetry(`/products/${product.id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ product: { id: product.id, images: imagesPayload } }),
  });
  console.log(`\nReordered ${imagesPayload.length} media.`);

  // 3) Verify.
  const final = (await restWithRetry(`/products/${product.id}/images.json?limit=250`)).images;
  console.log('\nFinal media order:');
  for (const img of final.sort((a, b) => a.position - b.position)) {
    console.log(`  ${String(img.position).padStart(2)}  ${basename(new URL(img.src).pathname)}  ${img.variant_ids?.length ? `(variant ${img.variant_ids.join(',')})` : ''}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
