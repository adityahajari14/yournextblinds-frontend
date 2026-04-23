import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const order = await request.json();

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
