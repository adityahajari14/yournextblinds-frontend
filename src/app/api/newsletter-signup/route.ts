import { NextResponse } from 'next/server';
import { subscribeToNewsletter, NewsletterSignupError } from '@/lib/server/newsletter.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body ?? {};

    const result = await subscribeToNewsletter({ email });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof NewsletterSignupError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Newsletter signup error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
