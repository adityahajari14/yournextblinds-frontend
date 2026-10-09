/**
 * Extracts the Honeycomb/Cellular catalogue from the supplier drop into committed,
 * reviewable source files.
 *
 *   Honeycomb-cellular/Price Tables and Bands.xlsx  (gitignored, ~50KB)
 *   Honeycomb-cellular/new-products.md              (gitignored)
 *   Honeycomb-cellular/{25mm,38mm,45mm}/*.JPG       (gitignored, ~1.2GB)
 *        |
 *        v
 *   scripts/data/honeycomb-cellular-colors.csv      145 colour rows
 *   scripts/data/honeycomb-cellular-prices.csv      1452 price cells
 *   scripts/data/honeycomb-cellular-products.json   19 products + copy
 *
 * The supplier folder is gitignored, so these three artefacts are the source of
 * truth for every downstream script. Re-runnable and deterministic.
 *
 *   node scripts/extract-honeycomb-cellular-source.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSheetRows } from './xlsx-read.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'Honeycomb-cellular');
const XLSX = path.join(SRC, 'Price Tables and Bands.xlsx');
const MD = path.join(SRC, 'new-products.md');
const OUT = path.join(ROOT, 'scripts', 'data');

// ---------------------------------------------------------------------------
// Reviewed corrections to the supplier data. Each one is a deliberate decision;
// do not "fix" these silently in the sheet, keep the provenance here.
// ---------------------------------------------------------------------------

/**
 * Sheet row 21 has STYLE NAME `3/8" (25mm) Single Cell` but OPACITY
 * `Room Darkening` and PRICE GROUP 2 — the style cell was never advanced to the
 * `... Single Cell RD` block. Group 2 is already correct so pricing is
 * unaffected; only the style (i.e. which product it belongs to) is wrong.
 */
const STYLE_OVERRIDES = { H25016D: '3/8" (25mm) Single Cell RD' };

/**
 * The only unmatched image is 45mm/H45232PD.JPG and the only colour missing an
 * image is H45323PD — a digit transposition. 45mm Printed LF has a real
 * H45323P, which corroborates 323 as the correct number. Confirmed with owner.
 */
const SWATCH_ALIASES = { H45323PD: 'H45232PD' };

/** Colours with no usable swatch. The colour grid renders from variant images, so
 *  a variant without one would render broken — omit until the photo arrives. */
const COLORS_WITHOUT_SWATCH = new Set(['H45000']);

/**
 * Product order in new-products.md -> STYLE NAME in the xlsx. This is the single
 * human judgement in the whole pipeline (the two files share no key), so it is
 * written out explicitly and then asserted rather than inferred.
 */
const PRODUCT_STYLE_BY_INDEX = {
  1: '3/8" (25mm) Single Cell',
  2: '3/8" (25mm) Single Cell RD',
  3: '3/8" (25mm) Gray Back LF',
  4: '3/8" (25mm) Printed LF',
  5: '3/8" (25mm) Water Resist RD',
  6: '3/8" (25mm) Silver Back RD',
  7: '3/8" (25mm) Printed RD',
  8: '3/8" (25mm) Metallic Sheer LF',
  9: '3/8" (38 mm) Double Cell RD',
  10: '3/4" (45 mm) Single Cell LF',
  11: '3/4" (45 mm) Single Cell Premium Knitted LF',
  12: '3/4" (45 mm) Single Cell RD',
  13: '3/8" (38 mm) Double Cell LF',
  14: '3/4" (45mm) Silver Back LF',
  15: '3/4" (45mm) Printed LF',
  16: '3/4" (45mm) Waterproof RD',
  17: '3/4" (45mm) Silver Back RD',
  18: '3/4" (45mm) Printed RD',
  19: '3/4" (45mm) Metallic Sheer LF',
};

const EXPECTED_COLOR_COUNTS = {
  1: 19, 2: 23, 3: 2, 4: 6, 5: 6, 6: 2, 7: 6, 8: 3, 9: 12, 10: 13,
  11: 3, 12: 12, 13: 13, 14: 2, 15: 6, 16: 6, 17: 2, 18: 6, 19: 3,
};

const WIDTHS = [24, 30, 36, 42, 48, 54, 60, 66, 72, 84, 96];
const HEIGHTS = [36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96];
const PRICE_COLS = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const problems = [];
const warn = (m) => { problems.push(m); console.warn('  WARN ' + m); };
const fail = (m) => { throw new Error(m); };

/** Normalise curly quotes and whitespace. Note `(38 mm)` vs `(38mm)` is NOT
 *  collapsed — those are distinct style names that never collide. */
const normStyle = (s) => s.replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

const cleanColorName = (s) => s.replace(/\s*\.LTX\s*$/i, '').replace(/\s+/g, ' ').trim();

const slugify = (s) =>
  s.toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/["'’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const toCsv = (header, rows) =>
  [header.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n') + '\n';

// ---------------------------------------------------------------------------
// 1. Colours (Bands sheet)
// ---------------------------------------------------------------------------
function extractColors() {
  const rows = readSheetRows(XLSX, 'Bands');
  const colors = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r.B) continue;
    const code = r.B.trim().toUpperCase();
    const style = STYLE_OVERRIDES[code] ?? normStyle(r.A ?? '');
    if (!style) fail(`Row ${i + 1} (${code}) has no STYLE NAME`);

    colors.push({
      code,
      style,
      name: cleanColorName(r.C ?? ''),
      opacity: (r.D ?? '').trim(),
      priceGroup: Number((r.E ?? '').trim()),
    });
  }

  // Invariant: one style => exactly one price group. This is what lets us key
  // pricing off the product-level metafield instead of per-variant resolution.
  const groupsByStyle = new Map();
  for (const c of colors) {
    if (!groupsByStyle.has(c.style)) groupsByStyle.set(c.style, new Set());
    groupsByStyle.get(c.style).add(c.priceGroup);
  }
  for (const [style, groups] of groupsByStyle) {
    if (groups.size !== 1) {
      fail(`Style "${style}" spans price groups ${[...groups].join(', ')} — one style must map to exactly one group`);
    }
  }
  if (groupsByStyle.size !== 19) {
    fail(`Expected 19 styles, found ${groupsByStyle.size}:\n  ${[...groupsByStyle.keys()].join('\n  ')}`);
  }

  const dupes = colors.map((c) => c.code).filter((c, i, a) => a.indexOf(c) !== i);
  if (dupes.length) fail(`Duplicate colour codes: ${dupes.join(', ')}`);

  return colors;
}

// ---------------------------------------------------------------------------
// 2. Swatch images
// ---------------------------------------------------------------------------
function indexSwatches() {
  // Prefix-folder-first: H25*->25mm, H38*->38mm, H45*->45mm. This deterministically
  // ignores the stray 45mm/H25125.jpg duplicate of 25mm/H25125.JPG.
  const byFolder = {};
  for (const folder of ['25mm', '38mm', '45mm']) {
    byFolder[folder] = new Map();
    for (const f of fs.readdirSync(path.join(SRC, folder))) {
      byFolder[folder].set(path.parse(f).name.toUpperCase(), `${folder}/${f}`);
    }
  }
  return (code) => {
    const lookup = SWATCH_ALIASES[code] ?? code;
    const folder = { H25: '25mm', H38: '38mm', H45: '45mm' }[lookup.slice(0, 3)];
    return (folder && byFolder[folder].get(lookup)) || null;
  };
}

// ---------------------------------------------------------------------------
// 3. Price grids (Pricing sheet)
// ---------------------------------------------------------------------------
function extractPrices() {
  const rows = readSheetRows(XLSX, 'Pricing');

  // Locate the 12 title rows. The group number is taken from the block's ordinal
  // index, never parsed from the title: row 144 reads "PRICE GROUP 103/4”..."
  // (no space after 10), which a /PRICE GROUP (\d+)/ regex would read as 103.
  const titles = [];
  rows.forEach((r, i) => {
    if (typeof r.A === 'string' && r.A.trim().startsWith('PRICE GROUP')) titles.push({ row: i, title: r.A.trim() });
  });
  if (titles.length !== 12) fail(`Expected 12 price groups, found ${titles.length}`);

  const cells = [];
  titles.forEach(({ row, title }, idx) => {
    const group = idx + 1;
    const end = idx + 1 < titles.length ? titles[idx + 1].row : rows.length;

    // Header row carrying the widths sits two rows below the title.
    const header = rows[row + 2];
    const widths = PRICE_COLS.map((c) => parseInt(String(header?.[c] ?? '').replace(/\D/g, ''), 10));
    if (widths.join() !== WIDTHS.join()) {
      fail(`Group ${group} widths ${widths.join(',')} != expected ${WIDTHS.join(',')} (${title})`);
    }

    // Blocks are not a fixed height (group 9's is 15 rows, others 16) — walk to
    // the next title and take every row whose column A is a height.
    const heights = [];
    for (let i = row + 3; i < end; i++) {
      const label = String(rows[i]?.A ?? '').trim();
      if (!label) continue;
      const h = parseInt(label.replace(/\D/g, ''), 10);
      if (!Number.isFinite(h)) continue;
      heights.push(h);

      PRICE_COLS.forEach((col, wi) => {
        const raw = rows[i][col];
        if (raw == null || raw === '') fail(`Group ${group} missing cell ${WIDTHS[wi]}x${h}`);
        // The sheet is full of float noise (112.97999999999999).
        cells.push({ group, width: WIDTHS[wi], height: h, price: Math.round(Number(raw) * 100) / 100 });
      });
    }

    if (heights.join() !== HEIGHTS.join()) {
      fail(`Group ${group} heights ${heights.join(',')} != expected ${HEIGHTS.join(',')} (${title})`);
    }
  });

  if (cells.length !== 12 * 121) fail(`Expected 1452 price cells, got ${cells.length}`);
  return cells;
}

// ---------------------------------------------------------------------------
// 4. Marketing copy (new-products.md)
// ---------------------------------------------------------------------------
/**
 * Section headings used in new-products.md, and how their body should render.
 * `list` = bullet list, `prose` = paragraphs. Returns null for ordinary lines.
 */
function headingKind(line) {
  if (line === 'Features & Benefits' || line === 'Perfect For') return 'list';
  if (line.startsWith('Why Choose') && line.endsWith('?')) return 'prose';
  if (line.startsWith('Shop with Confidence')) return 'prose';
  return null;
}

function extractProducts() {
  // Supplier file is CRLF; normalise so the section/line splits below are simple.
  const md = fs.readFileSync(MD, 'utf8').replace(/\r\n?/g, '\n');
  const body = md.split(/\nProducts:\n/)[1];
  if (!body) fail('Could not find "Products:" section in new-products.md');

  const blocks = body.split(/\n-{20,}\n/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length !== 19) fail(`Expected 19 product blocks, found ${blocks.length}`);

  return blocks.map((block) => {
    const head = /^(\d+)\)\s*(.+)$/m.exec(block);
    if (!head) fail(`Unparseable product heading: ${block.slice(0, 60)}`);
    const index = Number(head[1]);
    const title = head[2].trim();

    // Section by detected headings rather than fixed order: products 1-4 run
    // paragraphs -> Features -> Why Choose, while 5-19 run paragraphs -> Why
    // Choose -> Features -> Perfect For -> Shop with Confidence. Headings are
    // kept verbatim (they name the collection, e.g. "Why Choose Lumina …?") and
    // in source order, so the page can mirror the document exactly.
    const description = [];
    const sections = [];
    let current = null;

    for (const rawLine of block.slice(head[0].length).split('\n')) {
      const line = rawLine.replace(/^\s*[✔✓]\s*/, '').trim();
      if (!line) continue;

      const kind = headingKind(line);
      if (kind) {
        current = { heading: line, kind, items: [] };
        sections.push(current);
        continue;
      }
      (current ? current.items : description).push(line);
    }

    if (!description.length) fail(`Product ${index} has no description`);
    if (!sections.some((s) => s.heading === 'Features & Benefits')) {
      fail(`Product ${index} has no Features & Benefits`);
    }
    const empty = sections.filter((s) => !s.items.length);
    if (empty.length) fail(`Product ${index} has empty section(s): ${empty.map((s) => s.heading).join(', ')}`);

    return { index, title, handle: slugify(title), description, sections };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  if (!fs.existsSync(XLSX)) fail(`Missing ${XLSX} — the supplier folder is gitignored; restore it to re-extract.`);

  console.log('Extracting Honeycomb/Cellular source data...\n');

  const colors = extractColors();
  const findSwatch = indexSwatches();
  const prices = extractPrices();
  const products = extractProducts();

  console.log(`  colours: ${colors.length}`);
  console.log(`  price cells: ${prices.length}`);
  console.log(`  products: ${products.length}`);

  // Join products to styles, and assert the mapping is complete and consistent.
  const colorsByStyle = new Map();
  for (const c of colors) {
    if (!colorsByStyle.has(c.style)) colorsByStyle.set(c.style, []);
    colorsByStyle.get(c.style).push(c);
  }

  const seenStyles = new Set();
  const enriched = products.map((p) => {
    const style = PRODUCT_STYLE_BY_INDEX[p.index];
    if (!style) fail(`No style mapping for product ${p.index}`);
    if (seenStyles.has(style)) fail(`Style "${style}" mapped to two products`);
    seenStyles.add(style);

    const styleColors = colorsByStyle.get(style);
    if (!styleColors) fail(`Product ${p.index} maps to style "${style}" which has no colours`);

    const priceGroup = styleColors[0].priceGroup;
    const opacity = styleColors[0].opacity;

    if (styleColors.length !== EXPECTED_COLOR_COUNTS[p.index]) {
      fail(`Product ${p.index} (${style}) has ${styleColors.length} colours, expected ${EXPECTED_COLOR_COUNTS[p.index]}`);
    }

    const usable = styleColors.filter((c) => {
      if (COLORS_WITHOUT_SWATCH.has(c.code)) {
        warn(`${c.code} (${c.name}) has no swatch — omitted from product ${p.index}`);
        return false;
      }
      if (!findSwatch(c.code)) {
        warn(`${c.code} (${c.name}) swatch not found on disk — omitted from product ${p.index}`);
        return false;
      }
      return true;
    });

    const names = usable.map((c) => c.name);
    const dupeNames = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupeNames.length) fail(`Product ${p.index} has duplicate colour names (Shopify option values must be unique): ${dupeNames.join(', ')}`);

    // Sub-categories derive from opacity + style, not a hand-written list.
    const subCategories = ['all'];
    subCategories.push(opacity === 'Room Darkening' ? 'blackout' : 'light-filtering');
    if (/water\s*resist|waterproof/i.test(style)) subCategories.push('water-resistant');
    if (/printed/i.test(style)) subCategories.push('printed');
    if (/metallic sheer/i.test(style)) subCategories.push('metallic-sheer');
    // Every product supports these control options, so all four cards match all 19.
    subCategories.push('cordless', 'motorized', 'no-drill', 'top-down-bottom-up');

    return {
      ...p,
      styleName: style,
      priceGroup,
      opacity,
      cellSize: style.includes('25mm') ? '25mm' : style.includes('38') ? '38mm' : '45mm',
      priceBandName: `Honeycomb Cellular - Group ${priceGroup}`,
      subCategories,
      colorCount: usable.length,
    };
  });

  const handles = enriched.map((p) => p.handle);
  const dupeHandles = handles.filter((h, i) => handles.indexOf(h) !== i);
  if (dupeHandles.length) fail(`Duplicate product handles: ${dupeHandles.join(', ')}`);

  const styleToIndex = new Map(enriched.map((p) => [p.styleName, p.index]));

  fs.mkdirSync(OUT, { recursive: true });

  const colorRows = colors
    .filter((c) => !COLORS_WITHOUT_SWATCH.has(c.code) && findSwatch(c.code))
    .map((c) => [styleToIndex.get(c.style), c.style, c.code, c.name, c.opacity, c.priceGroup, findSwatch(c.code)]);
  fs.writeFileSync(
    path.join(OUT, 'honeycomb-cellular-colors.csv'),
    toCsv(['ProductIndex', 'StyleName', 'Code', 'ColorName', 'Opacity', 'PriceGroup', 'SwatchFile'], colorRows)
  );

  fs.writeFileSync(
    path.join(OUT, 'honeycomb-cellular-prices.csv'),
    toCsv(['PriceGroup', 'WidthInches', 'HeightInches', 'Price'],
      prices.map((c) => [c.group, c.width, c.height, c.price.toFixed(2)]))
  );

  fs.writeFileSync(
    path.join(OUT, 'honeycomb-cellular-products.json'),
    JSON.stringify(enriched, null, 2) + '\n'
  );

  console.log('\nWrote:');
  console.log(`  scripts/data/honeycomb-cellular-colors.csv    ${colorRows.length} rows`);
  console.log(`  scripts/data/honeycomb-cellular-prices.csv    ${prices.length} rows`);
  console.log(`  scripts/data/honeycomb-cellular-products.json 19 products`);

  console.log('\nPer-product colour counts:');
  for (const p of enriched) {
    const flag = p.colorCount === EXPECTED_COLOR_COUNTS[p.index] ? ' ' : '*';
    console.log(` ${flag}${String(p.index).padStart(3)}  G${String(p.priceGroup).padEnd(2)} ${String(p.colorCount).padStart(2)} colours  ${p.handle}`);
  }

  if (problems.length) {
    console.log(`\n${problems.length} warning(s) — see WARN lines above.`);
  }
}

main();
