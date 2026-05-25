import { NextResponse } from 'next/server';
import * as pricingService from '@/lib/server/pricing.service';

export const revalidate = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    if (!handle) {
      return NextResponse.json(
        { success: false, error: { message: 'handle is required' } },
        { status: 400 }
      );
    }

    const priceBand = await pricingService.resolveHandleToPriceBand(handle);

    if (!priceBand) {
      return NextResponse.json(
        { success: false, error: { message: `Product "${handle}" not found or has no price band` } },
        { status: 404 }
      );
    }

    const matrix = await pricingService.getPriceBandMatrix(priceBand.id);

    if (!matrix) {
      return NextResponse.json(
        { success: false, error: { message: 'Price matrix not found for this product' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: matrix });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Price matrix error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
