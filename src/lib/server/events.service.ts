import { ensureSchema, sql } from './db';

export const STOREFRONT_EVENT_TYPES = [
  'product_view',
  'add_to_cart',
  'cart_view',
  'checkout_initiated',
  'chat_opened',
  'chat_message',
] as const;

export type StorefrontEventType = (typeof STOREFRONT_EVENT_TYPES)[number];

export interface StorefrontEventInput {
  eventType: StorefrontEventType;
  sessionId: string;
  productHandle?: string | null;
  productTitle?: string | null;
  quantity?: number | null;
  value?: number | null;
  configuration?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  deviceType?: string | null;
  userAgent?: string | null;
  sessionDurationSeconds?: number | null;
}

export interface StorefrontEventRecord {
  id: string;
  createdAt: string;
  eventType: StorefrontEventType;
  sessionId: string;
  productHandle: string | null;
  productTitle: string | null;
  quantity: number | null;
  value: number | null;
  configuration: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  deviceType: string | null;
  userAgent: string | null;
  sessionDurationSeconds: number | null;
}

export interface DashboardStats {
  productViews: number;
  addToCarts: number;
  cartViews: number;
  checkoutsInitiated: number;
  uniqueSessions: number;
  checkoutsPending: number;
  checkoutsAbandoned: number;
  checkoutsConverted: number;
  abandonedValue: number;
  convertedValue: number;
  cartsActive: number;
  cartsAbandoned: number;
  cartsConverted: number;
  abandonedCartValue: number;
}

interface EventRow {
  id: string;
  created_at: string;
  event_type: string;
  session_id: string;
  product_handle: string | null;
  product_title: string | null;
  quantity: number | null;
  value: string | null;
  configuration: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  device_type: string | null;
  user_agent: string | null;
  session_duration_seconds: number | null;
}

function toEventRecord(row: EventRow): StorefrontEventRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    eventType: row.event_type as StorefrontEventType,
    sessionId: row.session_id,
    productHandle: row.product_handle,
    productTitle: row.product_title,
    quantity: row.quantity,
    value: row.value === null ? null : Number(row.value),
    configuration: row.configuration,
    meta: row.meta,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    referrer: row.referrer,
    deviceType: row.device_type,
    userAgent: row.user_agent,
    sessionDurationSeconds: row.session_duration_seconds,
  };
}

export async function recordStorefrontEvent(input: StorefrontEventInput): Promise<void> {
  await ensureSchema();
  const db = sql();

  await db.query(
    `INSERT INTO storefront_events
      (event_type, session_id, product_handle, product_title, quantity, value, configuration, meta,
       utm_source, utm_medium, utm_campaign, referrer, device_type, user_agent, session_duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      input.eventType,
      input.sessionId,
      input.productHandle || null,
      input.productTitle || null,
      input.quantity ?? null,
      input.value ?? null,
      input.configuration ? JSON.stringify(input.configuration) : null,
      input.meta ? JSON.stringify(input.meta) : null,
      input.utmSource || null,
      input.utmMedium || null,
      input.utmCampaign || null,
      input.referrer || null,
      input.deviceType || null,
      input.userAgent || null,
      input.sessionDurationSeconds ?? null,
    ]
  );
}

export interface EventFilters {
  days: number;
  eventType?: StorefrontEventType;
  search?: string;
  from?: string;
  to?: string;
}

export async function listRecentEvents(
  filters: EventFilters,
  limit = 50,
  offset = 0
): Promise<{ events: StorefrontEventRecord[]; total: number }> {
  await ensureSchema();
  const db = sql();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.from && filters.to) {
    params.push(filters.from, filters.to);
    conditions.push(`created_at >= $${params.length - 1}::timestamptz AND created_at < ($${params.length}::timestamptz + interval '1 day')`);
  } else {
    params.push(filters.days);
    conditions.push(`created_at >= now() - ($${params.length} || ' days')::interval`);
  }

  if (filters.eventType) {
    params.push(filters.eventType);
    conditions.push(`event_type = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(product_title ILIKE $${params.length} OR session_id ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRows = (await db.query(
    `SELECT COUNT(*)::int AS total FROM storefront_events ${whereClause}`,
    params
  )) as Array<{ total: number }>;

  params.push(limit, offset);
  const rows = (await db.query(
    `SELECT * FROM storefront_events ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )) as EventRow[];

  return { events: rows.map(toEventRecord), total: countRows[0]?.total ?? 0 };
}

export async function getDashboardStats(days: number): Promise<DashboardStats> {
  await ensureSchema();
  const db = sql();

  const [eventCountsRaw, sessionCountRaw, checkoutStatsRaw, cartStatsRaw] = await Promise.all([
    db.query(
      `SELECT event_type, COUNT(*)::int AS count
         FROM storefront_events
        WHERE created_at >= now() - ($1 || ' days')::interval
        GROUP BY event_type`,
      [days]
    ),
    db.query(
      `SELECT COUNT(DISTINCT session_id)::int AS count
         FROM storefront_events
        WHERE created_at >= now() - ($1 || ' days')::interval`,
      [days]
    ),
    db.query(
      `SELECT status,
              COUNT(*)::int AS count,
              COALESCE(SUM(subtotal), 0) AS total
         FROM abandoned_checkouts
        WHERE created_at >= now() - ($1 || ' days')::interval
        GROUP BY status`,
      [days]
    ),
    db.query(
      `SELECT status,
              COUNT(*)::int AS count,
              COALESCE(SUM(subtotal), 0) AS total
         FROM abandoned_carts
        WHERE created_at >= now() - ($1 || ' days')::interval
        GROUP BY status`,
      [days]
    ),
  ]);

  const eventCounts = eventCountsRaw as Array<{ event_type: string; count: number }>;
  const sessionCount = sessionCountRaw as Array<{ count: number }>;
  const checkoutStats = checkoutStatsRaw as Array<{ status: string; count: number; total: string }>;
  const cartStats = cartStatsRaw as Array<{ status: string; count: number; total: string }>;

  const countFor = (type: StorefrontEventType) =>
    eventCounts.find((row) => row.event_type === type)?.count ?? 0;
  const checkoutFor = (status: string) =>
    checkoutStats.find((row) => row.status === status) ?? { count: 0, total: '0' };
  const cartFor = (status: string) => cartStats.find((row) => row.status === status) ?? { count: 0, total: '0' };

  return {
    productViews: countFor('product_view'),
    addToCarts: countFor('add_to_cart'),
    cartViews: countFor('cart_view'),
    checkoutsInitiated: countFor('checkout_initiated'),
    uniqueSessions: sessionCount[0]?.count ?? 0,
    checkoutsPending: checkoutFor('pending').count,
    checkoutsAbandoned: checkoutFor('abandoned').count,
    checkoutsConverted: checkoutFor('converted').count,
    abandonedValue: Number(checkoutFor('abandoned').total),
    convertedValue: Number(checkoutFor('converted').total),
    cartsActive: cartFor('active').count,
    cartsAbandoned: cartFor('abandoned').count,
    cartsConverted: cartFor('converted').count,
    abandonedCartValue: Number(cartFor('abandoned').total),
  };
}
