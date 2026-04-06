import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/database';
import { hasExplicitSource, orderMatchesSource } from '@/lib/server/shopify-order-source';

export async function POST(request: Request) {
  try {
    const order = await request.json();

    if (!order || !order.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (hasExplicitSource(order) && !orderMatchesSource(order)) {
      console.log(`Webhook: Ignoring cancelled order ${order.id} because source tag did not match`);
      return NextResponse.json({ success: true, ignored: true });
    }

    console.log(`Webhook: Order cancelled #${order.order_number} (Shopify ID: ${order.id})`);

    const orderNumber = `SHOP-${order.order_number || order.id}`;
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (existingOrder) {
      await prisma.order.update({
        where: { orderNumber },
        data: { status: 'CANCELLED' },
      });
      console.log(`  Order ${orderNumber} marked as cancelled`);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json({ success: true, warning: 'Processed with errors' });
  }
}
