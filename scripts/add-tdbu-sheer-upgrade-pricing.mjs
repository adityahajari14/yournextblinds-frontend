/**
 * Adds the `tdbu-sheer-upgrade` customization option + flat pricing entry —
 * the "Top Down Bottom Up with Additional Sheer" checkbox on the Top Down
 * Bottom Up Cordless PDP (see HONEYCOMB_CELLULAR_TDBU_SHEER_UPGRADE_OPTION in
 * src/data/honeycombCellular.ts). Mirrors the existing no-drill-upgrade entry.
 *
 *   node scripts/add-tdbu-sheer-upgrade-pricing.mjs
 *
 * Idempotent: skips if the option already exists.
 */
import { checksumPricingData, pricingDataPath, readPricingData, validatePricingData, writeJson } from './pricing-data-utils.mjs';

const OPTION_ID = 'opt-hc-tdbu-sheer-upgrade';
const PRICE_ID = 'price-hc-tdbu-sheer-upgrade';

function main() {
  const data = readPricingData();

  if (data.customizationOptions.some((o) => o.id === OPTION_ID)) {
    console.log('skip (exists) tdbu-sheer-upgrade');
    return;
  }

  data.customizationOptions.push({
    id: OPTION_ID,
    category: 'tdbu-sheer-upgrade',
    optionId: 'hc-tdbu-sheer',
    name: 'Top Down Bottom Up with Additional Sheer',
    description: null,
    sortOrder: 0,
  });

  data.customizationPricings.push({
    id: PRICE_ID,
    customizationOptionId: OPTION_ID,
    widthBandId: null,
    price: 35.99,
    isPerUnit: false,
  });

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
  console.log('added tdbu-sheer-upgrade option + pricing ($35.99 flat)');
}

main();
