import { NextResponse } from 'next/server';
import { reconcilePendingCheckouts } from '@/lib/server/abandoned-checkout.service';
import { reconcilePendingCarts } from '@/lib/server/abandoned-cart.service';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

async function handleReconcile(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const [checkouts, carts] = await Promise.all([reconcilePendingCheckouts(), reconcilePendingCarts()]);
    return NextResponse.json({ success: true, data: { checkouts, carts } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ReconcileAbandonedCheckouts]', message);
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}

// Vercel Cron issues an authenticated GET; support POST too for manual/other-scheduler use.
export async function GET(request: Request) {
  return handleReconcile(request);
}

export async function POST(request: Request) {
  return handleReconcile(request);
}
