// Server-only Judge.me integration.
//
// Reviews are stored in Judge.me (https://judge.me/api/v1). We never persist
// review data ourselves — the PDP fetches published reviews at render time and
// the submit route forwards new reviews (with photo URLs) to Judge.me.
//
// Env:
//   JUDGEME_PRIVATE_TOKEN  – server-side read/write token (Judge.me → Settings → API)
//   JUDGEME_PUBLIC_TOKEN   – widget/read token (optional; used for badge HTML)
//   JUDGEME_SHOP_DOMAIN    – the *.myshopify.com domain (falls back to SHOPIFY_STORE_DOMAIN)

import type { ProductReview } from '@/types';

const API_BASE = 'https://judge.me/api/v1';

function config() {
  const shopDomain =
    process.env.JUDGEME_SHOP_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    '';
  return {
    shopDomain: shopDomain.replace(/^https?:\/\//, ''),
    privateToken: process.env.JUDGEME_PRIVATE_TOKEN || '',
    publicToken: process.env.JUDGEME_PUBLIC_TOKEN || '',
  };
}

export function isJudgemeConfigured(): boolean {
  const { shopDomain, privateToken } = config();
  return Boolean(shopDomain && privateToken);
}

function requireConfig() {
  const cfg = config();
  if (!cfg.shopDomain || !cfg.privateToken) {
    throw new Error('Judge.me is not configured (JUDGEME_SHOP_DOMAIN / JUDGEME_PRIVATE_TOKEN).');
  }
  return cfg;
}

// ---------------------------------------------------------------------------
// Raw Judge.me shapes (only the fields we use)
// ---------------------------------------------------------------------------

interface JudgemePicture {
  urls?: { original?: string; huge?: string; compact?: string; small?: string } | null;
  original_url?: string | null;
}

interface JudgemeReview {
  id: number;
  title: string | null;
  body: string | null;
  rating: number;
  created_at: string;
  hidden?: boolean;
  verified?: string | null;
  reviewer?: { name?: string | null } | null;
  pictures?: JudgemePicture[] | null;
}

interface JudgemeProduct {
  id: number;
  handle: string | null;
  external_id: number | null;
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function judgemeGet<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const { shopDomain, privateToken } = requireConfig();
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('api_token', privateToken);
  url.searchParams.set('shop_domain', shopDomain);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    // Reviews change rarely; let the PDP's ISR window govern freshness.
    next: { revalidate: 900 },
  });
  if (!res.ok) {
    throw new Error(`Judge.me GET ${path} failed [${res.status}]: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Product resolution
// ---------------------------------------------------------------------------

/** Resolve a Shopify product handle to its internal Judge.me product id. */
export async function resolveJudgemeProductId(handle: string): Promise<number | null> {
  try {
    const data = await judgemeGet<{ product?: JudgemeProduct | null }>('/products/-1', { handle });
    return data.product?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Reading reviews
// ---------------------------------------------------------------------------

function mapPicture(picture: JudgemePicture): string | null {
  return (
    picture.urls?.original ||
    picture.urls?.huge ||
    picture.urls?.compact ||
    picture.original_url ||
    null
  );
}

function mapReview(review: JudgemeReview): ProductReview {
  const images = (review.pictures ?? [])
    .map(mapPicture)
    .filter((url): url is string => Boolean(url));

  return {
    id: review.id,
    author: review.reviewer?.name?.trim() || 'Anonymous',
    rating: Math.min(5, Math.max(1, Math.round(review.rating))),
    date: review.created_at ? review.created_at.slice(0, 10) : '',
    title: review.title?.trim() || '',
    content: review.body?.trim() || '',
    verified: Boolean(review.verified),
    images: images.length ? images : undefined,
  };
}

export interface ProductReviewData {
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
}

const EMPTY: ProductReviewData = { reviews: [], averageRating: 0, totalReviews: 0 };

/**
 * Published reviews for a product, newest-first, with aggregate rating/count.
 * Never throws — a Judge.me outage must not break the PDP.
 */
export async function getProductReviews(handle: string): Promise<ProductReviewData> {
  if (!isJudgemeConfigured()) return EMPTY;

  try {
    const productId = await resolveJudgemeProductId(handle);
    if (!productId) return EMPTY;

    const collected: JudgemeReview[] = [];
    for (let page = 1; page <= 5; page += 1) {
      const data = await judgemeGet<{ reviews?: JudgemeReview[] }>('/reviews', {
        product_id: productId,
        per_page: 100,
        page,
        published: 'true',
      });
      const batch = data.reviews ?? [];
      collected.push(...batch);
      if (batch.length < 100) break;
    }

    const visible = collected.filter((r) => !r.hidden && Number.isFinite(r.rating));
    const reviews = visible
      .map(mapReview)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews === 0
        ? 0
        : Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10
          ) / 10;

    return { reviews, averageRating, totalReviews };
  } catch (error) {
    console.error('[judge.me] getProductReviews failed:', error instanceof Error ? error.message : error);
    return EMPTY;
  }
}

// ---------------------------------------------------------------------------
// Creating a review
// ---------------------------------------------------------------------------

export interface CreateReviewInput {
  productHandle: string;
  /** Shopify product numeric id — strongly recommended so Judge.me attaches it. */
  productExternalId?: string | number | null;
  name: string;
  email: string;
  rating: number;
  title: string;
  body: string;
  /** Publicly reachable image URLs (max 5). */
  pictureUrls?: string[];
}

/**
 * Submit a review to Judge.me. Judge.me holds it as unpublished until it is
 * approved in the Judge.me dashboard (unless auto-publish is enabled there).
 */
export async function createReview(input: CreateReviewInput): Promise<void> {
  const { shopDomain, privateToken } = requireConfig();

  const payload: Record<string, unknown> = {
    shop_domain: shopDomain,
    platform: 'shopify',
    api_token: privateToken,
    name: input.name,
    email: input.email,
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    title: input.title || undefined,
    body: input.body,
  };
  if (input.productExternalId) payload.id = String(input.productExternalId);
  if (input.pictureUrls?.length) payload.picture_urls = input.pictureUrls.slice(0, 5);

  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Judge.me create review failed [${res.status}]: ${await res.text()}`);
  }
}
