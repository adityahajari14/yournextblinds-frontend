import { ensureSchema, sql } from './db';

export interface AbandonedCartItem {
  handle: string;
  title: string;
  quantity: number;
  price: number;
  configuration?: Record<string, unknown>;
}

export interface AbandonedCartRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  sessionId: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  status: 'active' | 'abandoned' | 'converted';
  subtotal: number;
  items: AbandonedCartItem[];
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  deviceType: string | null;
  userAgent: string | null;
  sessionDurationSeconds: number | null;
}

// A cart left untouched this long (no add-to-cart/cart-view refresh, no
// checkout start) is considered abandoned — same window as checkouts.
const ABANDONED_AFTER_MINUTES = 60;

interface AbandonedCartRow {
  id: string;
  created_at: string;
  updated_at: string;
  session_id: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  subtotal: string;
  items: AbandonedCartItem[];
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  device_type: string | null;
  user_agent: string | null;
  session_duration_seconds: number | null;
}

function toRecord(row: AbandonedCartRow): AbandonedCartRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sessionId: row.session_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    status: row.status as AbandonedCartRecord['status'],
    subtotal: Number(row.subtotal),
    items: row.items,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    referrer: row.referrer,
    deviceType: row.device_type,
    userAgent: row.user_agent,
    sessionDurationSeconds: row.session_duration_seconds,
  };
}

export async function upsertAbandonedCart(params: {
  sessionId: string;
  subtotal: number;
  items: unknown[];
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  deviceType?: string | null;
  userAgent?: string | null;
  sessionDurationSeconds?: number | null;
}): Promise<void> {
  await ensureSchema();
  const db = sql();

  await db.query(
    `INSERT INTO abandoned_carts
      (session_id, status, subtotal, items, utm_source, utm_medium, utm_campaign,
       referrer, device_type, user_agent, session_duration_seconds)
     VALUES ($1, 'active', $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (session_id) DO UPDATE SET
       subtotal = EXCLUDED.subtotal,
       items = EXCLUDED.items,
       utm_source = COALESCE(abandoned_carts.utm_source, EXCLUDED.utm_source),
       utm_medium = COALESCE(abandoned_carts.utm_medium, EXCLUDED.utm_medium),
       utm_campaign = COALESCE(abandoned_carts.utm_campaign, EXCLUDED.utm_campaign),
       referrer = COALESCE(abandoned_carts.referrer, EXCLUDED.referrer),
       device_type = EXCLUDED.device_type,
       user_agent = EXCLUDED.user_agent,
       session_duration_seconds = EXCLUDED.session_duration_seconds,
       status = CASE WHEN abandoned_carts.status = 'converted' THEN 'converted' ELSE 'active' END,
       updated_at = now()`,
    [
      params.sessionId,
      params.subtotal,
      JSON.stringify(params.items),
      params.utmSource || null,
      params.utmMedium || null,
      params.utmCampaign || null,
      params.referrer || null,
      params.deviceType || null,
      params.userAgent || null,
      params.sessionDurationSeconds ?? null,
    ]
  );
}

export async function markAbandonedCartCheckoutStarted(sessionId: string): Promise<void> {
  await ensureSchema();
  const db = sql();

  await db.query(
    `UPDATE abandoned_carts SET status = 'converted', updated_at = now()
      WHERE session_id = $1 AND status != 'converted'`,
    [sessionId]
  );
}

export interface CartFilters {
  days?: number;
  from?: string;
  to?: string;
  status?: 'active' | 'abandoned' | 'converted';
  minSubtotal?: number;
  maxSubtotal?: number;
  search?: string;
  productHandle?: string;
}

export async function listAbandonedCarts(
  filters: CartFilters,
  limit = 50,
  offset = 0
): Promise<{ carts: AbandonedCartRecord[]; total: number }> {
  await ensureSchema();
  const db = sql();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.from && filters.to) {
    params.push(filters.from, filters.to);
    conditions.push(`created_at >= $${params.length - 1}::timestamptz AND created_at < ($${params.length}::timestamptz + interval '1 day')`);
  } else if (filters.days) {
    params.push(filters.days);
    conditions.push(`created_at >= now() - ($${params.length} || ' days')::interval`);
  }

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  if (filters.minSubtotal !== undefined) {
    params.push(filters.minSubtotal);
    conditions.push(`subtotal >= $${params.length}`);
  }

  if (filters.maxSubtotal !== undefined) {
    params.push(filters.maxSubtotal);
    conditions.push(`subtotal <= $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(customer_email ILIKE $${params.length} OR session_id ILIKE $${params.length})`);
  }

  if (filters.productHandle) {
    params.push(filters.productHandle);
    conditions.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements(items) elem WHERE elem->>'handle' = $${params.length})`
    );
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRows = (await db.query(
    `SELECT COUNT(*)::int AS total FROM abandoned_carts ${whereClause}`,
    params
  )) as Array<{ total: number }>;

  params.push(limit, offset);
  const rows = (await db.query(
    `SELECT * FROM abandoned_carts ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )) as AbandonedCartRow[];

  return { carts: rows.map(toRecord), total: countRows[0]?.total ?? 0 };
}

export async function reconcilePendingCarts(): Promise<{ checked: number; abandoned: number }> {
  await ensureSchema();
  const db = sql();

  const activeBefore = (await db.query(
    `SELECT COUNT(*)::int AS count FROM abandoned_carts WHERE status = 'active'`
  )) as Array<{ count: number }>;

  const abandonedRows = (await db.query(
    `UPDATE abandoned_carts
        SET status = 'abandoned', updated_at = now()
      WHERE status = 'active'
        AND updated_at < now() - ($1 || ' minutes')::interval
      RETURNING id`,
    [ABANDONED_AFTER_MINUTES]
  )) as Array<{ id: string }>;

  return { checked: activeBefore[0]?.count ?? 0, abandoned: abandonedRows.length };
}
