import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';

export const CUSTOMER_ACCESS_TOKEN_COOKIE = 'shopify_customer_token';
export const CUSTOMER_REFRESH_TOKEN_COOKIE = 'shopify_customer_refresh_token';
export const CUSTOMER_ID_TOKEN_COOKIE = 'shopify_customer_id_token';
export const CUSTOMER_TOKEN_EXPIRY_COOKIE = 'shopify_customer_token_expires_at';
export const CUSTOMER_AUTH_STATE_COOKIE = 'shopify_customer_auth_state';
export const CUSTOMER_AUTH_RETURN_TO_COOKIE = 'shopify_customer_auth_return_to';

interface OpenIdConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
}

interface CustomerAccountApiDiscovery {
  graphql_api: string;
}

export interface CustomerTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
}

function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  };
}

export function getStorefrontDomain(): string {
  const domain =
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_DOMAIN?.replace(/^account\./, 'orders.') ||
    'orders.yournextblinds.com';

  return domain.replace(/^https?:\/\//, '');
}

export function getCustomerAccountDomain(): string {
  const domain =
    process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_DOMAIN ||
    getStorefrontDomain().replace(/^orders\./, 'account.');

  return domain.replace(/^https?:\/\//, '');
}

export function getAppBaseUrl(): string {
  const explicitUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

export function getCustomerAccountClientId(): string {
  const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || '';
  if (!clientId) {
    throw new Error('SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID is required');
  }
  return clientId;
}

export function getCustomerAccountClientSecret(): string {
  const clientSecret = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET || '';
  if (!clientSecret) {
    throw new Error('SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET is required');
  }
  return clientSecret;
}

export function getCustomerAccountCallbackUrl(): string {
  return `${getAppBaseUrl()}/api/auth/shopify/callback`;
}

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value) return '/';

  if (value.startsWith('/')) {
    return value;
  }

  try {
    const url = new URL(value);
    if (url.origin === getAppBaseUrl() || url.hostname === getCustomerAccountDomain()) {
      return value;
    }
  } catch {
    return '/';
  }

  return '/';
}

export function generateAuthState(): string {
  return randomBytes(24).toString('hex');
}

export async function getOpenIdConfiguration(): Promise<OpenIdConfiguration> {
  const response = await fetch(
    `https://${getStorefrontDomain()}/.well-known/openid-configuration`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Failed to load Shopify OpenID configuration: ${response.status}`);
  }

  return response.json();
}

export async function getCustomerAccountApiDiscovery(): Promise<CustomerAccountApiDiscovery> {
  const response = await fetch(
    `https://${getStorefrontDomain()}/.well-known/customer-account-api`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Failed to load Shopify customer account API discovery: ${response.status}`);
  }

  return response.json();
}

export function buildAuthorizationHeader(): string {
  const clientId = getCustomerAccountClientId();
  const clientSecret = getCustomerAccountClientSecret();
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
}

export async function exchangeCodeForCustomerTokens(code: string): Promise<CustomerTokenResponse> {
  const config = await getOpenIdConfiguration();

  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', getCustomerAccountClientId());
  body.set('redirect_uri', getCustomerAccountCallbackUrl());
  body.set('code', code);

  const response = await fetch(config.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: buildAuthorizationHeader(),
      Origin: getAppBaseUrl(),
      'User-Agent': 'yournextblinds-headless-auth',
    },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange Shopify auth code: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function refreshCustomerTokens(refreshToken: string): Promise<CustomerTokenResponse> {
  const config = await getOpenIdConfiguration();

  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('client_id', getCustomerAccountClientId());
  body.set('refresh_token', refreshToken);

  const response = await fetch(config.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: buildAuthorizationHeader(),
      Origin: getAppBaseUrl(),
      'User-Agent': 'yournextblinds-headless-auth',
    },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Shopify customer token: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function persistCustomerTokens(tokens: CustomerTokenResponse): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + tokens.expires_in * 1000;

  cookieStore.set(
    CUSTOMER_ACCESS_TOKEN_COOKIE,
    tokens.access_token,
    getCookieOptions(tokens.expires_in)
  );
  cookieStore.set(
    CUSTOMER_TOKEN_EXPIRY_COOKIE,
    String(expiresAt),
    getCookieOptions(tokens.expires_in)
  );

  if (tokens.refresh_token) {
    cookieStore.set(
      CUSTOMER_REFRESH_TOKEN_COOKIE,
      tokens.refresh_token,
      getCookieOptions(60 * 60 * 24 * 30)
    );
  }

  if (tokens.id_token) {
    cookieStore.set(
      CUSTOMER_ID_TOKEN_COOKIE,
      tokens.id_token,
      getCookieOptions(60 * 60 * 24 * 30)
    );
  }
}

export async function clearCustomerAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  for (const key of [
    CUSTOMER_ACCESS_TOKEN_COOKIE,
    CUSTOMER_REFRESH_TOKEN_COOKIE,
    CUSTOMER_ID_TOKEN_COOKIE,
    CUSTOMER_TOKEN_EXPIRY_COOKIE,
    CUSTOMER_AUTH_STATE_COOKIE,
    CUSTOMER_AUTH_RETURN_TO_COOKIE,
  ]) {
    cookieStore.delete(key);
  }
}

export async function buildCustomerLogoutUrl(postLogoutRedirectUri?: string): Promise<string> {
  const config = await getOpenIdConfiguration();
  const logoutUrl = new URL(config.end_session_endpoint);

  logoutUrl.searchParams.set(
    'post_logout_redirect_uri',
    postLogoutRedirectUri || getAppBaseUrl()
  );

  return logoutUrl.toString();
}

export async function getStoredReturnTo(): Promise<string> {
  const cookieStore = await cookies();
  return sanitizeReturnTo(cookieStore.get(CUSTOMER_AUTH_RETURN_TO_COOKIE)?.value);
}

export async function getValidCustomerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(CUSTOMER_ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(CUSTOMER_REFRESH_TOKEN_COOKIE)?.value;
  const expiresAt = Number(cookieStore.get(CUSTOMER_TOKEN_EXPIRY_COOKIE)?.value || 0);

  if (accessToken && expiresAt > Date.now() + 30_000) {
    return accessToken;
  }

  if (!refreshToken) {
    return null;
  }

  try {
    const refreshed = await refreshCustomerTokens(refreshToken);
    await persistCustomerTokens(refreshed);
    return refreshed.access_token;
  } catch {
    await clearCustomerAuthCookies();
    return null;
  }
}