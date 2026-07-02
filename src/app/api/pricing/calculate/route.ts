import { NextResponse } from 'next/server';
import * as pricingService from '@/lib/server/pricing.service';

export async function POST(request: Request) {
  try {
    const {
      handle,
      widthInches,
      heightInches,
      customizations,
      variantPriceBandName,
      variantCode,
      variantId,
      variantLabel,
    } = await request.json();

    if (!handle) {
      return NextResponse.json(
        { success: false, error: { message: 'handle is required' } },
        { status: 400 }
      );
    }
    if (typeof widthInches !== 'number' || widthInches <= 0) {
      return NextResponse.json(
        { success: false, error: { message: 'widthInches must be a positive number' } },
        { status: 400 }
      );
    }
    if (typeof heightInches !== 'number' || heightInches <= 0) {
      return NextResponse.json(
        { success: false, error: { message: 'heightInches must be a positive number' } },
        { status: 400 }
      );
    }

    const pricing = await pricingService.calculateProductPrice({
      handle,
      widthInches,
      heightInches,
      customizations,
      variantPriceBandName,
      variantCode,
      variantId,
      variantLabel,
    });

    return NextResponse.json({ success: true, data: pricing });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('not found') || message.includes('no price band')) {
      return NextResponse.json(
        { success: false, error: { message } },
        { status: 404 }
      );
    }
    console.error('Pricing calculate error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
