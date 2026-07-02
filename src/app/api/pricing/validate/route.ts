import { NextResponse } from 'next/server';
import * as pricingService from '@/lib/server/pricing.service';

export async function POST(request: Request) {
  try {
    const {
      handle,
      widthInches,
      heightInches,
      customizations,
      submittedPrice,
      variantPriceBandName,
      variantCode,
      variantId,
      variantLabel,
    } = await request.json();

    if (!handle || typeof widthInches !== 'number' || typeof heightInches !== 'number' || typeof submittedPrice !== 'number') {
      return NextResponse.json(
        { success: false, error: { message: 'handle, widthInches, heightInches, and submittedPrice are required' } },
        { status: 400 }
      );
    }

    const validation = await pricingService.validateCartPrice(
      {
        handle,
        widthInches,
        heightInches,
        customizations,
        variantPriceBandName,
        variantCode,
        variantId,
        variantLabel,
      },
      submittedPrice
    );

    return NextResponse.json({ success: true, data: validation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('not found') || message.includes('no price band')) {
      return NextResponse.json(
        { success: false, error: { message } },
        { status: 404 }
      );
    }
    console.error('Pricing validate error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
