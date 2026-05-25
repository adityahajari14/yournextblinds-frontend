import { NextResponse } from 'next/server';
import * as pricingService from '@/lib/server/pricing.service';

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  try {
    const customizations = await pricingService.getCustomizationPricing();
    return NextResponse.json({ success: true, data: customizations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Customizations error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
