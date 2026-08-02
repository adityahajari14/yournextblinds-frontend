import { createHmac } from 'crypto';
import { fetchShopifyProductByHandleMerged } from '@/lib/shopify';
import { calculateProductPrice, extractFabricCode } from '@/lib/server/pricing.service';
import { searchCatalog, parseQuery } from './search';
import type { ChatToolSchema } from './provider';

// ============================================
// Storefront tools
// ============================================
// Each tool wraps a service the site already ships, called in-process rather
// than over HTTP — no self-fetch round trip, and Shopify/Neon credentials never
// leave the server. Failures are returned as { error } so the model can recover
// conversationally instead of the whole request failing.

const MAX_SEARCH_RESULTS = 5;

// ============================================
// Price tokens
// ============================================
// The model is never trusted as a source of prices. Every price that leaves
// get_price is signed; the route strips any figure in the model's prose that
// doesn't carry a matching token from this same conversation.

const PRICE_SECRET =
  process.env.ADMIN_SESSION_SECRET || process.env.SHOPIFY_WEBHOOK_SECRET || 'dev-only-price-secret';

export function signPrice(handle: string, width: number, height: number, total: number): string {
  return createHmac('sha256', PRICE_SECRET)
    .update(`${handle}:${width}:${height}:${total.toFixed(2)}`)
    .digest('hex')
    .slice(0, 16);
}

/** Prices this conversation is allowed to state, accumulated from get_price results. */
export interface PriceLedger {
  /** Formatted "189.00" strings the model may legitimately repeat. */
  allowed: Set<string>;
}

export function createPriceLedger(): PriceLedger {
  return { allowed: new Set<string>() };
}

// ============================================
// Tool schemas (provider-neutral JSON Schema)
// ============================================

export const TOOL_SCHEMAS: ChatToolSchema[] = [
  {
    name: 'search_products',
    description:
      "Search the Your Next Blinds catalog. Pass the shopper's request in natural language — including the blind type, color, and any feature they mentioned (e.g. \"black vertical blinds\", \"blackout roller for a bedroom\"). Results are ranked by relevance, best match first. Use this whenever the shopper asks what products exist, and before quoting a price so you have the correct handle.",
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'What the shopper is looking for, e.g. "black vertical blind" or "waterproof blackout roller". Include color and blind type when they mentioned them.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_product_details',
    description:
      'Get full detail for one product by its handle (slug): description, available colors, rating, and delivery estimate. Use this to confirm whether a product comes in a particular color before telling the shopper it does. Call search_products first if you do not already know the handle.',
    parameters: {
      type: 'object',
      properties: {
        handle: {
          type: 'string',
          description: 'The product handle/slug, e.g. "unity-black-vertical-blind".',
        },
        color_filter: {
          type: 'string',
          description:
            'Optional color the shopper asked about, e.g. "black". Returns only matching colors plus whether any matched.',
        },
      },
      required: ['handle'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_price',
    description:
      'Calculate the exact made-to-measure price for a product at specific dimensions in inches. ALWAYS call this before stating any price — never estimate, never infer a price from a starting-price figure, and never do arithmetic on prices yourself. If the shopper named a specific color/fabric, pass variant_label so the correct price band is used.',
    parameters: {
      type: 'object',
      properties: {
        handle: {
          type: 'string',
          description: 'The product handle/slug from search_products.',
        },
        width_inches: {
          type: 'number',
          description: 'Finished width in inches.',
        },
        height_inches: {
          type: 'number',
          description: 'Finished height (drop) in inches.',
        },
        variant_label: {
          type: 'string',
          description:
            'Optional color/fabric name or code the shopper mentioned, e.g. "Pearl White" or "R12001". Needed for products whose price varies by color.',
        },
      },
      required: ['handle', 'width_inches', 'height_inches'],
      additionalProperties: false,
    },
  },
];

// ============================================
// Implementations
// ============================================

async function searchProducts(args: Record<string, unknown>, ledger: PriceLedger) {
  const query = String(args.query ?? '').trim();
  if (query.length < 2) {
    return { error: 'Query too short. Ask the shopper what kind of blind they are looking for.' };
  }

  const parsed = parseQuery(query);
  const ranked = await searchCatalog(query, MAX_SEARCH_RESULTS);

  const results = ranked.map(({ product }) => {
    // From-prices are real catalog values, so the model is allowed to repeat
    // them. They still aren't quotes — the prompt requires get_price for that.
    ledger.allowed.add(product.price.toFixed(2));

    // Surface the colors that actually match what the shopper asked for, so the
    // model can say "available in Black" instead of guessing from the title.
    const variantTitles = (product.variants ?? []).map((v) => v.title);
    const matchingColors = parsed.colors.length
      ? variantTitles.filter((t) => parsed.colors.some((c) => t.toLowerCase().includes(c)))
      : [];

    return {
      handle: product.slug,
      name: product.title,
      starting_price: product.price,
      currency: 'USD',
      rating: product.rating ?? null,
      image: product.images[0] ?? null,
      url: `/product/${product.slug}`,
      color_count: variantTitles.length,
      ...(matchingColors.length > 0
        ? { matching_colors: matchingColors.slice(0, 6) }
        : {}),
    };
  });

  if (results.length === 0) {
    return {
      error: `No products matched "${query}". Suggest browsing /collections, or ask the shopper to describe the blind type (roller, zebra, vertical) they want.`,
    };
  }

  return {
    results,
    note: 'Ordered by relevance — the first result is the best match. starting_price is a from-price, NOT a quote; call get_price for a real quote.',
  };
}

async function getProductDetails(args: Record<string, unknown>, ledger: PriceLedger) {
  const handle = String(args.handle ?? '').trim();
  if (!handle) return { error: 'handle is required.' };

  const product = await fetchShopifyProductByHandleMerged(handle);
  if (!product) {
    return { error: `No product found with handle "${handle}". Use search_products to find one.` };
  }

  // Variant titles are the shopper-facing color names.
  const allColors = (product.variants ?? []).map((v) => v.title);
  const filter = args.color_filter ? String(args.color_filter).toLowerCase().trim() : null;

  // Answer "does it come in black?" from data rather than letting the model
  // infer it from the product title.
  const matching = filter
    ? allColors.filter((c) => c.toLowerCase().includes(filter))
    : null;

  // As in search: the from-price is a real catalog value the model may repeat.
  ledger.allowed.add(product.price.toFixed(2));

  return {
    handle: product.slug,
    name: product.title,
    description: product.description?.slice(0, 1200) ?? '',
    starting_price: product.price,
    currency: 'USD',
    rating: product.rating ?? null,
    review_count: product.reviewCount ?? null,
    estimated_delivery: product.estimatedDelivery ?? null,
    // Cap so a 100-color fabric range doesn't flood the context window.
    colors: (matching ?? allColors).slice(0, 40),
    color_count: allColors.length,
    ...(filter
      ? {
          color_filter: filter,
          has_matching_color: (matching?.length ?? 0) > 0,
          matching_color_count: matching?.length ?? 0,
        }
      : {}),
    image: product.images[0] ?? null,
    url: `/product/${product.slug}`,
  };
}

async function getPrice(args: Record<string, unknown>, ledger: PriceLedger) {
  const handle = String(args.handle ?? '').trim();
  const width = Number(args.width_inches);
  const height = Number(args.height_inches);
  const variantLabel = args.variant_label ? String(args.variant_label) : null;

  if (!handle) return { error: 'handle is required.' };
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return { error: 'width_inches and height_inches must be positive numbers.' };
  }
  // Guard against absurd inputs before they reach the pricing matrices.
  if (width > 200 || height > 200) {
    return {
      error:
        'Those dimensions are outside our manufacturing range. Ask the shopper to confirm their measurements in inches.',
    };
  }

  try {
    const pricing = await calculateProductPrice({
      handle,
      widthInches: width,
      heightInches: height,
      // Pass both: variantCode wins when the shopper quoted a fabric code,
      // variantLabel is parsed as a fallback for multi-table products.
      variantCode: extractFabricCode(variantLabel),
      variantLabel,
    });

    const total = pricing.totalPrice;
    ledger.allowed.add(total.toFixed(2));
    if (pricing.dimensionPrice) ledger.allowed.add(pricing.dimensionPrice.toFixed(2));

    return {
      handle,
      width_inches: width,
      height_inches: height,
      total_price: total,
      currency: 'USD',
      oversize_surcharge: pricing.oversizeSurcharge || 0,
      price_token: signPrice(handle, width, height, total),
      url: `/product/${handle}`,
      note: 'This is the exact made-to-measure price before any discount code.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pricing failed';
    // Width-cap and missing-band errors are useful to the shopper verbatim.
    return { error: message };
  }
}

// ============================================
// Dispatch
// ============================================

export type ToolName = 'search_products' | 'get_product_details' | 'get_price';

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ledger: PriceLedger
): Promise<unknown> {
  try {
    switch (name) {
      case 'search_products':
        return await searchProducts(args, ledger);
      case 'get_product_details':
        return await getProductDetails(args, ledger);
      case 'get_price':
        return await getPrice(args, ledger);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    console.warn(`Chat tool "${name}" failed:`, error instanceof Error ? error.message : error);
    return { error: 'That lookup failed. Apologize briefly and suggest the shopper try the site search.' };
  }
}
