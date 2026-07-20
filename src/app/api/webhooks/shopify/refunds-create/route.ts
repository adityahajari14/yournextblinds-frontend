import { NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/server/shopify-webhook';
import { recordServerEvent } from '@/lib/server/analytics.service';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!verifyShopifyWebhook(rawBody, request.headers.get('x-shopify-hmac-sha256'))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const refund = JSON.parse(rawBody);

    if (!refund || !refund.order_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const amount = Number(refund.transactions?.[0]?.amount) || 0;
    console.log(`Webhook: Refund created for Shopify order ${refund.order_id} (amount: ${amount})`);

    await recordServerEvent('refund', {
      orderId: String(refund.order_id),
      value: amount,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json({ success: true, warning: 'Processed with errors' });
  }
}
