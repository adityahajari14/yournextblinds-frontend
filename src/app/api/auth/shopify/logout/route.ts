import { NextResponse } from 'next/server';
import {
  clearCustomerAuthCookies,
  sanitizeReturnTo,
} from '@/lib/server/customer-account-auth';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedReturnTo = requestUrl.searchParams.get('return_to');
  const returnTo = sanitizeReturnTo(requestedReturnTo || '/');

  await clearCustomerAuthCookies();
  return NextResponse.redirect(new URL(returnTo, requestUrl.origin));
}