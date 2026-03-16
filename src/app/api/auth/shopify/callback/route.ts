import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  CUSTOMER_AUTH_RETURN_TO_COOKIE,
  CUSTOMER_AUTH_STATE_COOKIE,
  clearCustomerAuthCookies,
  exchangeCodeForCustomerTokens,
  getStoredReturnTo,
  persistCustomerTokens,
} from '@/lib/server/customer-account-auth';

function withAuthError(returnTo: string, message: string): string {
  try {
    if (returnTo.startsWith('/')) {
      const url = new URL(returnTo, 'http://localhost');
      url.searchParams.set('auth_error', message);
      return `${url.pathname}${url.search}`;
    }

    const url = new URL(returnTo);
    url.searchParams.set('auth_error', message);
    return url.toString();
  } catch {
    return `/?auth_error=${encodeURIComponent(message)}`;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(CUSTOMER_AUTH_STATE_COOKIE)?.value;
  const returnTo = await getStoredReturnTo();

  if (error) {
    await clearCustomerAuthCookies();
    return NextResponse.redirect(new URL(withAuthError(returnTo, error), requestUrl.origin));
  }

  if (!code || !state || state !== expectedState) {
    await clearCustomerAuthCookies();
    return NextResponse.redirect(new URL(withAuthError(returnTo, 'invalid_callback'), requestUrl.origin));
  }

  try {
    const tokens = await exchangeCodeForCustomerTokens(code);
    await persistCustomerTokens(tokens);

    const response = NextResponse.redirect(new URL(returnTo, requestUrl.origin));
    response.cookies.delete(CUSTOMER_AUTH_STATE_COOKIE);
    response.cookies.delete(CUSTOMER_AUTH_RETURN_TO_COOKIE);
    return response;
  } catch (authError) {
    await clearCustomerAuthCookies();
    const message = authError instanceof Error ? authError.message : 'token_exchange_failed';
    return NextResponse.redirect(new URL(withAuthError(returnTo, message), requestUrl.origin));
  }
}