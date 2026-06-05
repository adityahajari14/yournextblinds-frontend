import {
  getEnv,
  pricingReportPath,
  pricingSummary,
  readPricingData,
  validatePricingData,
  writeJson,
} from './pricing-data-utils.mjs';

const args = new Set(process.argv.slice(2));
const validateShopify = args.has('--shopify');
const data = readPricingData();
const validation = validatePricingData(data, { requireChecksum: true });

if (validateShopify) {
  const env = getEnv();
  const storeDomain = env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '');
  const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const apiVersion = env.SHOPIFY_API_VERSION || '2025-01';

  if (!storeDomain || !token) {
    validation.errors.push('SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN are required for --shopify validation');
  } else {
    const priceBandNames = new Set(data.priceBands.map((band) => band.name));
    const missingPriceBands = [];
    let cursor = null;
    let hasNextPage = true;

    const query = `
      query ProductsWithPriceBands($cursor: String) {
        products(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              handle
              title
              priceBandName: metafield(namespace: "custom", key: "price_band_name") {
                value
              }
            }
          }
        }
      }
    `;

    while (hasNextPage) {
      const response = await fetch(`https://${storeDomain}/admin/api/${apiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({ query, variables: { cursor } }),
      });

      if (!response.ok) {
        validation.errors.push(`Shopify validation failed with HTTP ${response.status}`);
        break;
      }

      const json = await response.json();
      if (json.errors?.length) {
        validation.errors.push(`Shopify validation failed: ${json.errors[0]?.message || 'Unknown GraphQL error'}`);
        break;
      }

      const products = json.data?.products;
      for (const edge of products?.edges ?? []) {
        const product = edge.node;
        const priceBandName = product.priceBandName?.value;
        if (priceBandName && !priceBandNames.has(priceBandName)) {
          missingPriceBands.push({
            handle: product.handle,
            title: product.title,
            priceBandName,
          });
        }
      }

      hasNextPage = Boolean(products?.pageInfo?.hasNextPage);
      cursor = products?.pageInfo?.endCursor ?? null;
    }

    if (missingPriceBands.length > 0) {
      validation.errors.push(
        `Shopify products reference missing price bands: ${missingPriceBands
          .map((item) => `${item.handle} -> ${item.priceBandName}`)
          .join(', ')}`
      );
    }
  }
}

writeJson(pricingReportPath, {
  ...pricingSummary(data),
  validation,
  shopifyValidated: validateShopify,
});

for (const warning of validation.warnings) {
  console.warn(`Warning: ${warning}`);
}

if (validation.errors.length > 0) {
  console.error('Pricing data validation failed:');
  for (const error of validation.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Pricing data validation passed.');
console.log(JSON.stringify(pricingSummary(data), null, 2));
