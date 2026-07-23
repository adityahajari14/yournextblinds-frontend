import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// On-demand ISR revalidation. Lets an operator force specific static pages to
// regenerate immediately — e.g. to clear a collection page that got stuck
// serving $0 prices from a bad static snapshot — without waiting for the
// hourly revalidate window or doing a full redeploy.
//
// Protected by REVALIDATE_SECRET. Call as:
//   GET /api/revalidate?secret=...&path=/collections/blackout-roller-shades
//   GET /api/revalidate?secret=...            (revalidates a default set)

const DEFAULT_PATHS = [
  '/collections/light-filtering-roller-shades',
  '/collections/blackout-roller-shades',
  '/collections/waterproof-blackout-roller-shades',
];

export async function GET(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'REVALIDATE_SECRET is not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== secret) {
    return NextResponse.json({ success: false, error: 'Invalid secret' }, { status: 401 });
  }

  const requestedPath = searchParams.get('path');
  const paths = requestedPath ? [requestedPath] : DEFAULT_PATHS;

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ success: true, revalidated: paths, at: Date.now() });
}
