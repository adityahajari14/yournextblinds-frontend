import { calculateProductPrice, type PricingRequest } from './pricing.service';
import { getAdminApiUrl, getAdminHeaders, validateShopifyConfig } from './shopify-admin';
import { getCachedProduct } from './product-cache';

// ============================================
// Types
// ============================================

export interface CheckoutItemRequest {
  handle: string;
  widthInches: number;
  heightInches: number;
  quantity: number;
  submittedPrice: number;
  configuration: {
    roomType?: string;
    blindName?: string;
    headrail?: string;
    headrailColour?: string;
    installationMethod?: string;
    controlOption?: string;
    stacking?: string;
    controlSide?: string;
    bottomChain?: string;
    bracketType?: string;
    chainColor?: string;
    wrappedCassette?: string;
    cassetteMatchingBar?: string;
    motorization?: string;
    blindColor?: string;
    frameColor?: string;
    openingDirection?: string;
    bottomBar?: string;
    rollStyle?: string;
    [key: string]: string | undefined;
  };
}

export interface CreateCheckoutRequest {
  items: CheckoutItemRequest[];
  customerEmail?: string;
  note?: string;
}

export interface CreateCheckoutResponse {
  checkoutUrl: string;
  draftOrderId: string;
  lineItems: {
    handle: string;
    title: string;
    calculatedPrice: number;
    quantity: number;
  }[];
  subtotal: number;
}

interface ShopifyDraftOrderLineItem {
  quantity: number;
  customAttributes: { key: string; value: string }[];
  variantId?: string;
  priceOverride?: { amount: string; currencyCode: string };
  title?: string;
  originalUnitPriceWithCurrency?: { amount: string; currencyCode: string };
}

const variantIdByHandleCache = new Map<string, number | null>();
const DRAFT_ORDER_CURRENCY = 'USD';

// ============================================
// Helper Functions
// ============================================

function configToCustomizations(config: CheckoutItemRequest['configuration']): PricingRequest['customizations'] {
  const customizations: { category: string; optionId: string }[] = [];

  const mappings: Record<string, string> = {
    roomType: 'room-type',
    headrail: 'headrail',
    headrailColour: 'headrail-colour',
    installationMethod: 'installation-method',
    controlOption: 'control-option',
    stacking: 'stacking',
    controlSide: 'control-side',
    bottomChain: 'bottom-chain',
    bracketType: 'bracket-type',
    chainColor: 'chain-color',
    wrappedCassette: 'wrapped-cassette',
    cassetteMatchingBar: 'cassette-bar',
    motorization: 'motorization',
    blindColor: 'blind-color',
    frameColor: 'frame-color',
    openingDirection: 'opening-direction',
    bottomBar: 'bottom-bar',
    rollStyle: 'roll-style',
  };

  for (const [configKey, category] of Object.entries(mappings)) {
    const value = config[configKey];
    if (value && value !== 'none') {
      customizations.push({ category, optionId: value });
    }
  }

  return customizations;
}

function buildLineItemProperties(
  item: CheckoutItemRequest,
  calculatedPrice: number
): { key: string; value: string }[] {
  const properties: { key: string; value: string }[] = [];

  properties.push({ key: 'Width', value: `${item.widthInches} inches` });
  properties.push({ key: 'Height', value: `${item.heightInches} inches` });

  if (item.configuration.roomType) {
    properties.push({ key: 'Room Type', value: item.configuration.roomType });
  }
  if (item.configuration.blindName) {
    properties.push({ key: 'Blind Name', value: item.configuration.blindName });
  }

  const labelMap: Record<string, string> = {
    headrail: 'Headrail',
    headrailColour: 'Headrail Colour',
    installationMethod: 'Installation',
    controlOption: 'Control Option',
    stacking: 'Stacking',
    controlSide: 'Control Side',
    bottomChain: 'Bottom Chain',
    bracketType: 'Bracket Type',
    chainColor: 'Chain Color',
    wrappedCassette: 'Wrapped Cassette',
    cassetteMatchingBar: 'Cassette Bar',
    motorization: 'Motorization',
    blindColor: 'Blind Color',
    frameColor: 'Frame Color',
    openingDirection: 'Opening Direction',
    bottomBar: 'Bottom Bar',
    rollStyle: 'Roll Style',
  };

  for (const [key, label] of Object.entries(labelMap)) {
    const value = item.configuration[key];
    if (value && value !== 'none') {
      properties.push({ key: label, value });
    }
  }

  properties.push({ key: '_calculatedPrice', value: calculatedPrice.toFixed(2) });

  return properties;
}

async function getPrimaryVariantIdByHandle(handle: string): Promise<number | null> {
  const cached = variantIdByHandleCache.get(handle);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const url = getAdminApiUrl(`/products.json?handle=${encodeURIComponent(handle)}&fields=variants`);
    const response = await fetch(url, {
      headers: getAdminHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      variantIdByHandleCache.set(handle, null);
      return null;
    }

    const data = (await response.json()) as {
      products?: Array<{ variants?: Array<{ id?: number | string }> }>;
    };
    const rawId = data.products?.[0]?.variants?.[0]?.id;
    const parsed =
      typeof rawId === 'number'
        ? rawId
        : typeof rawId === 'string'
          ? Number(rawId)
          : NaN;

    const variantId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    variantIdByHandleCache.set(handle, variantId);
    return variantId;
  } catch (error) {
    console.error(`[OrderService] Failed variant lookup for handle "${handle}":`, error);
    variantIdByHandleCache.set(handle, null);
    return null;
  }
}

const PRICE_TOLERANCE = 0.50;

// ============================================
// Service Functions
// ============================================

export class CheckoutError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'CheckoutError';
    this.statusCode = statusCode;
  }
}

export async function createCheckout(request: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
  validateShopifyConfig();

  if (!request.items || request.items.length === 0) {
    throw new CheckoutError('Cart is empty', 400);
  }

  const lineItems: ShopifyDraftOrderLineItem[] = [];
  const responseLineItems: CreateCheckoutResponse['lineItems'] = [];
  let subtotal = 0;

  for (const item of request.items) {
    if (!item.handle) {
      throw new CheckoutError('Each item must have a handle', 400);
    }
    if (typeof item.widthInches !== 'number' || item.widthInches <= 0) {
      throw new CheckoutError('Each item must have a positive widthInches', 400);
    }
    if (typeof item.heightInches !== 'number' || item.heightInches <= 0) {
      throw new CheckoutError('Each item must have a positive heightInches', 400);
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      throw new CheckoutError('Each item must have a quantity >= 1', 400);
    }

    const cachedProduct = await getCachedProduct(item.handle);
    if (!cachedProduct) {
      throw new CheckoutError(`Product not found: ${item.handle}`, 404);
    }

    const productTitle = item.configuration.blindName?.trim() || cachedProduct.title;
    const customizations = configToCustomizations(item.configuration);

    const pricing = await calculateProductPrice({
      handle: item.handle,
      widthInches: item.widthInches,
      heightInches: item.heightInches,
      customizations,
    });

    const priceDifference = Math.abs(pricing.totalPrice - item.submittedPrice);
    if (priceDifference > PRICE_TOLERANCE) {
      throw new CheckoutError(
        `Price mismatch for "${productTitle}": submitted $${item.submittedPrice.toFixed(2)}, ` +
        `calculated $${pricing.totalPrice.toFixed(2)} (diff: $${priceDifference.toFixed(2)})`,
        422
      );
    }

    const itemPrice = pricing.totalPrice;
    const lineItemTitle = `${productTitle} – ${item.widthInches}" × ${item.heightInches}"`;

    const variantId = await getPrimaryVariantIdByHandle(item.handle);
    const customAttributes = buildLineItemProperties(item, itemPrice);

    if (variantId) {
      lineItems.push({
        variantId: `gid://shopify/ProductVariant/${variantId}`,
        priceOverride: {
          amount: itemPrice.toFixed(2),
          currencyCode: DRAFT_ORDER_CURRENCY,
        },
        quantity: item.quantity,
        customAttributes,
      });
    } else {
      lineItems.push({
        title: lineItemTitle,
        quantity: item.quantity,
        originalUnitPriceWithCurrency: {
          amount: itemPrice.toFixed(2),
          currencyCode: DRAFT_ORDER_CURRENCY,
        },
        customAttributes,
      });
    }

    responseLineItems.push({
      handle: item.handle,
      title: lineItemTitle,
      calculatedPrice: itemPrice,
      quantity: item.quantity,
    });

    subtotal += itemPrice * item.quantity;
  }

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
          lineItems,
          useCustomerDefaultAddress: true,
          note: request.note || '',
          ...(request.customerEmail && { email: request.customerEmail }),
          presentmentCurrencyCode: DRAFT_ORDER_CURRENCY,
        },
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 401) {
      throw new CheckoutError('Shopify authentication failed. Check SHOPIFY_ADMIN_ACCESS_TOKEN.', 500);
    }
    if (response.status === 429) {
      throw new CheckoutError('Shopify rate limit exceeded. Please try again in a moment.', 429);
    }
    throw new CheckoutError(`Failed to create checkout: ${errorBody}`, 500);
  }

  const data = await response.json() as {
    data?: {
      draftOrderCreate?: {
        draftOrder?: { id: string; invoiceUrl: string | null } | null;
        userErrors?: Array<{ field?: string[] | null; message: string }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    throw new CheckoutError(`Failed to create checkout: ${data.errors[0]?.message || 'Unknown GraphQL error'}`, 500);
  }

  const draftOrderCreate = data.data?.draftOrderCreate;
  const userErrors = draftOrderCreate?.userErrors || [];
  if (userErrors.length > 0) {
    const message = userErrors.map((error) => error.message).join('; ');
    throw new CheckoutError(`Shopify rejected the draft order: ${message}`, 422);
  }

  const draftOrder = draftOrderCreate?.draftOrder;
  if (!draftOrder || !draftOrder.invoiceUrl) {
    throw new CheckoutError('Failed to create Shopify draft order: no invoice URL returned', 500);
  }

  return {
    checkoutUrl: draftOrder.invoiceUrl,
    draftOrderId: draftOrder.id.toString(),
    lineItems: responseLineItems,
    subtotal,
  };
}

export async function getDraftOrderStatus(draftOrderId: string): Promise<{
  id: string;
  status: string;
  orderId: string | null;
  orderName: string | null;
  invoiceUrl: string;
  totalPrice: string;
  createdAt: string;
}> {
  validateShopifyConfig();

  const url = getAdminApiUrl(`/draft_orders/${draftOrderId}.json`);
  const response = await fetch(url, {
    headers: getAdminHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new CheckoutError('Draft order not found', 404);
    }
    throw new CheckoutError(`Failed to get draft order status: ${response.statusText}`, 500);
  }

  const data = await response.json();
  const draftOrder = data.draft_order;
  const orderId =
    typeof draftOrder.order_id === 'string' || typeof draftOrder.order_id === 'number'
      ? String(draftOrder.order_id)
      : typeof draftOrder.order_id?.id === 'string' || typeof draftOrder.order_id?.id === 'number'
        ? String(draftOrder.order_id.id)
        : null;

  return {
    id: draftOrder.id.toString(),
    status: draftOrder.status,
    orderId,
    orderName: draftOrder.name || null,
    invoiceUrl: draftOrder.invoice_url,
    totalPrice: draftOrder.total_price,
    createdAt: draftOrder.created_at,
  };
}
