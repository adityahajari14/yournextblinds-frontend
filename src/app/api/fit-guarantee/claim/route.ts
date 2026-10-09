import { NextResponse } from 'next/server';
import {
  submitFitGuaranteeClaim,
  FitGuaranteeClaimError,
} from '@/lib/server/fit-guarantee-claim.service';
import { isEmailConfigured } from '@/lib/server/email';

// POST /api/fit-guarantee/claim  (multipart/form-data)
// Spec item 12. Uploads photos to Shopify Files and emails the claim to support.
// No database — see fit-guarantee-claim.service.ts.

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_ADDITIONAL = 7;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // client compresses before upload
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

function fileOrNull(entry: FormDataEntryValue | null): File | null {
  return entry instanceof File && entry.size > 0 ? entry : null;
}

function checkImage(file: File, label: string): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return `${label} must be a JPG or PNG image.`;
  if (file.size > MAX_IMAGE_BYTES) return `${label} must be 4 MB or smaller.`;
  return null;
}

export async function POST(request: Request) {
  try {
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { success: false, error: { message: 'Fit Guarantee claims are temporarily unavailable.' } },
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
      return NextResponse.json({ success: true, data: { received: true } }, { status: 200 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: { message: 'Too many claims submitted. Please try again later.' } },
        { status: 429 }
      );
    }

    const orderNumber = clean(form.get('orderNumber'), 60);
    const customerName = clean(form.get('customerName'), 80);
    const email = clean(form.get('email'), 160);
    const telephone = clean(form.get('telephone'), 40);
    const product = clean(form.get('product'), 160);
    const originalWidth = clean(form.get('originalWidth'), 20);
    const originalHeight = clean(form.get('originalHeight'), 20);
    const correctWidth = clean(form.get('correctWidth'), 20);
    const correctHeight = clean(form.get('correctHeight'), 20);
    const problem = clean(form.get('problem'), 3000);
    const videoLink = clean(form.get('videoLink'), 300);
    const confirmed = clean(form.get('confirmed'), 10) === 'true';

    if (!orderNumber) return badRequest('Please enter your order number.');
    if (customerName.length < 2) return badRequest('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest('Please enter a valid email address.');
    if (telephone.length < 5) return badRequest('Please enter a telephone number.');
    if (!product) return badRequest('Please enter the product.');
    if (!originalWidth || !originalHeight) return badRequest('Please enter the original width and height.');
    if (!correctWidth || !correctHeight) return badRequest('Please enter the correct width and height.');
    if (problem.length < 10) return badRequest('Please describe the problem.');
    if (videoLink && !/^https?:\/\/\S+$/.test(videoLink)) return badRequest('The video link must be a valid URL.');
    if (!confirmed) return badRequest('Please confirm the corrected measurements are accurate.');

    // All photos are optional.
    const windowPhoto = fileOrNull(form.get('photoWindow'));
    const widthPhoto = fileOrNull(form.get('photoWidth'));
    const heightPhoto = fileOrNull(form.get('photoHeight'));

    const additional = form
      .getAll('additionalPhotos')
      .filter((e): e is File => e instanceof File && e.size > 0);
    if (additional.length > MAX_ADDITIONAL) {
      return badRequest(`Please attach at most ${MAX_ADDITIONAL} additional photos.`);
    }

    for (const [file, label] of [
      [windowPhoto, 'The blind-at-window photo'],
      [widthPhoto, 'The width photo'],
      [heightPhoto, 'The height photo'],
      ...additional.map((f) => [f, 'Each additional photo'] as const),
    ].filter((entry): entry is [File, string] => entry[0] instanceof File)) {
      const problemMsg = checkImage(file, label);
      if (problemMsg) return badRequest(problemMsg);
    }

    await submitFitGuaranteeClaim({
      orderNumber,
      customerName,
      email,
      telephone,
      product,
      originalWidth,
      originalHeight,
      correctWidth,
      correctHeight,
      problem,
      videoLink: videoLink || undefined,
      photos: { windowPhoto, widthPhoto, heightPhoto, additional },
    });

    return NextResponse.json({ success: true, data: { received: true } }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof FitGuaranteeClaimError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fit Guarantee claim error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Could not submit your claim. Please try again.' } },
      { status: 500 }
    );
  }
}
