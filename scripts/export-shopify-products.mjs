import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

const OUTPUT_FILE = path.join(process.cwd(), 'exports', 'shopify-products.csv');
const SHOPIFY_API_VERSION = '2025-01';

const STOREFRONT_PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          handle
          title
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
          collections(first: 25) {
            edges {
              node {
                title
              }
            }
          }
        }
      }
    }
  }
`;

const ADMIN_PRODUCTS_QUERY = `
  query ProductsWithPriceBands($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          handle
          tags
          priceBandName: metafield(namespace: "custom", key: "price_band_name") {
            value
          }
        }
      }
    }
  }
`;

const REPLACEMENT_VERTICAL_SLAT_PRICE_BAND_BY_TAG = {
  vertical_49_slat: 'Replacement Vertical Blinds Slat - Band A',
  vertical_40_slat: 'Replacement Vertical Blinds Slat - Band B',
  vertical_35_slat: 'Replacement Vertical Blinds Slat - Band C',
  vertical_31_slat: 'Replacement Vertical Blinds Slat - Band D',
  vertical_34_slat: 'Replacement Vertical Blinds Slat - Band D',
  vertical_25_slat: 'Replacement Vertical Blinds Slat - Band E',
  vertical_18_slat: 'Replacement Vertical Blinds Slat - Band F',
  vertical_22_slat: 'Replacement Vertical Blinds Slat - Band F',
  vertical_16_slat: 'Replacement Vertical Blinds Slat - Band Premium',
};

const REGULAR_VERTICAL_PRICE_BAND_BY_TAG = {
  '50_vertical': 'Vertical Blind - Band A',
  '47_vertical': 'Vertical Blind - Band B',
  '45_vertical': 'Vertical Blind - Band C',
  '40_vertical': 'Vertical Blind - Band D',
  '39_vertical': 'Vertical Blind - Band E',
  vertical_18: 'Vertical Blind - Band F',
  vertical_22: 'Vertical Blind - Band F',
  vertical_16: 'Vertical Blind - Band Premium',
};

const ELECTRICAL_ROLLER_COLLECTION_TAG = 'roller-blinds-electrical';
const ELECTRICAL_ROLLER_BAND_TAG = /^roller[-_]\d+(?:1)?[-_]e$/;
const ELECTRICAL_DAY_NIGHT_COLLECTION_TAG = 'day-and-night-blinds-electrical';
const ELECTRICAL_DAY_NIGHT_BAND_TAG = /^day_band_ele_[a-z]+$/;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadEnv() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));
  loadEnvFile(path.join(process.cwd(), '.env'));
}

function requiredEnv(name, fallbackName) {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) {
    const names = fallbackName ? `${name} or ${fallbackName}` : name;
    throw new Error(`Missing required environment variable: ${names}`);
  }
  return value;
}

function normalizeDomain(domain) {
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function normalizeTags(tags) {
  return tags.map((tag) => tag.trim().toLowerCase().replace(/-/g, '_')).filter(Boolean);
}

function inferVerticalPriceBandNameFromTags(tags) {
  for (const tag of normalizeTags(tags)) {
    if (REPLACEMENT_VERTICAL_SLAT_PRICE_BAND_BY_TAG[tag]) {
      return REPLACEMENT_VERTICAL_SLAT_PRICE_BAND_BY_TAG[tag];
    }
    if (REGULAR_VERTICAL_PRICE_BAND_BY_TAG[tag]) {
      return REGULAR_VERTICAL_PRICE_BAND_BY_TAG[tag];
    }
  }

  return null;
}

function isElectricalRollerTag(tag) {
  const normalized = tag.toLowerCase().trim();
  return normalized === ELECTRICAL_ROLLER_COLLECTION_TAG || ELECTRICAL_ROLLER_BAND_TAG.test(normalized);
}

function isElectricalDayNightTag(tag) {
  const normalized = tag.toLowerCase().trim();
  return normalized === ELECTRICAL_DAY_NIGHT_COLLECTION_TAG || ELECTRICAL_DAY_NIGHT_BAND_TAG.test(normalized);
}

function isSpecialMotorizedProduct(tags) {
  return tags.some(isElectricalRollerTag) || tags.some(isElectricalDayNightTag);
}

function getMinimumPriceWithMotorizedUplift(basePrice, tags) {
  return isSpecialMotorizedProduct(tags) ? basePrice + 100 : basePrice;
}

async function shopifyGraphql(url, headers, query, variables) {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify GraphQL request failed [${response.status}]: ${errorText}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL error: ${json.errors[0].message}`);
  }

  return json.data;
}

async function fetchStorefrontProducts(storeDomain, storefrontToken) {
  const url = `https://${storeDomain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const products = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyGraphql(
      url,
      {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      STOREFRONT_PRODUCTS_QUERY,
      { first: 250, after: cursor }
    );

    products.push(...data.products.edges.map((edge) => edge.node));
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return products;
}

async function fetchAdminProductPricingData(storeDomain, adminToken) {
  const url = `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const productsByHandle = new Map();
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyGraphql(
      url,
      {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      ADMIN_PRODUCTS_QUERY,
      { first: 250, after: cursor }
    );

    for (const edge of data.products.edges) {
      productsByHandle.set(edge.node.handle, {
        tags: edge.node.tags || [],
        priceBandName: edge.node.priceBandName?.value || null,
      });
    }

    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return productsByHandle;
}

async function getMinimumPricesByBandName(bandNames) {
  if (bandNames.length === 0) return new Map();

  const connectionString = requiredEnv('DATABASE_URL');
  const isCloudDb =
    connectionString.includes('render.com') ||
    connectionString.includes('onrender.com') ||
    connectionString.includes('neon.tech') ||
    process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString,
    ssl: isCloudDb ? { rejectUnauthorized: false } : false,
  });

  try {
    const query = `
      SELECT DISTINCT ON (pb.name)
        pb.name,
        pc.price
      FROM "PriceBand" pb
      JOIN "PriceCell" pc ON pc."priceBandId" = pb.id
      JOIN "WidthBand" wb ON wb.id = pc."widthBandId"
      JOIN "HeightBand" hb ON hb.id = pc."heightBandId"
      WHERE pb.name = ANY($1)
      ORDER BY
        pb.name,
        wb."widthMm" * hb."heightMm" ASC,
        wb."widthMm" ASC,
        hb."heightMm" ASC
    `;

    const result = await pool.query(query, [bandNames]);
    return new Map(result.rows.map((row) => [row.name, Number(row.price)]));
  } finally {
    await pool.end();
  }
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(price)) return '';
  return Number(price).toFixed(2);
}

async function main() {
  loadEnv();

  const storefrontDomain = normalizeDomain(
    requiredEnv('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN', 'SHOPIFY_STORE_DOMAIN')
  );
  const adminDomain = normalizeDomain(requiredEnv('SHOPIFY_STORE_DOMAIN', 'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN'));
  const storefrontToken = requiredEnv(
    'NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN',
    'SHOPIFY_STOREFRONT_ACCESS_TOKEN'
  );
  const adminToken = requiredEnv('SHOPIFY_ADMIN_ACCESS_TOKEN');

  console.log('Fetching live storefront products...');
  const storefrontProducts = await fetchStorefrontProducts(storefrontDomain, storefrontToken);

  console.log('Fetching product price-band metadata...');
  const adminProductsByHandle = await fetchAdminProductPricingData(adminDomain, adminToken);

  const productPriceBandNames = new Map();
  for (const product of storefrontProducts) {
    const pricingData = adminProductsByHandle.get(product.handle);
    const priceBandName =
      pricingData?.priceBandName || inferVerticalPriceBandNameFromTags(pricingData?.tags || []);
    if (priceBandName) {
      productPriceBandNames.set(product.handle, priceBandName);
    }
  }

  console.log('Reading base prices from local price bands...');
  const minimumPricesByBandName = await getMinimumPricesByBandName([...new Set(productPriceBandNames.values())]);

  const rows = storefrontProducts.map((product) => {
    const pricingData = adminProductsByHandle.get(product.handle);
    const priceBandName = productPriceBandNames.get(product.handle);
    const rawBasePrice = priceBandName ? minimumPricesByBandName.get(priceBandName) : undefined;
    const basePrice =
      rawBasePrice === undefined
        ? ''
        : formatPrice(getMinimumPriceWithMotorizedUplift(rawBasePrice, pricingData?.tags || []));

    const mainImage = product.images.edges[0]?.node.url || '';
    const collections = product.collections.edges.map((edge) => edge.node.title).join('; ');

    return {
      product_name: product.title,
      handle: product.handle,
      product_url: `https://${storefrontDomain}/products/${product.handle}`,
      base_price: basePrice,
      main_image: mainImage,
      collection: collections,
    };
  });

  const headers = ['product_name', 'handle', 'product_url', 'base_price', 'main_image', 'collection'];
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${csv}\n`, 'utf8');

  const missingPriceCount = rows.filter((row) => !row.base_price).length;
  console.log(`Exported ${rows.length} products to ${OUTPUT_FILE}`);
  if (missingPriceCount > 0) {
    console.warn(`${missingPriceCount} products did not have a matching app base price.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
