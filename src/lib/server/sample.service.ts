import { getAdminApiUrl, getAdminHeaders, validateShopifyConfig } from './shopify-admin';
import { getCachedProduct } from './product-cache';

// ============================================
// Free Sample order service
// ============================================
//
// Deliberately separate from `order.service.ts`: samples carry no size, add-ons,
// or price, so they must NOT go through the priced-checkout path (which requires
// width/height and validates against the pricing engine). Samples are recorded as
// a $0 Shopify draft order tagged `free-sample`, which keeps them out of revenue
// reporting while still giving the team a fulfillable record in Shopify admin.

const MAX_FREE_SAMPLES = 10;
const FREE_SAMPLE_TAG = 'free-sample';
const DRAFT_ORDER_CURRENCY = 'USD';
const ZERO_PRICE = '0.00';

export class SampleRequestError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'SampleRequestError';
    this.statusCode = statusCode;
  }
}

export interface SampleSwatchRequest {
  productHandle: string;
  variantId: string;
  colorName: string;
}

export interface CreateSampleRequest {
  email?: string;
  swatches: SampleSwatchRequest[];
}

export interface CreateSampleResponse {
  checkoutUrl: string;
  draftOrderId: string;
  sampleCount: number;
}

function normalizeVariantGid(variantId: string): string | null {
  if (!variantId) return null;
  if (variantId.startsWith('gid://shopify/ProductVariant/')) return variantId;

  const numericId = Number(variantId);
  if (!Number.isFinite(numericId) || numericId <= 0) return null;
  return `gid://shopify/ProductVariant/${numericId}`;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validate the request against the cached catalogue: the request cannot be empty
 * or exceed the cap, each product must actually be sample-eligible (carry the
 * `free-sample` tag), and each variant must exist on that product. Never trusts
 * the client — a caller could otherwise slip a priced variant into a $0 order.
 */
async function validateAndResolveSwatches(
  swatches: SampleSwatchRequest[]
): Promise<{ variantGid: string; colorName: string; productTitle: string }[]> {
  if (!Array.isArray(swatches) || swatches.length === 0) {
    throw new SampleRequestError('At least one sample is required', 400);
  }
  if (swatches.length > MAX_FREE_SAMPLES) {
    throw new SampleRequestError(`You can request at most ${MAX_FREE_SAMPLES} free samples`, 400);
  }

  const resolved: { variantGid: string; colorName: string; productTitle: string }[] = [];
  const seenVariants = new Set<string>();

  for (const swatch of swatches) {
    if (!swatch?.productHandle || !swatch?.variantId) {
      throw new SampleRequestError('Each sample must have a productHandle and variantId', 400);
    }

    const variantGid = normalizeVariantGid(swatch.variantId);
    if (!variantGid) {
      throw new SampleRequestError(`Invalid variant id: ${swatch.variantId}`, 400);
    }
    if (seenVariants.has(variantGid)) {
      continue; // silently dedupe
    }

    const product = await getCachedProduct(swatch.productHandle);
    if (!product) {
      throw new SampleRequestError(`Product not found: ${swatch.productHandle}`, 404);
    }

    const eligible = product.tags.some((tag) => tag.toLowerCase() === FREE_SAMPLE_TAG);
    if (!eligible) {
      throw new SampleRequestError(
        `Product "${swatch.productHandle}" does not offer free samples`,
        422
      );
    }

    const variant = product.variants.find((v) => v.id === variantGid);
    if (!variant) {
      throw new SampleRequestError(
        `Variant ${swatch.variantId} not found on product ${swatch.productHandle}`,
        404
      );
    }

    seenVariants.add(variantGid);
    resolved.push({
      variantGid,
      colorName: variant.colorLabel || swatch.colorName || variant.title,
      productTitle: product.title,
    });
  }

  if (resolved.length === 0) {
    throw new SampleRequestError('No valid samples in request', 400);
  }

  return resolved;
}

export async function createSampleOrder(request: CreateSampleRequest): Promise<CreateSampleResponse> {
  validateShopifyConfig();

  // Email is optional — the customer supplies it on the Shopify checkout page, same
  // as a normal order. If we already know it (signed-in customer), attach it so the
  // draft order links to their account.
  const email = (request.email || '').trim().toLowerCase();
  if (email && !isEmail(email)) {
    throw new SampleRequestError('Invalid email address', 400);
  }

  const resolved = await validateAndResolveSwatches(request.swatches);

  const lineItems = resolved.map((swatch) => ({
    variantId: swatch.variantGid,
    quantity: 1,
    priceOverride: {
      amount: ZERO_PRICE,
      currencyCode: DRAFT_ORDER_CURRENCY,
    },
    customAttributes: [
      { key: 'Free Sample', value: 'Yes' },
      { key: 'Colour', value: swatch.colorName },
      { key: 'Product', value: swatch.productTitle },
    ],
  }));

  const mutation = `
    mutation DraftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          invoiceUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await fetch(getAdminApiUrl('/graphql.json'), {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          ...(email && { email }),
          lineItems,
          useCustomerDefaultAddress: true,
          tags: [FREE_SAMPLE_TAG],
          note: 'Free fabric sample request (no charge).',
          presentmentCurrencyCode: DRAFT_ORDER_CURRENCY,
          // Samples are $0 line items, but Shopify still computes shipping from the
          // store's normal rates unless we explicitly zero it out here.
          shippingLine: {
            title: 'Free Shipping',
            priceWithCurrency: {
              amount: ZERO_PRICE,
              currencyCode: DRAFT_ORDER_CURRENCY,
            },
          },
        },
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) {
      throw new SampleRequestError('Shopify authentication failed.', 500);
    }
    if (response.status === 429) {
      throw new SampleRequestError('Too many requests. Please try again in a moment.', 429);
    }
    throw new SampleRequestError(`Failed to submit sample request: ${body}`, 500);
  }

  const data = (await response.json()) as {
    data?: {
      draftOrderCreate?: {
        draftOrder?: { id: string; invoiceUrl: string | null } | null;
        userErrors?: Array<{ field?: string[] | null; message: string }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    throw new SampleRequestError(
      `Failed to submit sample request: ${data.errors[0]?.message || 'Unknown GraphQL error'}`,
      500
    );
  }

  const draftOrderCreate = data.data?.draftOrderCreate;
  const userErrors = draftOrderCreate?.userErrors || [];
  if (userErrors.length > 0) {
    throw new SampleRequestError(
      `Shopify rejected the sample request: ${userErrors.map((e) => e.message).join('; ')}`,
      422
    );
  }

  const draftOrder = draftOrderCreate?.draftOrder;
  if (!draftOrder?.invoiceUrl) {
    throw new SampleRequestError('Failed to create sample request: no checkout URL returned', 500);
  }

  return {
    checkoutUrl: draftOrder.invoiceUrl,
    draftOrderId: draftOrder.id.toString(),
    sampleCount: resolved.length,
  };
}
