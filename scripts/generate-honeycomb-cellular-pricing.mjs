/**
 * Writes the 12 Honeycomb/Cellular price bands into src/data/pricing/pricing-data.json
 * from scripts/data/honeycomb-cellular-prices.csv, replacing the phase-1
 * placeholder band.
 *
 *   node scripts/generate-honeycomb-cellular-pricing.mjs           # dry run
 *   node scripts/generate-honeycomb-cellular-pricing.mjs --apply
 *
 * Every width and height the grids need already exists in the shared band pool,
 * so this adds no widthBands/heightBands rows and therefore never disturbs the
 * global ascending-sortOrder invariant the validator enforces.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pricingDataPath,
  readPricingData,
  writeJson,
  checksumPricingData,
  validatePricingData,
} from './pricing-data-utils.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRICES_CSV = path.join(ROOT, 'scripts', 'data', 'honeycomb-cellular-prices.csv');

const APPLY = process.argv.includes('--apply');

/** Band id prefix for the 12 groups. */
const BAND_ID = (g) => `price-band-honeycomb-cellular-g${g}`;
const BAND_NAME = (g) => `Honeycomb Cellular - Group ${g}`;

/** The phase-1 placeholder, replaced wholesale by the real grids. */
const PLACEHOLDER_BAND_ID = 'price-band-honeycomb-cellular-1';

/**
 * Inches -> existing band id in the shared pool. Pinned explicitly rather than
 * looked up by value because 30" is duplicated (750mm and 762mm); 762mm is the
 * exact 30 x 25.4 conversion and the one the other inch-keyed bands align with.
 */
const WIDTH_BAND_IDS = {
  24: 'cmlddwpck0000mo7ksif5mfvo',
  30: 'cmkzul11p0002xs7kt1zbaity',
  36: 'wb-in-36',
  42: 'wb-in-42',
  48: 'wb-in-48',
  54: 'wb-in-54',
  60: 'cmkzul11r0005xs7kj6rhpmgp',
  66: 'wb-in-66',
  72: 'wb-in-72',
  84: 'wb-in-84',
  96: 'wb-in-96',
};

const HEIGHT_BAND_IDS = {
  36: 'hb-in-36',
  42: 'hb-in-42',
  48: 'hb-in-48',
  54: 'hb-in-54',
  60: 'cmkzul1v7000jxs7kcwyraxjr',
  66: 'hb-in-66',
  72: 'hb-in-72',
  78: 'hb-in-78',
  84: 'hb-in-84',
  90: 'hb-in-90',
  96: 'hb-in-96',
};

const GROUP_DESCRIPTIONS = {
  1: '3/8" (25mm) Single Cell — Light Filtering',
  2: '3/8" (25mm) Single Cell — Room Darkening',
  3: '3/8" (25mm) Single Cell — Light Filtering / Gray Back & Printed',
  4: '3/8" (25mm) Single Cell — Room Darkening / Water Resist, Silver Back & Printed',
  5: '3/8" (25mm) Single Cell — Light Filtering Metallic Sheer',
  6: '3/8" (38mm) Double Cell — Light Filtering',
  7: '3/8" (38mm) Double Cell — Room Darkening',
  8: '3/4" (45mm) Single Cell — Light Filtering / Knitted',
  9: '3/4" (45mm) Single Cell — Room Darkening',
  10: '3/4" (45mm) Single Cell — Light Filtering / Silver Back & Printed',
  11: '3/4" (45mm) Single Cell — Room Darkening / Water Resist, Printed & Silver Back',
  12: '3/4" (45mm) Single Cell — Light Filtering Metallic Sheer',
};

function readPricesCsv() {
  const lines = fs.readFileSync(PRICES_CSV, 'utf8').trim().split('\n');
  const rows = lines.slice(1).map((line) => {
    const [group, width, height, price] = line.split(',');
    return { group: Number(group), width: Number(width), height: Number(height), price: Number(price) };
  });
  if (rows.length !== 1452) throw new Error(`Expected 1452 price rows, got ${rows.length}`);
  return rows;
}

function main() {
  const data = readPricingData();
  const priceRows = readPricesCsv();

  const before = { bands: data.priceBands.length, cells: data.priceCells.length };

  // 1. Drop the placeholder band and its cells.
  const removedBands = data.priceBands.filter((b) => b.id === PLACEHOLDER_BAND_ID);
  const removedCells = data.priceCells.filter((c) => c.priceBandId === PLACEHOLDER_BAND_ID);
  data.priceBands = data.priceBands.filter((b) => b.id !== PLACEHOLDER_BAND_ID);
  data.priceCells = data.priceCells.filter((c) => c.priceBandId !== PLACEHOLDER_BAND_ID);

  // 2. Drop any previously generated honeycomb group bands so this is idempotent.
  const groupIds = new Set(Array.from({ length: 12 }, (_, i) => BAND_ID(i + 1)));
  data.priceBands = data.priceBands.filter((b) => !groupIds.has(b.id));
  data.priceCells = data.priceCells.filter((c) => !groupIds.has(c.priceBandId));

  // 3. Add the 12 bands.
  //    NB: never register a bare band named "Honeycomb Cellular" — resolveMinimumPriceBandIds
  //    treats "<name> - Group N" as an aggregation prefix and would fold all 12 together.
  for (let g = 1; g <= 12; g++) {
    data.priceBands.push({
      id: BAND_ID(g),
      name: BAND_NAME(g),
      description: GROUP_DESCRIPTIONS[g],
    });
  }

  // 4. Add the 1452 cells, reusing existing width/height band ids.
  for (const row of priceRows) {
    const widthBandId = WIDTH_BAND_IDS[row.width];
    const heightBandId = HEIGHT_BAND_IDS[row.height];
    if (!widthBandId) throw new Error(`No width band for ${row.width}"`);
    if (!heightBandId) throw new Error(`No height band for ${row.height}"`);
    data.priceCells.push({
      id: `pc-hc-g${row.group}-w${row.width}-h${row.height}`,
      priceBandId: BAND_ID(row.group),
      widthBandId,
      heightBandId,
      price: row.price,
    });
  }

  // 5. Refresh provenance + checksum.
  data.generatedAt = new Date().toISOString();
  data.source = 'manual+phase1-multi-table (Roller Band F G1-4, Dayandnight Band H G1-2)+honeycomb-cellular-g1-12';
  data.checksum = checksumPricingData(data);

  const { errors, warnings } = validatePricingData(data, { requireChecksum: true });

  console.log(`Placeholder removed : ${removedBands.length} band, ${removedCells.length} cells`);
  console.log(`Bands   : ${before.bands} -> ${data.priceBands.length}`);
  console.log(`Cells   : ${before.cells} -> ${data.priceCells.length}`);
  console.log(`Checksum: ${data.checksum}`);

  const hcWarnings = warnings.filter((w) => w.includes('Honeycomb Cellular'));
  if (hcWarnings.length) {
    console.log(`\nHoneycomb warnings (${hcWarnings.length}):`);
    hcWarnings.forEach((w) => console.log('  ' + w));
  }
  if (errors.length) {
    console.error(`\nVALIDATION FAILED (${errors.length}):`);
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }
  console.log('\nValidation passed.');

  // Spot-check the three grid corners named in the plan.
  const checks = [
    [1, 24, 36, 68.88],
    [7, 96, 96, 929.04],
    [8, 24, 36, 60.90],
  ];
  for (const [g, w, h, expected] of checks) {
    const cell = data.priceCells.find((c) => c.id === `pc-hc-g${g}-w${w}-h${h}`);
    const ok = cell && Math.abs(cell.price - expected) < 0.005;
    console.log(`  ${ok ? 'OK ' : 'BAD'} G${g} ${w}x${h} = ${cell?.price} (expected ${expected})`);
    if (!ok) process.exit(1);
  }

  if (!APPLY) {
    console.log('\nDRY RUN — pass --apply to write pricing-data.json');
    return;
  }
  writeJson(pricingDataPath, data);
  console.log(`\nWrote ${pricingDataPath}`);
}

main();
