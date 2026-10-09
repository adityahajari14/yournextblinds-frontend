/**
 * Generates src/data/honeycombCellularCatalog.ts from
 * scripts/data/honeycomb-cellular-products.json.
 *
 *   node scripts/generate-honeycomb-cellular-catalog.mjs
 *
 * The generated module carries only what the app needs at runtime: the 19
 * product handles (for sub-category filtering on the collection page) and the 10
 * sub-category cards. The 145 colours are deliberately NOT included — they live
 * in Shopify as variants and the PDP renders swatches from `variant.image`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS_JSON = path.join(ROOT, 'scripts', 'data', 'honeycomb-cellular-products.json');
const OUT = path.join(ROOT, 'src', 'data', 'honeycombCellularCatalog.ts');

const IMG = '/collections/honeycomb-cellular';

/**
 * The 10 sub-category cards, in the order given in new-products.md.
 *
 * `preselect` carries a control choice through to the PDP. Only cordless and
 * motorized have a matching option in HoneycombCellularSelector; No Drill is a
 * browse-only entry point.
 *
 * `top-down-bottom-up` is exempt from the "every card must match a product"
 * check below: those are standalone Shopify products (Top Down Bottom Up
 * Cordless, one per non-sheer base product here) selected by the
 * `top-down-bottom-up-cordless` tag, not by subCategories membership on these
 * 19 products — see src/data/curatedCollections.ts and honeycombCellular.ts.
 */
const TAG_DRIVEN_CARD_IDS = new Set(['top-down-bottom-up']);
const CARDS = [
  { id: 'all', label: 'Cellular Honeycomb Shades', image: `${IMG}/all.webp` },
  { id: 'light-filtering', label: 'Light Filtering Cellular Shades', image: `${IMG}/light-filtering.webp` },
  { id: 'blackout', label: 'Blackout Cellular Shades', image: `${IMG}/blackout.webp` },
  { id: 'top-down-bottom-up', label: 'Top Down Bottom Up Cellular Shades', image: `${IMG}/top-down-bottom-up.webp` },
  { id: 'motorized', label: 'Motorized Cellular Shades', image: `${IMG}/motorized.webp`, preselect: 'motorized' },
  { id: 'cordless', label: 'Cordless Cellular Shades', image: `${IMG}/cordless.webp`, preselect: 'cordless' },
  { id: 'no-drill', label: 'No Drill Cellular Shades', image: `${IMG}/no-drill.webp` },
  { id: 'water-resistant', label: 'Water Resistant Cellular Shades', image: `${IMG}/water-resistant.webp` },
  { id: 'printed', label: 'Printed Cellular Shades', image: `${IMG}/printed.webp` },
  { id: 'metallic-sheer', label: 'Metallic Sheer Cellular Shades', image: `${IMG}/metallic-sheer.webp` },
];

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
  if (products.length !== 19) throw new Error(`Expected 19 products, got ${products.length}`);

  // Every card id must be claimed by at least one product, and every product
  // sub-category must correspond to a real card.
  const cardIds = new Set(CARDS.map((c) => c.id));
  const usedIds = new Set(products.flatMap((p) => p.subCategories));
  for (const id of usedIds) if (!cardIds.has(id)) throw new Error(`Product references unknown sub-category "${id}"`);
  for (const id of cardIds) {
    if (TAG_DRIVEN_CARD_IDS.has(id)) continue;
    if (!usedIds.has(id)) throw new Error(`Card "${id}" matches no products`);
  }

  const counts = Object.fromEntries(
    CARDS.map((c) => [c.id, products.filter((p) => p.subCategories.includes(c.id)).length])
  );

  const lines = [];
  lines.push('/**');
  lines.push(' * Honeycomb/Cellular Shades catalogue — GENERATED FILE, DO NOT EDIT BY HAND.');
  lines.push(' *');
  lines.push(' * Regenerate with:');
  lines.push(' *   node scripts/extract-honeycomb-cellular-source.mjs');
  lines.push(' *   node scripts/generate-honeycomb-cellular-catalog.mjs');
  lines.push(' *');
  lines.push(' * Source of truth: scripts/data/honeycomb-cellular-products.json');
  lines.push(' */');
  lines.push('');
  lines.push('/**');
  lines.push(' * A sub-category card shown at the top of the honeycomb collection pages.');
  lines.push(' * Each links to its own standalone collection (src/data/honeycombSubCollections.ts);');
  lines.push(' * the `all` card is dropped from that list since the family page is the "all" view.');
  lines.push(' */');
  lines.push('export interface HoneycombSubCategoryCard {');
  lines.push('  id: string;');
  lines.push('  label: string;');
  lines.push('  image: string;');
  lines.push('  /** Control option to preselect on the product page when arriving via this card. */');
  lines.push("  preselect?: 'motorized' | 'cordless';");
  lines.push('}');
  lines.push('');
  lines.push('export interface HoneycombCellularProduct {');
  lines.push('  handle: string;');
  lines.push('  title: string;');
  lines.push('  priceBandName: string;');
  lines.push('  priceGroup: number;');
  lines.push('  subCategoryIds: string[];');
  lines.push('}');
  lines.push('');

  lines.push('export const HONEYCOMB_SUBCATEGORY_CARDS: HoneycombSubCategoryCard[] = [');
  for (const c of CARDS) {
    const parts = [`id: ${q(c.id)}`, `label: ${q(c.label)}`, `image: ${q(c.image)}`];
    if (c.preselect) parts.push(`preselect: ${q(c.preselect)}`);
    lines.push(`  { ${parts.join(', ')} }, // ${counts[c.id]} products`);
  }
  lines.push('];');
  lines.push('');

  lines.push('export const HONEYCOMB_CELLULAR_PRODUCTS: HoneycombCellularProduct[] = [');
  for (const p of products.slice().sort((a, b) => a.index - b.index)) {
    lines.push('  {');
    lines.push(`    handle: ${q(p.handle)},`);
    lines.push(`    title: ${q(p.title)},`);
    lines.push(`    priceBandName: ${q(p.priceBandName)},`);
    lines.push(`    priceGroup: ${p.priceGroup},`);
    lines.push(`    subCategoryIds: [${p.subCategories.map(q).join(', ')}],`);
    lines.push('  },');
  }
  lines.push('];');
  lines.push('');

  lines.push('/** handle -> sub-category ids, for filtering a product list by an active card. */');
  lines.push('export const HONEYCOMB_SUBCATEGORIES_BY_HANDLE: Record<string, string[]> =');
  lines.push('  Object.fromEntries(HONEYCOMB_CELLULAR_PRODUCTS.map((p) => [p.handle, p.subCategoryIds]));');
  lines.push('');
  lines.push('/** True when the product belongs to the given sub-category card. */');
  lines.push('export function matchesHoneycombSubCategory(handle: string, subCategoryId: string): boolean {');
  lines.push('  return HONEYCOMB_SUBCATEGORIES_BY_HANDLE[handle]?.includes(subCategoryId) ?? false;');
  lines.push('}');
  lines.push('');

  fs.writeFileSync(OUT, lines.join('\n'));

  console.log(`Wrote ${path.relative(ROOT, OUT)}`);
  console.log(`  ${products.length} products, ${CARDS.length} cards`);
  console.log('\nCard product counts:');
  for (const c of CARDS) console.log(`  ${String(counts[c.id]).padStart(2)}  ${c.id}`);
}

main();
