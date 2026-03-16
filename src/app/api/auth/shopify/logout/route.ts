import { NextResponse } from 'next/server';
import {
  buildCustomerLogoutUrl,
  clearCustomerAuthCookies,
  getAppBaseUrl,
  sanitizeReturnTo,
} from '@/lib/server/customer-account-auth';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedReturnTo = requestUrl.searchParams.get('return_to');
  const returnTo = sanitizeReturnTo(requestedReturnTo || '/');

  try {
    const postLogoutRedirectUri = returnTo.startsWith('http')
      ? returnTo
      : `${getAppBaseUrl()}${returnTo}`;
    const logoutUrl = await buildCustomerLogoutUrl(postLogoutRedirectUri);
    const response = NextResponse.redirect(logoutUrl);
    await clearCustomerAuthCookies();
    return response;
  } catch {
    await clearCustomerAuthCookies();
    return NextResponse.redirect(new URL(returnTo, getAppBaseUrl()));
  }
}