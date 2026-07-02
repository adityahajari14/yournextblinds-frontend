/**
 * Backfills multi-table product variants (Roller Band F, Dayandnight Band H):
 *   1. Sets each variant's custom.price_band_name metafield to its resolved band
 *      (authoritative signal the runtime uses to pick the price table).
 *   2. Appends the fabric code to the color option value label
 *      (e.g. "Almond Silk" -> "Almond Silk R12001").
 *
 * Resolution: (product family + color name) -> code (scripts/data CSV) -> band
 * (variantCodeBands in pricing-data.json). If a label already contains a code
 * it is trusted as-is.
 *
 * Safe by default: DRY RUN unless --apply is passed. Idempotent: skips variants
 * whose metafield and label are already correct.
 *
 * Usage:
 *   node scripts/backfill-variant-price-bands.mjs            # dry run
 *   node scripts/backfill-variant-price-bands.mjs --apply    # apply changes
 *   node scripts/backfill-variant-price-bands.mjs --tag roller-band-f   # limit tag
 */
import path from 'node:path';
import process from 'node:process';
import { getEnv } from './pricing-data-utils.mjs';
import {
  ROLLER_BAND_F_TAG,
  DAY_NIGHT_BAND_H_TAG,
  familyFromTitle,
  loadColorCodeCsv,
  loadVariantCodeBands,
  resolveVariant,
  extractFabricCode,
  defaultPricingDataPath,
} from './variant-band-mapping.mjs';

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');

// Leftover template/demo products (generic variants, not in the catalog CSV).
const EXCLUDED_HANDLES = new Set(['roller-shades-template']);
const tagArgIndex = process.argv.indexOf('--tag');
const onlyTag = tagArgIndex >= 0 ? process.argv[tagArgIndex + 1] : null;

const env = getEnv();
const storeDomain = env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '');
const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || '2025-01';

if (!storeDomain || !token) {
  console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local');
  process.exit(1);
}

const GRAPHQL_URL = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;
const CSV_PATH = path.join(process.cwd(), 'scripts', 'data', 'product-color-code-mapping.csv');

const csv = loadColorCodeCsv(CSV_PATH);
const codeBands = loadVariantCodeBands(defaultPricingDataPath);

async function gql(query, variables) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify GraphQL HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data;
}

const PRODUCTS_QUERY = `
  query($q: String!, $cursor: String) {
    products(first: 25, query: $q, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges { node {
        id
        handle
        title
        options { id name optionValues { id name } }
        variants(first: 100) {
          edges { node {
            id
            title
            sku
            selectedOptions { name value }
            metafield(namespace: "custom", key: "price_band_name") { value }
          } }
        }
      } }
    }
  }
`;

async function fetchProductsByTag(tag) {
  const products = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const data = await gql(PRODUCTS_QUERY, { q: `tag:'${tag}'`, cursor });
    for (const edge of data.products.edges) products.push(edge.node);
    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }
  return products;
}

const METAFIELDS_SET = `
  mutation($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors { field message }
    }
  }
`;

const OPTION_UPDATE = `
  mutation($productId: ID!, $option: OptionUpdateInput!, $optionValuesToUpdate: [OptionValueUpdateInput!]) {
    productOptionUpdate(productId: $productId, option: $option, optionValuesToUpdate: $optionValuesToUpdate) {
      userErrors { field message }
    }
  }
`;

function colorOptionOf(product) {
  return (
    product.options.find((option) => /colou?r/i.test(option.name)) ?? product.options[0] ?? null
  );
}

async function main() {
  console.log(`Backfill variant price bands — ${APPLY ? 'APPLY (writing changes)' : 'DRY RUN (no changes)'}`);
  const tags = onlyTag ? [onlyTag] : [ROLLER_BAND_F_TAG, DAY_NIGHT_BAND_H_TAG];

  const summary = {
    products: 0,
    variants: 0,
    metafieldPlanned: 0,
    metafieldSkipped: 0,
    labelPlanned: 0,
    labelSkipped: 0,
    unresolved: [],
    applied: { metafields: 0, labels: 0 },
    errors: [],
  };

  for (const tag of tags) {
    const products = await fetchProductsByTag(tag);
    for (const product of products) {
      if (EXCLUDED_HANDLES.has(product.handle)) continue;
      summary.products++;
      const family = familyFromTitle(product.title);
      const colorOption = colorOptionOf(product);
      const metafieldsToSet = [];
      const labelRenames = []; // { optionValueId, from, to }

      for (const edge of product.variants.edges) {
        const variant = edge.node;
        summary.variants++;
        const currentLabel =
          (variant.selectedOptions.find((o) => /colou?r/i.test(o.name)) ?? variant.selectedOptions[0])
            ?.value ?? variant.title;

        const resolved = resolveVariant(
          { family, colorLabel: currentLabel, sku: variant.sku },
          csv,
          codeBands
        );

        if (!resolved.code || !resolved.priceBandName) {
          summary.unresolved.push(`${product.handle} :: "${currentLabel}" (family="${family}") code=${resolved.code ?? '?'}`);
          continue;
        }

        // 1. Metafield
        if (variant.metafield?.value === resolved.priceBandName) {
          summary.metafieldSkipped++;
        } else {
          summary.metafieldPlanned++;
          metafieldsToSet.push({
            ownerId: variant.id,
            namespace: 'custom',
            key: 'price_band_name',
            type: 'single_line_text_field',
            value: resolved.priceBandName,
          });
          console.log(`  [metafield] ${product.handle} "${currentLabel}" -> ${resolved.priceBandName}`);
        }

        // 2. Label — append code if not already present.
        if (extractFabricCode(currentLabel)) {
          summary.labelSkipped++;
        } else if (colorOption) {
          const matchingValue = colorOption.optionValues.find((ov) => ov.name === currentLabel);
          if (matchingValue) {
            const newLabel = `${currentLabel} ${resolved.code}`;
            summary.labelPlanned++;
            labelRenames.push({ optionValueId: matchingValue.id, from: currentLabel, to: newLabel });
            console.log(`  [label]    ${product.handle} "${currentLabel}" -> "${newLabel}"`);
          }
        }
      }

      if (APPLY && metafieldsToSet.length > 0) {
        // metafieldsSet accepts up to 25 per call.
        for (let i = 0; i < metafieldsToSet.length; i += 25) {
          const batch = metafieldsToSet.slice(i, i + 25);
          const data = await gql(METAFIELDS_SET, { metafields: batch });
          const errs = data.metafieldsSet.userErrors;
          if (errs.length) summary.errors.push(`${product.handle} metafields: ${JSON.stringify(errs)}`);
          else summary.applied.metafields += batch.length;
        }
      }

      if (APPLY && labelRenames.length > 0 && colorOption) {
        const data = await gql(OPTION_UPDATE, {
          productId: product.id,
          option: { id: colorOption.id },
          optionValuesToUpdate: labelRenames.map((r) => ({ id: r.optionValueId, name: r.to })),
        });
        const errs = data.productOptionUpdate.userErrors;
        if (errs.length) summary.errors.push(`${product.handle} labels: ${JSON.stringify(errs)}`);
        else summary.applied.labels += labelRenames.length;
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Products: ${summary.products} | Variants: ${summary.variants}`);
  console.log(`Metafield: ${summary.metafieldPlanned} planned, ${summary.metafieldSkipped} already set`);
  console.log(`Label:     ${summary.labelPlanned} planned, ${summary.labelSkipped} already have code`);
  if (APPLY) {
    console.log(`Applied:   ${summary.applied.metafields} metafields, ${summary.applied.labels} labels`);
  }
  if (summary.unresolved.length) {
    console.log(`\nUNRESOLVED variants (no code/band) — ${summary.unresolved.length}:`);
    for (const u of summary.unresolved) console.log(`  - ${u}`);
  }
  if (summary.errors.length) {
    console.log(`\nERRORS — ${summary.errors.length}:`);
    for (const e of summary.errors) console.log(`  - ${e}`);
    process.exitCode = 1;
  }
  if (!APPLY) console.log('\nDry run only. Re-run with --apply to write changes.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
