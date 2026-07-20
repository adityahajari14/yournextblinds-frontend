import crypto from 'crypto';
import { cookies } from 'next/headers';

// Minimal signed-session auth for the internal analytics dashboard. No new
// dependency: the cookie is `<expiresAt>.<hmac>`, verified with the app's
// admin credentials as the signing key so a stolen cookie is useless without
// them, and sessions can't be forged without ANALYTICS_ADMIN_PASSWORD.

const SESSION_COOKIE = 'ynb_admin_session';
const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours

function getSigningSecret(): string | null {
  const password = process.env.ANALYTICS_ADMIN_PASSWORD;
  const id = process.env.ANALYTICS_ADMIN_ID;
  if (!password || !id) return null;
  return `${id}:${password}`;
}

function sign(value: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isAdminConfigured(): boolean {
  return getSigningSecret() !== null;
}

export function verifyAdminCredentials(id: string, password: string): boolean {
  const expectedId = process.env.ANALYTICS_ADMIN_ID;
  const expectedPassword = process.env.ANALYTICS_ADMIN_PASSWORD;
  if (!expectedId || !expectedPassword) return false;
  // Pad to a fixed length before comparing so failing early on the ID never
  // leaks which field was wrong via response timing.
  const idMatch = timingSafeEqual(id.padEnd(64, '\0'), expectedId.padEnd(64, '\0'));
  const passwordMatch = timingSafeEqual(password.padEnd(64, '\0'), expectedPassword.padEnd(64, '\0'));
  return idMatch && passwordMatch;
}

export async function createAdminSession(): Promise<void> {
  const secret = getSigningSecret();
  if (!secret) throw new Error('Admin credentials are not configured');

  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  const token = `${payload}.${sign(payload, secret)}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin/analytics',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  // Path must match the one used when setting the cookie, or the browser
  // treats this as a different cookie and the original is never cleared.
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin/analytics',
    maxAge: 0,
  });
}

export async function hasValidAdminSession(): Promise<boolean> {
  const secret = getSigningSecret();
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  if (!timingSafeEqual(sign(payload, secret), signature)) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}
