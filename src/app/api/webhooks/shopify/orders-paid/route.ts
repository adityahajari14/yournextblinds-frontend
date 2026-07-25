import { NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/server/shopify-webhook';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!verifyShopifyWebhook(rawBody, request.headers.get('x-shopify-hmac-sha256'))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const order = JSON.parse(rawBody);

    if (!order || !order.id) {
      console.error('Webhook: Invalid order payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`Webhook: Order paid #${order.order_number} (Shopify ID: ${order.id})`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json({ success: true, warning: 'Processed with errors' });
  }
}
