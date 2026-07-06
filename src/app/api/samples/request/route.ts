import { NextResponse } from 'next/server';
import { createSampleOrder, SampleRequestError } from '@/lib/server/sample.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, swatches } = body ?? {};

    const result = await createSampleOrder({ email, swatches });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof SampleRequestError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sample request error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
