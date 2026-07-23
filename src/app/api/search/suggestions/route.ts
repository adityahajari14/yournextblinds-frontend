import { fetchShopifyProductsPageMerged } from '@/lib/shopify';
import { HIDDEN_TEST_PRODUCT_TAG } from '@/data/dayNightBandH';

const MAX_RESULTS = 6;
// Over-fetch a bit since hidden test products get filtered out afterward.
const FETCH_COUNT = 12;

export interface SearchSuggestion {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  currency: string;
  rating: number;
}

// ============================================
// Response cache (per query, in-memory)
// ============================================
// Absorbs repeated/duplicate lookups for the same query — both from a
// single user re-focusing the popup and from multiple users searching the
// same popular term — without needing an external cache store.

interface CacheEntry {
  suggestions: SearchSuggestion[];
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 200;
const responseCache = new Map<string, CacheEntry>();

function getCached(key: string): SearchSuggestion[] | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.suggestions;
}

function setCached(key: string, suggestions: SearchSuggestion[]): void {
  // Evict the oldest entry once we hit the cap — a plain insertion-order
  // Map is good enough for a soft memory bound, no LRU bookkeeping needed.
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { suggestions, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ============================================
// Rate limiting (per IP, in-memory)
// ============================================
// A fixed-window limiter. Not shared across serverless instances, so it's a
// soft cap rather than a hard guarantee — but it's enough to blunt a runaway
// client (broken debounce, script hitting the endpoint directly) without
// needing external infrastructure for what is a non-critical, best-effort
// preview feature.

const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_REQUESTS = 20; // ~2/sec sustained, generous for real typing
const requestLog = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestLog.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestLog.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// Periodically drop stale rate-limit entries so the map doesn't grow
// unbounded over the life of the server process.
function pruneRequestLog(): void {
  const now = Date.now();
  for (const [ip, entry] of requestLog) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) requestLog.delete(ip);
  }
}

function resolveClientIp(request: Request): string {
  const h = request.headers;
  return (
    h.get('x-vercel-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('cf-connecting-ip') ||
    'unknown'
  );
}

// Lightweight live-search endpoint for the header search popup — returns a
// small, trimmed result set for a single query in one Shopify request,
// unlike /search which paginates through the full matching catalog.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';

  if (query.length < 2) {
    return Response.json({ success: true, data: [] });
  }

  const ip = resolveClientIp(request);
  if (isRateLimited(ip)) {
    return Response.json(
      { success: false, data: [], error: 'Too many requests' },
      { status: 429 }
    );
  }
  if (Math.random() < 0.05) pruneRequestLog();

  const cacheKey = query.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) {
    return Response.json({ success: true, data: cached });
  }

  try {
    const products = await fetchShopifyProductsPageMerged(query, FETCH_COUNT);

    const suggestions: SearchSuggestion[] = products
      .filter((product) => !product.tags.some((tag) => tag.slug.toLowerCase() === HIDDEN_TEST_PRODUCT_TAG))
      .slice(0, MAX_RESULTS)
      .map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.title,
        image: product.images[0] ?? null,
        price: product.price,
        currency: 'USD',
        rating: product.rating ?? 0,
      }));

    setCached(cacheKey, suggestions);
    return Response.json({ success: true, data: suggestions });
  } catch (error) {
    console.warn('Search suggestions unavailable:', error instanceof Error ? error.message : error);
    return Response.json({ success: true, data: [] });
  }
}
