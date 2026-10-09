import { ensureSchema, sql } from './db';
import { getDraftOrderStatus } from './order.service';

export interface AbandonedCheckoutItem {
  handle: string;
  title: string;
  quantity: number;
  calculatedPrice: number;
  widthInches: number;
  heightInches: number;
  configuration: Record<string, string | undefined>;
}

export interface AbandonedCheckoutRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  status: 'pending' | 'converted' | 'abandoned';
  draftOrderId: string | null;
  checkoutUrl: string | null;
  shopifyOrderId: string | null;
  subtotal: number;
  items: AbandonedCheckoutItem[];
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  deviceType: string | null;
  userAgent: string | null;
  sessionDurationSeconds: number | null;
}

// Draft orders left untouched this long are considered abandoned, mirroring
// Shopify's own ~1 hour abandoned-checkout window.
const ABANDONED_AFTER_MINUTES = 60;

interface AbandonedCheckoutRow {
  id: string;
  created_at: string;
  updated_at: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  draft_order_id: string | null;
  checkout_url: string | null;
  shopify_order_id: string | null;
  subtotal: string;
  items: AbandonedCheckoutItem[];
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  device_type: string | null;
  user_agent: string | null;
  session_duration_seconds: number | null;
}

function toRecord(row: AbandonedCheckoutRow): AbandonedCheckoutRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    status: row.status as AbandonedCheckoutRecord['status'],
    draftOrderId: row.draft_order_id,
    checkoutUrl: row.checkout_url,
    shopifyOrderId: row.shopify_order_id,
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

export async function recordCheckoutStarted(params: {
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  sessionId?: string | null;
  draftOrderId: string;
  checkoutUrl: string;
  subtotal: number;
  items: AbandonedCheckoutItem[];
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
    `INSERT INTO abandoned_checkouts
      (customer_email, customer_name, customer_phone, session_id, status, draft_order_id, checkout_url,
       subtotal, items, utm_source, utm_medium, utm_campaign, referrer, device_type, user_agent,
       session_duration_seconds)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      params.customerEmail || null,
      params.customerName || null,
      params.customerPhone || null,
      params.sessionId || null,
      params.draftOrderId,
      params.checkoutUrl,
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

export interface CheckoutFilters {
  days?: number;
  from?: string;
  to?: string;
  status?: 'pending' | 'abandoned' | 'converted';
  minSubtotal?: number;
  maxSubtotal?: number;
  search?: string;
  productHandle?: string;
}

export async function listAbandonedCheckouts(
  filters: CheckoutFilters,
  limit = 50,
  offset = 0
): Promise<{ checkouts: AbandonedCheckoutRecord[]; total: number }> {
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
    conditions.push(`(customer_email ILIKE $${params.length} OR customer_name ILIKE $${params.length})`);
  }

  if (filters.productHandle) {
    params.push(filters.productHandle);
    conditions.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements(items) elem WHERE elem->>'handle' = $${params.length})`
    );
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRows = (await db.query(
    `SELECT COUNT(*)::int AS total FROM abandoned_checkouts ${whereClause}`,
    params
  )) as Array<{ total: number }>;

  params.push(limit, offset);
  const rows = (await db.query(
    `SELECT * FROM abandoned_checkouts ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )) as AbandonedCheckoutRow[];

  return { checkouts: rows.map(toRecord), total: countRows[0]?.total ?? 0 };
}

// Polls Shopify for each still-pending checkout's draft order status: moves it
// to 'converted' if the draft order became a real order, or 'abandoned' once
// it's been sitting untouched past ABANDONED_AFTER_MINUTES.
export async function reconcilePendingCheckouts(): Promise<{
  checked: number;
  converted: number;
  abandoned: number;
}> {
  await ensureSchema();
  const db = sql();

  const pending = (await db.query(
    `SELECT * FROM abandoned_checkouts WHERE status = 'pending'`
  )) as AbandonedCheckoutRow[];

  let converted = 0;
  let abandoned = 0;

  for (const row of pending) {
    if (!row.draft_order_id) continue;

    try {
      const status = await getDraftOrderStatus(row.draft_order_id);

      if (status.orderId) {
        await db.query(
          `UPDATE abandoned_checkouts
             SET status = 'converted', shopify_order_id = $2, updated_at = now()
           WHERE id = $1`,
          [row.id, status.orderId]
        );
        converted += 1;
        continue;
      }
    } catch (error) {
      console.error(`[AbandonedCheckout] Failed to fetch draft order ${row.draft_order_id}:`, error);
    }

    const ageMinutes = (Date.now() - new Date(row.created_at).getTime()) / 60_000;
    if (ageMinutes >= ABANDONED_AFTER_MINUTES) {
      await db.query(
        `UPDATE abandoned_checkouts SET status = 'abandoned', updated_at = now() WHERE id = $1`,
        [row.id]
      );
      abandoned += 1;
    }
  }

  return { checked: pending.length, converted, abandoned };
}
