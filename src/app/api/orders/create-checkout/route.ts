import { NextResponse } from 'next/server';
import { createCheckout, CheckoutError } from '@/lib/server/order.service';

export async function POST(request: Request) {
  try {
    const { items, customerEmail, note, analyticsSessionId } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'items array is required and must not be empty' } },
        { status: 400 }
      );
    }

    const result = await createCheckout({
      items,
      customerEmail,
      note,
      analyticsSessionId: typeof analyticsSessionId === 'string' ? analyticsSessionId : undefined,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        {
          success: false,
          error: { message: error.message, code: error.code, details: error.details },
        },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('not found') || message.includes('no price band')) {
      return NextResponse.json(
        { success: false, error: { message } },
        { status: 404 }
      );
    }

    console.error('Checkout error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
