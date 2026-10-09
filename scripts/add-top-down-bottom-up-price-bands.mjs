/**
 * Adds a "TDBU Cordless" price band for every Honeycomb Cellular price band
 * used by a non-sheer base product, cloning its price cells with the
 * cordless surcharge ($35.75, see HONEYCOMB_CELLULAR_CONTROL_OPTIONS in
 * src/data/honeycombCellular.ts) baked into every cell — the standalone
 * "Top Down Bottom Up Cordless" products have no control-option picker, so
 * the surcharge can't be added as a customization line item like it is for
 * the 19 base products.
 *
 *   node scripts/add-top-down-bottom-up-price-bands.mjs
 *
 * Idempotent: skips any band whose "<name> - TDBU Cordless" already exists.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { checksumPricingData, pricingDataPath, readPricingData, validatePricingData, writeJson } from './pricing-data-utils.mjs';

const CORDLESS_SURCHARGE = 35.75;
const SUFFIX = ' - TDBU Cordless';

// The 10 distinct price bands used by the 17 non-sheer honeycomb base products
// (see scripts/data/honeycomb-cellular-products.json).
const SOURCE_BAND_NAMES = [
  'Honeycomb Cellular - Group 1',
  'Honeycomb Cellular - Group 2',
  'Honeycomb Cellular - Group 3',
  'Honeycomb Cellular - Group 4',
  'Honeycomb Cellular - Group 6',
  'Honeycomb Cellular - Group 7',
  'Honeycomb Cellular - Group 8',
  'Honeycomb Cellular - Group 9',
  'Honeycomb Cellular - Group 10',
  'Honeycomb Cellular - Group 11',
];

function cuid() {
  // Not a real cuid, just an id in the same shape/charset as the rest of the
  // file (c + 24 hex chars) so it reads consistently — uniqueness is what
  // actually matters, validated below.
  return `ctdbu${crypto.randomBytes(11).toString('hex')}`;
}

function main() {
  const data = readPricingData();
  const existingNames = new Set(data.priceBands.map((b) => b.name));

  let addedBands = 0;
  let addedCells = 0;

  for (const sourceName of SOURCE_BAND_NAMES) {
    const sourceBand = data.priceBands.find((b) => b.name === sourceName);
    if (!sourceBand) throw new Error(`Source price band not found: ${sourceName}`);

    const newName = `${sourceName}${SUFFIX}`;
    if (existingNames.has(newName)) {
      console.log(`skip (exists)  ${newName}`);
      continue;
    }

    const newBandId = cuid();
    data.priceBands.push({
      id: newBandId,
      name: newName,
      description: `${sourceBand.description ?? sourceName} — Top Down Bottom Up Cordless (cordless surcharge included)`,
    });
    addedBands++;

    const sourceCells = data.priceCells.filter((c) => c.priceBandId === sourceBand.id);
    for (const cell of sourceCells) {
      data.priceCells.push({
        id: cuid(),
        priceBandId: newBandId,
        widthBandId: cell.widthBandId,
        heightBandId: cell.heightBandId,
        price: Math.round((cell.price + CORDLESS_SURCHARGE) * 100) / 100,
      });
      addedCells++;
    }

    console.log(`added          ${newName}  (${sourceCells.length} cells, +$${CORDLESS_SURCHARGE})`);
  }

  data.generatedAt = new Date().toISOString();
  delete data.checksum;
  data.checksum = checksumPricingData(data);

  const validation = validatePricingData(data, { requireChecksum: true });
  if (validation.errors.length > 0) {
    console.error('Validation failed:');
    for (const e of validation.errors) console.error(`- ${e}`);
    process.exit(1);
  }
  for (const w of validation.warnings) console.warn(`Warning: ${w}`);

  writeJson(pricingDataPath, data);
  console.log(`\nDone — ${addedBands} band(s), ${addedCells} cell(s) added.`);
}

main();
