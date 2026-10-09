/**
 * Shared Shopify Admin API helpers for the provisioning scripts.
 *
 * Credentials come from .env.local via getEnv() in pricing-data-utils.mjs.
 */
import { getEnv } from './pricing-data-utils.mjs';

const env = getEnv();
const STORE_DOMAIN = env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '');
const TOKEN = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || '2025-01';

if (!STORE_DOMAIN || !TOKEN) {
  throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local');
}

export const storeDomain = STORE_DOMAIN;
const BASE = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** REST call with retry on 429/5xx (Shopify throttles aggressively during bulk writes). */
export async function adminRest(endpoint, options = {}, attempt = 0) {
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
      ...options.headers,
    },
  });

  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    const retryAfter = Number(res.headers.get('Retry-After') || 0) * 1000;
    await sleep(retryAfter || 1000 * 2 ** attempt);
    return adminRest(endpoint, options, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Shopify Admin ${res.status} on ${endpoint}: ${await res.text()}`);
  }
  // 204 on DELETE has no body.
  return res.status === 204 ? null : res.json();
}

export async function adminGraphql(query, variables = {}, attempt = 0) {
  const res = await fetch(`${BASE}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  });

  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await sleep(1000 * 2 ** attempt);
    return adminGraphql(query, variables, attempt + 1);
  }
  if (!res.ok) throw new Error(`Shopify GraphQL ${res.status}: ${await res.text()}`);

  const json = await res.json();
  if (json.errors) throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  const throttled = JSON.stringify(json).includes('THROTTLED');
  if (throttled && attempt < 5) {
    await sleep(2000 * 2 ** attempt);
    return adminGraphql(query, variables, attempt + 1);
  }
  return json.data;
}

export async function findProductByHandle(handle) {
  const data = await adminRest(`/products.json?handle=${encodeURIComponent(handle)}&limit=1`);
  return data.products?.[0] ?? null;
}

let cachedPublications = null;

/** All sales-channel publication ids for the shop. */
export async function getPublications() {
  if (cachedPublications) return cachedPublications;
  const data = await adminGraphql(`query { publications(first: 25) { edges { node { id name } } } }`);
  cachedPublications = data.publications.edges.map((e) => e.node);
  return cachedPublications;
}

/**
 * Publish a product to every sales channel.
 *
 * Products created through the Admin REST API are NOT published anywhere by
 * default — the Storefront API returns null for them and the storefront cannot
 * see the product at all. This step is mandatory, not optional.
 */
export async function publishToAllChannels(productGid) {
  const publications = await getPublications();
  const data = await adminGraphql(
    `mutation Publish($id: ID!, $input: [PublicationInput!]!) {
       publishablePublish(id: $id, input: $input) {
         userErrors { field message }
       }
     }`,
    { id: productGid, input: publications.map((p) => ({ publicationId: p.id })) }
  );
  const errors = data.publishablePublish?.userErrors ?? [];
  if (errors.length) throw new Error(`publishablePublish: ${JSON.stringify(errors)}`);
  return publications.length;
}

export const productGid = (id) => `gid://shopify/Product/${id}`;

/**
 * Ensure a product metafield definition exists and is readable by the Storefront API.
 *
 * Metafields set without a definition are NOT returned by the Storefront API's
 * `metafields(identifiers: …)` — the field comes back null and the value is
 * invisible to the site. The definition must also grant PUBLIC_READ storefront
 * access. Idempotent: returns 'exists' when already defined.
 */
export async function ensureMetafieldDefinition({ namespace, key, name, type, description = '', ownerType = 'PRODUCT' }) {
  const existing = await adminGraphql(
    `query Defs($ownerType: MetafieldOwnerType!, $namespace: String!, $key: String!) {
       metafieldDefinitions(first: 1, ownerType: $ownerType, namespace: $namespace, key: $key) {
         edges { node { id access { storefront } } }
       }
     }`,
    { ownerType, namespace, key }
  );

  const node = existing.metafieldDefinitions.edges[0]?.node;
  if (node) {
    if (node.access?.storefront === 'PUBLIC_READ') return 'exists';
    await adminGraphql(
      `mutation Update($definition: MetafieldDefinitionUpdateInput!) {
         metafieldDefinitionUpdate(definition: $definition) { userErrors { field message } }
       }`,
      { definition: { namespace, key, ownerType, access: { storefront: 'PUBLIC_READ' } } }
    );
    return 'updated';
  }

  const created = await adminGraphql(
    `mutation Create($definition: MetafieldDefinitionInput!) {
       metafieldDefinitionCreate(definition: $definition) {
         createdDefinition { id }
         userErrors { field message code }
       }
     }`,
    {
      definition: {
        namespace, key, name, description, type, ownerType,
        access: { storefront: 'PUBLIC_READ' },
      },
    }
  );

  const errors = created.metafieldDefinitionCreate?.userErrors ?? [];
  if (errors.length) throw new Error(`metafieldDefinitionCreate ${namespace}.${key}: ${JSON.stringify(errors)}`);
  return 'created';
}
