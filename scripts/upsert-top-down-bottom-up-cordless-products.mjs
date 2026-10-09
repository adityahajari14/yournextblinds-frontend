/**
 * Creates or updates the standalone "Top Down Bottom Up Cordless" products in
 * Shopify — one per non-sheer Honeycomb/Cellular base product (17 total).
 *
 * These are real, separate, live products (not a filtered view of the 19 base
 * honeycomb products):
 *   - title "Top Down Bottom Up Cordless <base title>"
 *   - handle "top-down-bottom-up-cordless-<base handle>"
 *   - tagged `top-down-bottom-up-cordless` (drives the collection page and
 *     the bespoke PDP's hidden control-options section), NOT tagged
 *     `honeycomb-cellular-shades`, so they're excluded from the main
 *     /collections/honeycomb-cellular-shades page
 *   - price = base group's minimum price + the $35.75 cordless surcharge,
 *     baked into a cloned price band (see add-top-down-bottom-up-price-bands.mjs)
 *     since there's no control-option picker to add it as a line item
 *   - same colour swatches as the base product, plus
 *     public/products/topdownbottomup.webp attached first (unassigned to any
 *     variant) so it leads the product's image gallery
 *
 *   node scripts/upsert-top-down-bottom-up-cordless-products.mjs                  # dry run
 *   node scripts/upsert-top-down-bottom-up-cordless-products.mjs --apply
 *   node scripts/upsert-top-down-bottom-up-cordless-products.mjs --apply --only <base-handle>
 *   node scripts/upsert-top-down-bottom-up-cordless-products.mjs --apply --skip-images
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  adminRest,
  findProductByHandle,
  publishToAllChannels,
  productGid,
  storeDomain,
  ensureMetafieldDefinition,
} from './shopify-admin.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'scripts', 'data');
const SWATCHES = path.join(ROOT, 'Honeycomb-cellular', '.optimized');
const TDBU_THUMBNAIL = path.join(ROOT, 'public', 'products', 'topdownbottomup.webp');

const APPLY = process.argv.includes('--apply');
const SKIP_IMAGES = process.argv.includes('--skip-images');
const ONLY = (() => {
  const i = process.argv.indexOf('--only');
  return i >= 0 ? process.argv[i + 1] : null;
})();

const TDBU_TAG = 'top-down-bottom-up-cordless';
const VENDOR = 'Your Next Blinds';
const PRODUCT_TYPE = 'Honeycomb Cellular Shades';
const FLASH_SALE_DISCOUNT = 0.5;
const CORDLESS_SURCHARGE = 35.75;
const TITLE_PREFIX = 'Top Down Bottom Up Cordless ';
const HANDLE_PREFIX = 'top-down-bottom-up-cordless-';
const BAND_SUFFIX = ' - TDBU Cordless';

// ---------------------------------------------------------------------------

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function readCsv(file) {
  const lines = fs.readFileSync(path.join(DATA, file), 'utf8').trim().split('\n');
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(splitCsvLine(l).map((v, i) => [header[i], v])));
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildBodyHtml(p) {
  return p.description.length ? `<p>${esc(p.description[0])}</p>` : '';
}

function buildProductContent(p) {
  return { description: p.description, sections: p.sections };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------

async function upsertProduct(p, colors, groupMinPrice) {
  const title = `${TITLE_PREFIX}${p.title}`;
  const handle = `${HANDLE_PREFIX}${p.handle}`;
  const newBandName = `${p.priceBandName}${BAND_SUFFIX}`;
  const price = (groupMinPrice + CORDLESS_SURCHARGE).toFixed(2);
  const compareAt = ((groupMinPrice + CORDLESS_SURCHARGE) / (1 - FLASH_SALE_DISCOUNT)).toFixed(2);
  const tags = [TDBU_TAG, `price-band:${newBandName}`];

  const variants = colors.map((c) => ({
    option1: c.ColorName,
    price,
    compare_at_price: compareAt,
    sku: `${c.Code}-TDBU`,
    inventory_management: null,
    fulfillment_service: 'manual',
  }));

  console.log(`\n[${String(p.index).padStart(2)}] ${title}`);
  console.log(`     handle  ${handle}`);
  console.log(`     band    ${newBandName}  (from $${price})`);
  console.log(`     tags    ${tags.join(', ')}`);
  console.log(`     colors  ${colors.length}  (${colors.slice(0, 3).map((c) => c.ColorName).join(', ')}${colors.length > 3 ? ', …' : ''})`);

  if (!APPLY) return;

  let product = await findProductByHandle(handle);
  const payload = {
    title,
    handle,
    body_html: buildBodyHtml(p),
    vendor: VENDOR,
    product_type: PRODUCT_TYPE,
    status: 'active',
    tags: tags.join(', '),
    options: [{ name: 'Color', values: colors.map((c) => c.ColorName) }],
    variants,
  };

  if (product) {
    const res = await adminRest(`/products/${product.id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ product: { id: product.id, ...payload } }),
    });
    product = res.product;
    console.log(`     updated (id ${product.id})`);
  } else {
    const res = await adminRest('/products.json', {
      method: 'POST',
      body: JSON.stringify({ product: payload }),
    });
    product = res.product;
    console.log(`     created (id ${product.id})`);
  }

  // Metafield drives price band resolution server-side.
  await adminRest(`/products/${product.id}/metafields.json`, {
    method: 'POST',
    body: JSON.stringify({
      metafield: {
        namespace: 'custom',
        key: 'price_band_name',
        type: 'single_line_text_field',
        value: newBandName,
      },
    }),
  });

  // Structured marketing copy, rendered below the configurator — reused verbatim from the base product.
  await adminRest(`/products/${product.id}/metafields.json`, {
    method: 'POST',
    body: JSON.stringify({
      metafield: {
        namespace: 'custom',
        key: 'product_content',
        type: 'json',
        value: JSON.stringify(buildProductContent(p)),
      },
    }),
  });

  if (!SKIP_IMAGES) {
    const existing = new Set((product.images ?? []).map((i) => path.basename(i.src).split('?')[0]));
    const variantByName = new Map(product.variants.map((v) => [v.option1, v.id]));
    let attached = 0;

    // The generic Top Down Bottom Up thumbnail leads the gallery — attached
    // first, unassigned to any variant, so it's the product's primary image.
    const thumbFilename = path.basename(TDBU_THUMBNAIL);
    if (!existing.has(thumbFilename)) {
      await adminRest(`/products/${product.id}/images.json`, {
        method: 'POST',
        body: JSON.stringify({
          image: {
            attachment: fs.readFileSync(TDBU_THUMBNAIL).toString('base64'),
            filename: thumbFilename,
            position: 1,
          },
        }),
      });
      attached++;
      await sleep(120);
    }

    for (const c of colors) {
      const filename = `${c.Code}.jpg`;
      if (existing.has(filename)) continue;

      const file = path.join(SWATCHES, filename);
      if (!fs.existsSync(file)) {
        console.warn(`     WARN no optimised swatch for ${c.Code}`);
        continue;
      }
      const variantId = variantByName.get(c.ColorName);
      if (!variantId) {
        console.warn(`     WARN no variant matched "${c.ColorName}"`);
        continue;
      }

      await adminRest(`/products/${product.id}/images.json`, {
        method: 'POST',
        body: JSON.stringify({
          image: {
            attachment: fs.readFileSync(file).toString('base64'),
            filename,
            variant_ids: [variantId],
          },
        }),
      });
      attached++;
      await sleep(120); // stay under the REST leaky bucket during bulk image posts
    }
    console.log(`     images  ${attached} attached, ${colors.length + 1 - attached} already present/skipped`);
  }

  const channels = await publishToAllChannels(productGid(product.id));
  console.log(`     published to ${channels} sales channels`);

  return product;
}

// ---------------------------------------------------------------------------

async function main() {
  const allProducts = JSON.parse(fs.readFileSync(path.join(DATA, 'honeycomb-cellular-products.json'), 'utf8'));
  const products = allProducts.filter((p) => !/sheer/i.test(p.title));
  const colorRows = readCsv('honeycomb-cellular-colors.csv');
  const priceRows = readCsv('honeycomb-cellular-prices.csv');

  const colorsByIndex = new Map();
  for (const c of colorRows) {
    const i = Number(c.ProductIndex);
    if (!colorsByIndex.has(i)) colorsByIndex.set(i, []);
    colorsByIndex.get(i).push(c);
  }

  const minByGroup = new Map();
  for (const r of priceRows) {
    const g = Number(r.PriceGroup);
    const v = Number(r.Price);
    if (!minByGroup.has(g) || v < minByGroup.get(g)) minByGroup.set(g, v);
  }

  if (APPLY && !fs.existsSync(TDBU_THUMBNAIL)) {
    throw new Error(`Missing ${TDBU_THUMBNAIL}`);
  }
  if (APPLY && !SKIP_IMAGES && !fs.existsSync(SWATCHES)) {
    throw new Error(`Missing ${SWATCHES} — run: node scripts/prepare-honeycomb-cellular-images.mjs --swatches`);
  }

  const targets = ONLY ? products.filter((p) => p.handle === ONLY) : products;
  if (ONLY && !targets.length) throw new Error(`No eligible (non-sheer) product with handle "${ONLY}"`);

  if (APPLY) {
    const state = await ensureMetafieldDefinition({
      namespace: 'custom',
      key: 'product_content',
      name: 'Product content',
      type: 'json',
      description: 'Structured marketing copy: description paragraphs, features, perfect for, why choose, shop with confidence.',
    });
    console.log(`metafield definition custom.product_content: ${state}\n`);
  }

  console.log(
    `${APPLY ? 'APPLYING' : 'DRY RUN'} — ${targets.length} product(s)${SKIP_IMAGES ? ', images skipped' : ''}`
  );

  for (const p of targets) {
    const colors = colorsByIndex.get(p.index) ?? [];
    if (!colors.length) throw new Error(`Product ${p.index} (${p.handle}) has no colours`);
    await upsertProduct(p, colors, minByGroup.get(p.priceGroup));
  }

  console.log(`\n${APPLY ? 'Done' : 'DRY RUN complete'} — ${targets.length} product(s).`);
  if (!APPLY) console.log('Pass --apply to write to Shopify.');
  else console.log(`Admin: https://${storeDomain}/admin/products`);
}

main().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});
