import { NextResponse } from 'next/server';
import { getCustomer } from '@/lib/auth';

export async function GET() {
  try {
    const customer = await getCustomer();

    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Auth me error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}