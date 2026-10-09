import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createReview, isJudgemeConfigured } from '@/lib/server/judgeme.service';
import { uploadReviewImage } from '@/lib/server/shopify-files.service';

// POST /api/reviews  (multipart/form-data)
// Fields: productHandle, productExternalId?, name, email, rating, title?, body,
//         website? (honeypot), images[] (0-5 jpg/png files)
//
// Photos are uploaded to Shopify Files (for a public URL) then the review is
// created in Judge.me. Judge.me holds it unpublished until approved there.

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB (client compresses before upload)
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const recentSubmissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recentSubmissions.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  recentSubmissions.set(ip, hits);
  if (recentSubmissions.size > 5000) {
    for (const [key, times] of recentSubmissions) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentSubmissions.delete(key);
    }
  }
  return hits.length > RATE_LIMIT_MAX;
}

function clean(value: FormDataEntryValue | null, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: { message } }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    if (!isJudgemeConfigured()) {
      return NextResponse.json(
        { success: false, error: { message: 'Reviews are temporarily unavailable.' } },
        { status: 503 }
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return badRequest('Expected multipart/form-data.');
    }

    // Honeypot
    if (clean(form.get('website'), 100) || clean(form.get('company'), 100)) {
      return NextResponse.json({ success: true, data: { pending: true } }, { status: 200 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: { message: 'Too many reviews submitted. Please try again later.' } },
        { status: 429 }
      );
    }

    const productHandle = clean(form.get('productHandle'), 200).toLowerCase();
    const productExternalId = clean(form.get('productExternalId'), 40).replace(/\D/g, '');
    const name = clean(form.get('name'), 60);
    const email = clean(form.get('email'), 160);
    const title = clean(form.get('title'), 120);
    const body = clean(form.get('body'), 2000);
    const rating = Math.round(Number(form.get('rating')));

    if (!productHandle) return badRequest('Missing product.');
    if (name.length < 2) return badRequest('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest('Please enter a valid email address.');
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return badRequest('Please choose a star rating.');
    if (body.length < 10) return badRequest('Please write at least a sentence about the product.');

    const imageFiles = form
      .getAll('images')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (imageFiles.length > MAX_IMAGES) return badRequest(`Please attach at most ${MAX_IMAGES} photos.`);
    for (const file of imageFiles) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) return badRequest('Photos must be JPG or PNG.');
      if (file.size > MAX_IMAGE_BYTES) return badRequest('Each photo must be 4 MB or smaller.');
    }

    // Upload photos to Shopify Files -> public CDN URLs.
    let pictureUrls: string[] = [];
    if (imageFiles.length > 0) {
      try {
        pictureUrls = await Promise.all(
          imageFiles.map(async (file) => {
            const ext = file.type === 'image/png' ? 'png' : 'jpg';
            return uploadReviewImage({
              filename: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
              mimeType: file.type,
              bytes: await file.arrayBuffer(),
            });
          })
        );
      } catch (err) {
        console.error('Review image upload failed:', err instanceof Error ? err.message : err);
        return NextResponse.json(
          { success: false, error: { message: 'Could not process your photos. Try again or submit without them.' } },
          { status: 502 }
        );
      }
    }

    await createReview({
      productHandle,
      productExternalId: productExternalId || null,
      name,
      email,
      rating,
      title,
      body,
      pictureUrls,
    });

    // Judge.me publishes after moderation; still refresh the PDP so an
    // auto-published review shows on the next request.
    revalidatePath(`/product/${productHandle}`);

    return NextResponse.json({ success: true, data: { pending: true } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Review submission error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Could not save your review. Please try again.' } },
      { status: 500 }
    );
  }
}
