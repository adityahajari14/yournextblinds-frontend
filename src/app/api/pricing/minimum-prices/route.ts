import { NextResponse } from 'next/server';
import * as pricingService from '@/lib/server/pricing.service';

export const maxDuration = 30;

export async function GET() {
  try {
    const prices = await pricingService.getMinimumPricesByHandle();
    return NextResponse.json({ success: true, data: prices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Minimum prices error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
