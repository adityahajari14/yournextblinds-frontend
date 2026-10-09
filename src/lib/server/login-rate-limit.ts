import { ensureSchema, sql } from './db';

const MAX_ATTEMPTS = 8;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

// Keyed by IP (best-effort identifier for an anonymous login form). A shared IP
// (office, VPN) can trip this together, but that's an acceptable tradeoff for a
// single internal admin account with no per-user identity before login succeeds.
export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  await ensureSchema();
  const db = sql();

  const rows = (await db.query(
    `SELECT attempt_count, first_attempt_at, locked_until
       FROM admin_login_attempts
      WHERE identifier = $1`,
    [identifier]
  )) as Array<{ attempt_count: number; first_attempt_at: string; locked_until: string | null }>;

  const row = rows[0];
  if (!row) return { allowed: true };

  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    const retryAfterSeconds = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  const windowExpired =
    Date.now() - new Date(row.first_attempt_at).getTime() > WINDOW_MINUTES * 60_000;

  if (windowExpired) {
    return { allowed: true };
  }

  if (row.attempt_count >= MAX_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
    await db.query(
      `UPDATE admin_login_attempts SET locked_until = $2 WHERE identifier = $1`,
      [identifier, lockedUntil.toISOString()]
    );
    return { allowed: false, retryAfterSeconds: LOCKOUT_MINUTES * 60 };
  }

  return { allowed: true };
}

export async function recordFailedLoginAttempt(identifier: string): Promise<void> {
  await ensureSchema();
  const db = sql();

  await db.query(
    `INSERT INTO admin_login_attempts (identifier, attempt_count, first_attempt_at)
     VALUES ($1, 1, now())
     ON CONFLICT (identifier) DO UPDATE SET
       attempt_count = CASE
         WHEN admin_login_attempts.first_attempt_at < now() - ($2 || ' minutes')::interval
           THEN 1
         ELSE admin_login_attempts.attempt_count + 1
       END,
       first_attempt_at = CASE
         WHEN admin_login_attempts.first_attempt_at < now() - ($2 || ' minutes')::interval
           THEN now()
         ELSE admin_login_attempts.first_attempt_at
       END`,
    [identifier, WINDOW_MINUTES]
  );
}

export async function clearLoginAttempts(identifier: string): Promise<void> {
  await ensureSchema();
  const db = sql();
  await db.query(`DELETE FROM admin_login_attempts WHERE identifier = $1`, [identifier]);
}
