import { fetchShopifyProductsPageMerged } from '@/lib/shopify';
import { HIDDEN_TEST_PRODUCT_TAG } from '@/data/dayNightBandH';
import type { ApiProduct } from '@/types';

// ============================================
// Catalog search for the chat assistant
// ============================================
// Shopify's Storefront search ANDs every term, so a natural-language query like
// "vertical blinds in black color" matches nothing — no title contains "in" or
// "color". Shoppers phrase questions that way constantly, so we normalize the
// query, try progressively broader strategies, and rank what comes back.

/** Words that carry no catalog meaning but poison an AND-based search. */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'of', 'for', 'with', 'and', 'or', 'to', 'me',
  'my', 'i', 'we', 'you', 'is', 'are', 'do', 'does', 'can', 'could', 'would',
  'show', 'find', 'get', 'want', 'need', 'looking', 'look', 'have', 'has',
  'any', 'some', 'that', 'this', 'these', 'those', 'it', 'please', 'help',
  'color', 'colour', 'colors', 'colours', 'option', 'options', 'style',
  'styles', 'type', 'types', 'kind', 'sort', 'product', 'products', 'window',
  'windows', 'available', 'sell', 'offer', 'like', 'best', 'good', 'nice',
  'about', 'what', 'which', 'there',
  // Room words carry meaning (see ROOM_FEATURES) but never appear in product
  // titles, so searching them literally returns nothing.
  'bedroom', 'bathroom', 'kitchen', 'nursery', 'office', 'living', 'room',
  'house', 'home', 'apartment',
]);

/** Singularizes catalog nouns so "blinds" matches "Blind". */
function singularize(word: string): string {
  if (word.length > 3 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('es') && !word.endsWith('ses')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/**
 * Product-type terms. These are the highest-signal words in a query — a shopper
 * asking for "vertical" wants vertical blinds, not a roller that happens to
 * mention the word.
 */
const PRODUCT_TYPES: Record<string, string[]> = {
  vertical: ['vertical'],
  roller: ['roller'],
  zebra: ['zebra', 'dual', 'day and night', 'dayandnight', 'daynight'],
  honeycomb: ['honeycomb', 'cellular'],
};

/** Feature terms worth boosting when the shopper names them. */
const FEATURES = ['blackout', 'waterproof', 'thermal', 'sheer', 'light filtering', 'insulating', 'pvc'];

/**
 * Rooms imply features shoppers rarely name directly — "for the bathroom" means
 * waterproof, "for the bedroom" means blackout. Mapping them makes those queries
 * return the right products without the shopper knowing the vocabulary.
 */
const ROOM_FEATURES: Record<string, string[]> = {
  bathroom: ['waterproof', 'pvc'],
  kitchen: ['waterproof', 'pvc'],
  bedroom: ['blackout'],
  nursery: ['blackout'],
  'living room': ['light filtering', 'sheer'],
  office: ['light filtering'],
};

/** Common color words, used for ranking rather than filtering. */
const COLORS = [
  'black', 'white', 'grey', 'gray', 'beige', 'cream', 'brown', 'blue', 'green',
  'red', 'pink', 'purple', 'yellow', 'orange', 'silver', 'gold', 'natural',
  'charcoal', 'navy', 'teal', 'ivory', 'taupe', 'stone', 'sand',
];

export interface ParsedQuery {
  /** Meaningful search terms, stopwords removed and singularized. */
  terms: string[];
  productType: string | null;
  colors: string[];
  /** Features named directly, plus any implied by a room mention. */
  features: string[];
  room: string | null;
}

export function parseQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase();
  const words = lower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));

  let productType: string | null = null;
  for (const [type, aliases] of Object.entries(PRODUCT_TYPES)) {
    if (aliases.some((a) => lower.includes(a))) {
      productType = type;
      break;
    }
  }

  const room = Object.keys(ROOM_FEATURES).find((r) => lower.includes(r)) ?? null;

  // Union of stated features and those the room implies, so "blinds for the
  // bathroom" still ranks waterproof products first.
  const features = [
    ...new Set([
      ...FEATURES.filter((f) => lower.includes(f)),
      ...(room ? ROOM_FEATURES[room] : []),
    ]),
  ];

  return {
    terms: words,
    productType,
    colors: COLORS.filter((c) => words.includes(c)),
    features,
    room,
  };
}

// ============================================
// Ranking
// ============================================

function scoreProduct(product: ApiProduct, parsed: ParsedQuery): number {
  const title = product.title.toLowerCase();
  const haystack = `${title} ${product.tags.map((t) => t.name).join(' ')}`.toLowerCase();
  let score = 0;

  // Product type is the strongest signal: a shopper asking for vertical blinds
  // does not want a roller, however well it matches on color.
  if (parsed.productType) {
    const aliases = PRODUCT_TYPES[parsed.productType];
    if (aliases.some((a) => title.includes(a))) score += 100;
    else if (aliases.some((a) => haystack.includes(a))) score += 40;
    else score -= 60; // actively demote the wrong product type
  }

  // Color can live in the title ("Unity Black Vertical Blind") or only in the
  // variant list ("Celestia Roller Shades" offered in White). Check both, or a
  // product that genuinely comes in the requested color ranks below one that
  // merely names it.
  const variantText = (product.variants ?? []).map((v) => v.title.toLowerCase());
  for (const color of parsed.colors) {
    if (title.includes(color)) score += 30;
    else if (variantText.some((v) => v.includes(color))) score += 22;
    else if (haystack.includes(color)) score += 10;
  }

  for (const feature of parsed.features) {
    if (title.includes(feature)) score += 25;
    else if (haystack.includes(feature)) score += 8;
  }

  // Remaining terms: partial credit so distinctive words (e.g. a fabric name)
  // still pull their product up.
  for (const term of parsed.terms) {
    if (title.includes(term)) score += 12;
    else if (haystack.includes(term)) score += 4;
  }

  // Gentle nudge toward products that are cheaper to start with, so equal
  // matches surface the more accessible option first.
  if (product.price > 0) score += Math.max(0, 5 - product.price / 100);

  return score;
}

function isVisible(product: ApiProduct): boolean {
  return !product.tags.some((t) => t.slug.toLowerCase() === HIDDEN_TEST_PRODUCT_TAG);
}

// ============================================
// Search
// ============================================

const FETCH_PER_STRATEGY = 24;

// ============================================
// Result cache
// ============================================
// Shoppers cluster on the same handful of queries ("blackout roller", "zebra"),
// and each miss costs at least one Shopify round trip. Same approach as
// /api/search/suggestions: a small in-memory TTL map, no external store.

const CACHE_TTL_MS = 120_000;
const CACHE_MAX_ENTRIES = 100;
const resultCache = new Map<string, { results: SearchResult[]; expiresAt: number }>();

function readCache(key: string): SearchResult[] | null {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resultCache.delete(key);
    return null;
  }
  return entry.results;
}

function writeCache(key: string, results: SearchResult[]): void {
  if (resultCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }
  resultCache.set(key, { results, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Builds progressively broader Shopify queries. Because Storefront search ANDs
 * terms, the narrow query is tried first for precision and we fall back toward
 * the single highest-signal term rather than returning nothing.
 */
function buildStrategies(parsed: ParsedQuery, raw: string): string[] {
  const strategies: string[] = [];
  const { terms, productType, colors, features } = parsed;

  if (terms.length > 0) strategies.push(terms.join(' '));

  // Type + the most specific modifier the shopper gave.
  const modifier = features[0] ?? colors[0];
  if (productType && modifier) strategies.push(`${modifier} ${productType}`);
  if (productType) strategies.push(productType);
  if (features[0]) strategies.push(features[0]);
  if (colors[0]) strategies.push(colors[0]);

  // Last resort: the raw query, in case the shopper typed an exact product name.
  const trimmed = raw.trim();
  if (trimmed) strategies.push(trimmed);

  return [...new Set(strategies)].filter(Boolean);
}

export interface SearchResult {
  product: ApiProduct;
  score: number;
}

/**
 * Searches the catalog for a natural-language shopper query. Runs the broadest
 * strategies concurrently, pools the results, then ranks once across everything
 * found so ordering reflects true relevance rather than which query matched.
 */
export async function searchCatalog(raw: string, limit: number): Promise<SearchResult[]> {
  const parsed = parseQuery(raw);
  const strategies = buildStrategies(parsed, raw);
  if (strategies.length === 0) return [];

  // Key on the parsed terms, not the raw text, so "show me black vertical
  // blinds" and "black vertical blind" share one entry.
  const cacheKey = `${parsed.terms.join(' ')}|${limit}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  // Run strategies in order and stop as soon as we have enough to rank well.
  // Firing all of them in parallel triples Shopify Storefront API load per
  // search and trips its rate limiter under real traffic; the narrow query
  // usually succeeds on its own, so the broader fallbacks rarely run.
  const pool = new Map<string, ApiProduct>();

  for (const strategy of strategies.slice(0, 3)) {
    try {
      const products = await fetchShopifyProductsPageMerged(strategy, FETCH_PER_STRATEGY);
      for (const product of products) {
        if (isVisible(product)) pool.set(product.slug, product);
      }
    } catch (error) {
      // A throttled or failed strategy shouldn't sink the whole search — try
      // the next, and rank whatever we managed to collect.
      console.warn(
        `Chat search strategy "${strategy}" failed:`,
        error instanceof Error ? error.message : error
      );
    }

    if (pool.size >= limit * 2) break;
  }

  if (pool.size === 0) return [];

  const ranked = [...pool.values()]
    .map((product) => ({ product, score: scoreProduct(product, parsed) }))
    .sort((a, b) => b.score - a.score);

  // Drop results the ranker actively rejected (wrong product type) unless that
  // would leave the shopper with nothing at all.
  const positive = ranked.filter((r) => r.score > 0);
  const final = (positive.length > 0 ? positive : ranked).slice(0, limit);

  writeCache(cacheKey, final);
  return final;
}
