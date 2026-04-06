import { calculateProductPrice, type PricingRequest } from './pricing.service';
import { getAdminApiUrl, getAdminHeaders, validateShopifyConfig } from './shopify-admin';
import { getCachedProduct } from './product-cache';
import { SOURCE_SITE, SOURCE_TAG } from './shopify-order-source';

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
  title: string;
  price: string;
  quantity: number;
  requires_shipping: boolean;
  taxable: boolean;
  properties: { name: string; value: string }[];
}

// ============================================
// Helper Functions
// ============================================

function configToCustomizations(config: CheckoutItemRequest['configuration']): PricingRequest['customizations'] {
  const customizations: { category: string; optionId: string }[] = [];

  const mappings: Record<string, string> = {
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
): { name: string; value: string }[] {
  const properties: { name: string; value: string }[] = [];

  properties.push({ name: 'Width', value: `${item.widthInches} inches` });
  properties.push({ name: 'Height', value: `${item.heightInches} inches` });

  if (item.configuration.roomType) {
    properties.push({ name: 'Room Type', value: item.configuration.roomType });
  }
  if (item.configuration.blindName) {
    properties.push({ name: 'Blind Name', value: item.configuration.blindName });
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
      properties.push({ name: label, value });
    }
  }

  properties.push({ name: '_calculatedPrice', value: calculatedPrice.toFixed(2) });
  properties.push({ name: '_sourceSite', value: SOURCE_SITE });

  return properties;
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
        `Price mismatch for "${productTitle}": submitted £${item.submittedPrice.toFixed(2)}, ` +
        `calculated £${pricing.totalPrice.toFixed(2)} (diff: £${priceDifference.toFixed(2)})`,
        422
      );
    }

    const itemPrice = pricing.totalPrice;
    const lineItemTitle = `${productTitle} – ${item.widthInches}" × ${item.heightInches}"`;

    lineItems.push({
      title: lineItemTitle,
      price: itemPrice.toFixed(2),
      quantity: item.quantity,
      requires_shipping: true,
      taxable: true,
      properties: buildLineItemProperties(item, itemPrice),
    });

    responseLineItems.push({
      handle: item.handle,
      title: lineItemTitle,
      calculatedPrice: itemPrice,
      quantity: item.quantity,
    });

    subtotal += itemPrice * item.quantity;
  }

  const draftOrderPayload: Record<string, unknown> = {
    draft_order: {
      line_items: lineItems,
      use_customer_default_address: true,
      tags: SOURCE_TAG,
      note: [SOURCE_SITE, request.note].filter(Boolean).join(' | '),
      ...(request.customerEmail && { email: request.customerEmail }),
      note_attributes: [
        { name: 'sourceSite', value: SOURCE_SITE },
        { name: 'sourceTag', value: SOURCE_TAG },
      ],
    },
  };

  const url = getAdminApiUrl('/draft_orders.json');
  const response = await fetch(url, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(draftOrderPayload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const status = response.status;
    const errorBody = await response.text();

    if (status === 401) {
      throw new CheckoutError('Shopify authentication failed. Check SHOPIFY_ADMIN_ACCESS_TOKEN.', 500);
    }
    if (status === 422) {
      throw new CheckoutError(`Shopify rejected the draft order: ${errorBody}`, 422);
    }
    if (status === 429) {
      throw new CheckoutError('Shopify rate limit exceeded. Please try again in a moment.', 429);
    }
    throw new CheckoutError(`Failed to create checkout: ${errorBody}`, 500);
  }

  const data = await response.json();
  const draftOrder = data.draft_order;

  if (!draftOrder || !draftOrder.invoice_url) {
    throw new CheckoutError('Failed to create Shopify draft order: no invoice URL returned', 500);
  }

  return {
    checkoutUrl: draftOrder.invoice_url,
    draftOrderId: draftOrder.id.toString(),
    lineItems: responseLineItems,
    subtotal,
  };
}

export async function getDraftOrderStatus(draftOrderId: string): Promise<{
  id: string;
  status: string;
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

  return {
    id: draftOrder.id.toString(),
    status: draftOrder.status,
    invoiceUrl: draftOrder.invoice_url,
    totalPrice: draftOrder.total_price,
    createdAt: draftOrder.created_at,
  };
}
