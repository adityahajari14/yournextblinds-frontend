import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/database';
import { hasExplicitSource, orderMatchesSource } from '@/lib/server/shopify-order-source';

export async function POST(request: Request) {
  try {
    const order = await request.json();

    if (!order || !order.id) {
      console.error('Webhook: Invalid order payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (hasExplicitSource(order) && !orderMatchesSource(order)) {
      console.log(`Webhook: Ignoring paid order ${order.id} because source tag did not match`);
      return NextResponse.json({ success: true, ignored: true });
    }

    console.log(`Webhook: Order paid #${order.order_number} (Shopify ID: ${order.id})`);

    const orderNumber = `SHOP-${order.order_number || order.id}`;
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });

    const orderData = {
      status: 'CONFIRMED' as const,
      customerEmail: order.email || order.customer?.email || null,
      customerName: order.customer
        ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
        : null,
      shippingAddress: order.shipping_address || null,
      subtotal: parseFloat(order.subtotal_price) || 0,
      tax: parseFloat(order.total_tax) || 0,
      shipping: order.shipping_lines?.[0]
        ? parseFloat(order.shipping_lines[0].price) || 0
        : 0,
      total: parseFloat(order.total_price) || 0,
    };

    if (existingOrder) {
      await prisma.order.update({
        where: { orderNumber },
        data: orderData,
      });
      console.log(`  Updated order: ${orderNumber}`);
    } else {
      await prisma.order.create({
        data: { orderNumber, ...orderData },
      });
      console.log(`  Created order: ${orderNumber}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json({ success: true, warning: 'Processed with errors' });
  }
}
