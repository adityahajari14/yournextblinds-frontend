import { NextResponse } from 'next/server';
import {
  CUSTOMER_AUTH_RETURN_TO_COOKIE,
  CUSTOMER_AUTH_STATE_COOKIE,
  generateAuthState,
  getCustomerAccountCallbackUrl,
  getCustomerAccountClientId,
  getOpenIdConfiguration,
  sanitizeReturnTo,
} from '@/lib/server/customer-account-auth';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get('return_to'));
  const prompt = requestUrl.searchParams.get('prompt');
  const state = generateAuthState();
  const authConfig = await getOpenIdConfiguration();

  const authorizationUrl = new URL(authConfig.authorization_endpoint);
  authorizationUrl.searchParams.set('scope', 'openid email customer-account-api:full');
  authorizationUrl.searchParams.set('client_id', getCustomerAccountClientId());
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('redirect_uri', getCustomerAccountCallbackUrl());
  authorizationUrl.searchParams.set('state', state);
  if (prompt === 'none') {
    authorizationUrl.searchParams.set('prompt', 'none');
  }

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(CUSTOMER_AUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });
  response.cookies.set(CUSTOMER_AUTH_RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  return response;
}