import { NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/server/shopify-webhook';
import { recordServerEvent } from '@/lib/server/analytics.service';

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

    // The analytics session ID threaded through checkout rides on the order's
    // note_attributes; use it to attribute this purchase to the browser session
    // so checkout-abandonment can tell converted sessions from abandoned ones.
    const noteAttributes: Array<{ name?: string; value?: string }> = Array.isArray(
      order.note_attributes
    )
      ? order.note_attributes
      : [];
    const analyticsSession =
      noteAttributes.find((a) => a?.name === '_analytics_session')?.value || undefined;

    const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
    await recordServerEvent(
      'purchase',
      {
        orderId: String(order.id),
        orderNumber: order.order_number ?? null,
        value: Number(order.total_price) || 0,
        currency: order.currency ?? null,
        itemCount: lineItems.reduce(
          (sum: number, line: { quantity?: number }) => sum + (line.quantity ?? 0),
          0
        ),
        // Per-product breakdown drives the top-products-by-sales report.
        items: lineItems.map(
          (line: {
            product_id?: number | string;
            title?: string;
            quantity?: number;
            price?: string;
          }) => ({
            productId: line.product_id != null ? String(line.product_id) : null,
            title: line.title ?? null,
            quantity: line.quantity ?? 0,
            price: Number(line.price) || 0,
          })
        ),
      },
      analyticsSession
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json({ success: true, warning: 'Processed with errors' });
  }
}
