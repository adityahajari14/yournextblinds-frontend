/**
 * Honeycomb/Cellular customization changes:
 *   - Motorization simplifies from a 2-choice remote dropdown (Single/Multi Channel)
 *     to a single "Motorized Wand" option — no separate remote fee, the flat $95
 *     motorization base (src/lib/pricing.ts / pricing.service.ts) already covers it.
 *   - New optional "Upgrade to No Drill System" checkbox, +$39.00 flat.
 *
 *   node scripts/update-honeycomb-cellular-motorization-no-drill.mjs           # dry run
 *   node scripts/update-honeycomb-cellular-motorization-no-drill.mjs --apply
 */
import {
  pricingDataPath,
  readPricingData,
  writeJson,
  checksumPricingData,
  validatePricingData,
} from './pricing-data-utils.mjs';

const APPLY = process.argv.includes('--apply');

const REMOVE_OPTION_IDS = ['opt-hc-single-channel', 'opt-hc-multi-channel'];

function main() {
  const data = readPricingData();
  const before = { options: data.customizationOptions.length, pricings: data.customizationPricings.length };

  data.customizationOptions = data.customizationOptions.filter((o) => !REMOVE_OPTION_IDS.includes(o.id));
  data.customizationPricings = data.customizationPricings.filter(
    (p) => !REMOVE_OPTION_IDS.includes(p.customizationOptionId)
  );

  const addOptions = [
    { id: 'opt-hc-motorized-wand', category: 'motorization', optionId: 'hc-motorized-wand', name: 'Motorized Wand', description: null, sortOrder: 0 },
    { id: 'opt-hc-no-drill-upgrade', category: 'no-drill-upgrade', optionId: 'hc-no-drill-upgrade', name: 'Upgrade to No Drill System', description: null, sortOrder: 0 },
  ];
  const addPricings = [
    { id: 'price-hc-motorized-wand', customizationOptionId: 'opt-hc-motorized-wand', widthBandId: null, price: 0, isPerUnit: false },
    { id: 'price-hc-no-drill-upgrade', customizationOptionId: 'opt-hc-no-drill-upgrade', widthBandId: null, price: 39, isPerUnit: false },
  ];

  // Idempotent: drop any previous run's rows for these ids before re-adding.
  const newIds = new Set(addOptions.map((o) => o.id));
  data.customizationOptions = data.customizationOptions.filter((o) => !newIds.has(o.id));
  data.customizationPricings = data.customizationPricings.filter((p) => !newIds.has(p.customizationOptionId));

  data.customizationOptions.push(...addOptions);
  data.customizationPricings.push(...addPricings);

  data.generatedAt = new Date().toISOString();
  data.checksum = checksumPricingData(data);

  const { errors, warnings } = validatePricingData(data, { requireChecksum: true });

  console.log(`customizationOptions : ${before.options} -> ${data.customizationOptions.length}`);
  console.log(`customizationPricings: ${before.pricings} -> ${data.customizationPricings.length}`);
  console.log(`checksum: ${data.checksum}`);

  const hcWarnings = warnings.filter((w) => w.toLowerCase().includes('hc-') || w.toLowerCase().includes('honeycomb'));
  if (hcWarnings.length) {
    console.log(`\nHoneycomb-related warnings:`);
    hcWarnings.forEach((w) => console.log('  ' + w));
  }
  if (errors.length) {
    console.error(`\nVALIDATION FAILED (${errors.length}):`);
    errors.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }
  console.log('\nValidation passed.');

  if (!APPLY) {
    console.log('\nDRY RUN — pass --apply to write pricing-data.json');
    return;
  }
  writeJson(pricingDataPath, data);
  console.log(`\nWrote ${pricingDataPath}`);
}

main();
