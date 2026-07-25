import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is required');
  }
  return secret;
}

function getAdminCredentials(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD are required');
  }
  return { username, password };
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

// Constant-time-ish comparison to avoid trivial timing side channels on the signature check.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Session token shape: base64url(username).base64url(expiresAt).signature
// Signed (not encrypted) — fine since the payload holds no secret, only identifies
// who's logged in and until when.
export async function createSessionToken(username: string): Promise<string> {
  const secret = getSessionSecret();
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${base64UrlEncode(new TextEncoder().encode(username))}.${expiresAt}`;
  const signature = await hmacSign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [encodedUsername, expiresAtRaw, signature] = parts;
  const payload = `${encodedUsername}.${expiresAtRaw}`;

  try {
    const secret = getSessionSecret();
    const expectedSignature = await hmacSign(payload, secret);
    if (!timingSafeEqual(signature, expectedSignature)) return false;

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const credentials = getAdminCredentials();
  return (
    timingSafeEqual(username.trim(), credentials.username) &&
    timingSafeEqual(password, credentials.password)
  );
}

export async function setAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
