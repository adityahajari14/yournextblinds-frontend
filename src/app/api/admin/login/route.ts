import { NextResponse } from 'next/server';
import { createSessionToken, setAdminSessionCookie, verifyAdminCredentials } from '@/lib/server/admin-auth';
import { checkLoginRateLimit, clearLoginAttempts, recordFailedLoginAttempt } from '@/lib/server/login-rate-limit';

interface LoginRequestBody {
  username?: unknown;
  password?: unknown;
}

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: Request) {
  const identifier = getClientIdentifier(request);

  try {
    const rateLimit = await checkLoginRateLimit(identifier);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Too many failed attempts. Please try again later.' },
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds ?? 900) } }
      );
    }

    const body = (await request.json()) as LoginRequestBody;
    const username = typeof body.username === 'string' ? body.username : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Username and password are required.' } },
        { status: 400 }
      );
    }

    if (!verifyAdminCredentials(username, password)) {
      await recordFailedLoginAttempt(identifier);
      return NextResponse.json(
        { success: false, error: { message: 'Invalid username or password.' } },
        { status: 401 }
      );
    }

    await clearLoginAttempts(identifier);

    const token = await createSessionToken(username.trim());
    await setAdminSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AdminLogin]', message);
    return NextResponse.json(
      { success: false, error: { message: 'Unable to sign in right now.' } },
      { status: 500 }
    );
  }
}
