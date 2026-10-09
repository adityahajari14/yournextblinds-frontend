/**
 * Creates or updates the 19 Honeycomb/Cellular Shades products in Shopify.
 *
 *   node scripts/upsert-honeycomb-cellular-products.mjs                  # dry run
 *   node scripts/upsert-honeycomb-cellular-products.mjs --apply
 *   node scripts/upsert-honeycomb-cellular-products.mjs --apply --only <handle>
 *   node scripts/upsert-honeycomb-cellular-products.mjs --apply --skip-images
 *
 * Reads the committed extracts in scripts/data/ and the optimised swatches in
 * Honeycomb-cellular/.optimized/ (run prepare-honeycomb-cellular-images.mjs first).
 *
 * Tagging is deliberately minimal: the family tag plus a price-band tag, nothing
 * more. Sub-category filtering on the collection page runs off the generated
 * catalogue (handle -> sub-category ids), NOT off Shopify tags. Adding `cordless`
 * or `no-drill` tags here would be actively destructive: a curated collection
 * whose tagSlug matches is overridden outright once >=5 products carry the tag
 * (MIN_TAGGED_PRODUCTS_TO_OVERRIDE in src/lib/api.ts), so 19 tagged honeycombs
 * would replace the entire product set of /collections/cordless-blinds and
 * /collections/no-drill-blinds.
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

const APPLY = process.argv.includes('--apply');
const SKIP_IMAGES = process.argv.includes('--skip-images');
/** Stage the products out of search/listings until the collection page ships. */
const HIDDEN = process.argv.includes('--hidden');
const ONLY = (() => {
  const i = process.argv.indexOf('--only');
  return i >= 0 ? process.argv[i + 1] : null;
})();

const FAMILY_TAG = 'honeycomb-cellular-shades';
const HIDDEN_TAG = 'hidden-test-product';
const VENDOR = 'Your Next Blinds';
const PRODUCT_TYPE = 'Honeycomb Cellular Shades';
const FLASH_SALE_DISCOUNT = 0.5;

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

/**
 * Shopify's `body_html` holds ONLY the opening paragraph.
 *
 * The full copy (paragraphs, Features & Benefits, Perfect For, Why Choose, Shop
 * with Confidence) goes into the `custom.product_content` JSON metafield and is
 * rendered as structured sections below the configurator. Putting it all in
 * body_html collapses it into one run-on wall of text, because Shopify derives
 * the plain-text `description` field by stripping the markup.
 */
function buildBodyHtml(p) {
  return p.description.length ? `<p>${esc(p.description[0])}</p>` : '';
}

/** The structured copy, mirroring new-products.md verbatim — headings and order included. */
function buildProductContent(p) {
  return { description: p.description, sections: p.sections };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------

async function upsertProduct(p, colors, groupMinPrice) {
  const price = groupMinPrice.toFixed(2);
  const compareAt = (groupMinPrice / (1 - FLASH_SALE_DISCOUNT)).toFixed(2);
  const tags = [FAMILY_TAG, `price-band:${p.priceBandName}`];
  if (HIDDEN) tags.push(HIDDEN_TAG);

  const variants = colors.map((c) => ({
    option1: c.ColorName,
    price,
    compare_at_price: compareAt,
    sku: c.Code,
    inventory_management: null,
    fulfillment_service: 'manual',
  }));

  console.log(`\n[${String(p.index).padStart(2)}] ${p.title}`);
  console.log(`     handle  ${p.handle}`);
  console.log(`     band    ${p.priceBandName}  (from $${price})`);
  console.log(`     tags    ${tags.join(', ')}`);
  console.log(`     colors  ${colors.length}  (${colors.slice(0, 3).map((c) => c.ColorName).join(', ')}${colors.length > 3 ? ', …' : ''})`);

  if (!APPLY) return;

  let product = await findProductByHandle(p.handle);
  const payload = {
    title: p.title,
    handle: p.handle,
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
        value: p.priceBandName,
      },
    }),
  });

  // Structured marketing copy, rendered below the configurator.
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
    console.log(`     images  ${attached} attached, ${colors.length - attached} already present/skipped`);
  }

  const channels = await publishToAllChannels(productGid(product.id));
  console.log(`     published to ${channels} sales channels`);

  return product;
}

// ---------------------------------------------------------------------------

async function main() {
  const products = JSON.parse(fs.readFileSync(path.join(DATA, 'honeycomb-cellular-products.json'), 'utf8'));
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

  if (APPLY && !SKIP_IMAGES && !fs.existsSync(SWATCHES)) {
    throw new Error(`Missing ${SWATCHES} — run: node scripts/prepare-honeycomb-cellular-images.mjs --swatches`);
  }

  const targets = ONLY ? products.filter((p) => p.handle === ONLY) : products;
  if (ONLY && !targets.length) throw new Error(`No product with handle "${ONLY}"`);

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
    `${APPLY ? 'APPLYING' : 'DRY RUN'} — ${targets.length} product(s)` +
    `${SKIP_IMAGES ? ', images skipped' : ''}` +
    `${HIDDEN ? `, tagged ${HIDDEN_TAG} (staged out of search/listings)` : ''}`
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
