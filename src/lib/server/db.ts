import { neon } from '@neondatabase/serverless';

export function validateDatabaseConfig(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
}

let cachedSql: ReturnType<typeof neon> | null = null;

export function sql() {
  if (!cachedSql) {
    validateDatabaseConfig();
    cachedSql = neon(process.env.DATABASE_URL!);
  }
  return cachedSql;
}

let migrationPromise: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!migrationPromise) {
    const db = sql();
    migrationPromise = (async () => {
      await db.query(
        `CREATE TABLE IF NOT EXISTS abandoned_checkouts (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          customer_email TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          draft_order_id TEXT,
          checkout_url TEXT,
          shopify_order_id TEXT,
          subtotal NUMERIC(10, 2) NOT NULL,
          items JSONB NOT NULL
        )`
      );
      await db.query(
        `CREATE TABLE IF NOT EXISTS storefront_events (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          event_type TEXT NOT NULL,
          session_id TEXT NOT NULL,
          product_handle TEXT,
          product_title TEXT,
          quantity INT,
          value NUMERIC(10, 2),
          configuration JSONB,
          meta JSONB
        )`
      );
      await db.query(
        `CREATE INDEX IF NOT EXISTS idx_storefront_events_created_at
           ON storefront_events (created_at DESC)`
      );
      await db.query(
        `CREATE INDEX IF NOT EXISTS idx_storefront_events_type
           ON storefront_events (event_type, created_at DESC)`
      );

      // Opportunistic customer detail: no current UI captures these at checkout time,
      // so these columns stay null until a real source (e.g. logged-in customer) exists.
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS customer_name TEXT`);
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS customer_phone TEXT`);
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS session_id TEXT`);
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS utm_source TEXT`);
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS utm_medium TEXT`);
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS utm_campaign TEXT`);
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS referrer TEXT`);
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS device_type TEXT`);
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS user_agent TEXT`);
      await db.query(`ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS session_duration_seconds INT`);

      await db.query(`ALTER TABLE storefront_events ADD COLUMN IF NOT EXISTS utm_source TEXT`);
      await db.query(`ALTER TABLE storefront_events ADD COLUMN IF NOT EXISTS utm_medium TEXT`);
      await db.query(`ALTER TABLE storefront_events ADD COLUMN IF NOT EXISTS utm_campaign TEXT`);
      await db.query(`ALTER TABLE storefront_events ADD COLUMN IF NOT EXISTS referrer TEXT`);
      await db.query(`ALTER TABLE storefront_events ADD COLUMN IF NOT EXISTS device_type TEXT`);
      await db.query(`ALTER TABLE storefront_events ADD COLUMN IF NOT EXISTS user_agent TEXT`);
      await db.query(`ALTER TABLE storefront_events ADD COLUMN IF NOT EXISTS session_duration_seconds INT`);

      // Cart-level abandonment: a session that added to cart / viewed cart but never
      // reached checkout. Upserted per session_id and refreshed on every cart event;
      // reconciled to 'abandoned' or 'converted' the same way as abandoned_checkouts.
      await db.query(
        `CREATE TABLE IF NOT EXISTS abandoned_carts (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          session_id TEXT NOT NULL UNIQUE,
          customer_email TEXT,
          customer_name TEXT,
          customer_phone TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          subtotal NUMERIC(10, 2) NOT NULL,
          items JSONB NOT NULL,
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          referrer TEXT,
          device_type TEXT,
          user_agent TEXT,
          session_duration_seconds INT
        )`
      );
      await db.query(
        `CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status
           ON abandoned_carts (status, created_at DESC)`
      );

      // Durable login-attempt counter (serverless functions don't share memory
      // between invocations, so brute-force throttling has to live in the DB).
      await db.query(
        `CREATE TABLE IF NOT EXISTS admin_login_attempts (
          identifier TEXT PRIMARY KEY,
          attempt_count INT NOT NULL DEFAULT 0,
          first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          locked_until TIMESTAMPTZ
        )`
      );
    })();
  }
  return migrationPromise;
}
