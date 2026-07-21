// Server-side analytics storage and reporting on Neon Postgres.
// Degrades to a no-op (with a single warning) when DATABASE_URL is unset so
// the storefront never depends on the analytics database being reachable.

import { neon } from '@neondatabase/serverless';
import { ANALYTICS_EVENTS, AnalyticsEventPayload } from '@/lib/analytics-events';

type Sql = ReturnType<typeof neon>;

let sqlClient: Sql | null | undefined;
let schemaReady: Promise<void> | null = null;
let warnedMissingDb = false;

function getSql(): Sql | null {
  if (sqlClient !== undefined) return sqlClient;
  const url = process.env.DATABASE_URL;
  if (!url) {
    sqlClient = null;
    return null;
  }
  sqlClient = neon(url);
  return sqlClient;
}

function warnMissingDb() {
  if (!warnedMissingDb) {
    warnedMissingDb = true;
    console.warn('Analytics: DATABASE_URL is not set — events are dropped.');
  }
}

async function ensureSchema(sql: Sql): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id BIGSERIAL PRIMARY KEY,
          ts TIMESTAMPTZ NOT NULL DEFAULT now(),
          event TEXT NOT NULL,
          visitor_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          path TEXT,
          referrer TEXT,
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          device TEXT,
          params JSONB
        )
      `;
      // Additive columns for richer reports; safe on an already-populated table.
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS landing_path TEXT`;
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS is_returning BOOLEAN`;
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS country TEXT`;
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS city TEXT`;

      await sql`CREATE INDEX IF NOT EXISTS analytics_events_event_ts_idx ON analytics_events (event, ts)`;
      await sql`CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON analytics_events (session_id)`;
      await sql`CREATE INDEX IF NOT EXISTS analytics_events_ts_idx ON analytics_events (ts)`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

const VALID_EVENTS = new Set<string>(ANALYTICS_EVENTS);
const MAX_TEXT = 512;

const clip = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value.slice(0, MAX_TEXT) : null;

export async function recordEvent(payload: AnalyticsEventPayload): Promise<boolean> {
  if (!VALID_EVENTS.has(payload.event)) return false;

  const sql = getSql();
  if (!sql) {
    warnMissingDb();
    return false;
  }

  try {
    await ensureSchema(sql);
    const params =
      payload.params && typeof payload.params === 'object'
        ? JSON.stringify(payload.params).slice(0, 8192)
        : null;
    await sql`
      INSERT INTO analytics_events
        (event, visitor_id, session_id, path, referrer, utm_source, utm_medium, utm_campaign,
         device, landing_path, is_returning, country, city, params)
      VALUES
        (${payload.event}, ${clip(payload.visitorId) ?? 'unknown'}, ${clip(payload.sessionId) ?? 'unknown'},
         ${clip(payload.path)}, ${clip(payload.referrer)}, ${clip(payload.utmSource)},
         ${clip(payload.utmMedium)}, ${clip(payload.utmCampaign)}, ${clip(payload.device)},
         ${clip(payload.landingPath)}, ${typeof payload.isReturning === 'boolean' ? payload.isReturning : null},
         ${clip(payload.country)}, ${clip(payload.city)}, ${params}::jsonb)
    `;
    return true;
  } catch (error) {
    console.error('Analytics: failed to record event', error);
    return false;
  }
}

/**
 * Record a server-originated event (webhooks) with no browser context.
 * `sessionId` may be supplied to attribute the event back to a browser session
 * (e.g. a purchase carrying the analytics session from checkout); it defaults to
 * 'server' when unknown.
 */
export async function recordServerEvent(
  event: AnalyticsEventPayload['event'],
  params: Record<string, unknown>,
  sessionId: string = 'server'
): Promise<boolean> {
  return recordEvent({ event, visitorId: 'server', sessionId, params });
}
// ============================================
// Report engine
// ============================================
//
// Every report accepts an explicit [start, end) window and is computed for both
// the selected window and the immediately-preceding equal-length window, so the
// dashboard can show period-over-period deltas.

export interface DateRange {
  /** Inclusive start (ISO). */
  start: string;
  /** Exclusive end (ISO). */
  end: string;
}

export interface ResolvedRange {
  range: DateRange;
  /** The preset key or 'custom'. */
  key: string;
  /** Human label for the header. */
  label: string;
}

/**
 * Resolve dashboard URL params into a concrete window.
 * `range` is a preset key ('today' | '7d' | '30d' | '90d' | '12m' | 'all' | 'custom').
 * For 'custom', `start`/`end` are YYYY-MM-DD (end is treated as inclusive day).
 */
export async function resolveRange(
  rangeKey: string | undefined,
  startParam: string | undefined,
  endParam: string | undefined
): Promise<ResolvedRange> {
  const now = new Date();
  const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

  const daysAgo = (n: number) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - n + 1));

  const key = rangeKey || '30d';

  if (key === 'custom' && startParam && endParam) {
    const start = new Date(`${startParam}T00:00:00.000Z`);
    // Make end exclusive by advancing one day.
    const endInclusive = new Date(`${endParam}T00:00:00.000Z`);
    const end = new Date(endInclusive.getTime() + 24 * 60 * 60 * 1000);
    const label = `${startParam} – ${endParam}`;
    return { range: { start: start.toISOString(), end: end.toISOString() }, key, label };
  }

  switch (key) {
    case 'today':
      return {
        range: { start: daysAgo(1).toISOString(), end: endOfToday.toISOString() },
        key,
        label: 'Today',
      };
    case '7d':
      return {
        range: { start: daysAgo(7).toISOString(), end: endOfToday.toISOString() },
        key,
        label: 'Last 7 days',
      };
    case '90d':
      return {
        range: { start: daysAgo(90).toISOString(), end: endOfToday.toISOString() },
        key,
        label: 'Last 90 days',
      };
    case '12m': {
      const start = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
      return {
        range: { start: start.toISOString(), end: endOfToday.toISOString() },
        key,
        label: 'Last 12 months',
      };
    }
    case 'all': {
      const earliest = await getEarliestEventDate();
      const start = earliest ?? daysAgo(30);
      return {
        range: { start: start.toISOString(), end: endOfToday.toISOString() },
        key,
        label: 'All time',
      };
    }
    case '30d':
    default:
      return {
        range: { start: daysAgo(30).toISOString(), end: endOfToday.toISOString() },
        key: '30d',
        label: 'Last 30 days',
      };
  }
}

export interface MetricWithDelta {
  value: number;
  previous: number;
  /** Percent change vs previous period; null when previous is 0. */
  deltaPct: number | null;
}

export interface TimePoint {
  bucket: string; // ISO date or datetime label
  value: number;
}

export interface SeriesMetric extends MetricWithDelta {
  series: TimePoint[];
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  /** Conversion from the previous stage (0..1); null for the first stage. */
  fromPrevious: number | null;
  /** Conversion from the top of the funnel (0..1). */
  fromTop: number;
}

export interface BreakdownRow {
  label: string;
  sessions: number;
  share: number; // 0..1 of total sessions in the breakdown
}

export interface ProductRow {
  handle: string;
  views: number;
  addToCarts: number;
  purchases: number;
  unitsSold: number;
  revenue: number;
}

export interface CheckoutErrorRow {
  ts: string;
  path: string | null;
  code: string | null;
  message: string | null;
}

export interface DashboardReport {
  available: boolean;
  range: DateRange;
  granularity: 'hour' | 'day' | 'week';
  // Headline metrics (each with previous-period comparison + sparkline series)
  sessions: SeriesMetric;
  visitors: SeriesMetric;
  productViews: SeriesMetric;
  addToCarts: SeriesMetric;
  checkouts: SeriesMetric;
  orders: SeriesMetric;
  revenue: SeriesMetric;
  averageOrderValue: MetricWithDelta;
  conversionRate: MetricWithDelta; // orders / sessions
  returningRate: MetricWithDelta; // returning sessions / sessions
  checkoutErrors: MetricWithDelta;
  // Primary time-series (sessions vs orders) for the overview chart
  overview: { sessions: TimePoint[]; orders: TimePoint[]; revenue: TimePoint[] };
  funnel: FunnelStage[];
  sources: BreakdownRow[];
  devices: BreakdownRow[];
  countries: BreakdownRow[];
  landingPages: BreakdownRow[];
  topProducts: ProductRow[];
  searchTerms: { term: string; count: number; zeroResults: number }[];
  newVsReturning: { newSessions: number; returningSessions: number };
  recentCheckoutErrors: CheckoutErrorRow[];
}

const FUNNEL_DEF: Array<{ key: string; label: string }> = [
  { key: 'page_view', label: 'Sessions' },
  { key: 'view_item', label: 'Product views' },
  { key: 'add_to_cart', label: 'Added to cart' },
  { key: 'begin_checkout', label: 'Reached checkout' },
  { key: 'purchase', label: 'Purchases' },
];

function pctChange(value: number, previous: number): number | null {
  if (previous === 0) return value === 0 ? 0 : null;
  return (value - previous) / previous;
}

/** Normalize a handle or title into a comparable key. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Turn a handle like "celestia-roller-shades" into "Celestia Roller Shades". */
function prettifyHandle(handle: string): string {
  return handle
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function chooseGranularity(rangeMs: number): 'hour' | 'day' | 'week' {
  const days = rangeMs / (24 * 60 * 60 * 1000);
  if (days <= 2) return 'hour';
  if (days <= 90) return 'day';
  return 'week';
}

function previousWindow(range: DateRange): DateRange {
  const start = new Date(range.start).getTime();
  const end = new Date(range.end).getTime();
  const span = end - start;
  return {
    start: new Date(start - span).toISOString(),
    end: new Date(start).toISOString(),
  };
}

/** Resolve the earliest event timestamp, for the "All time" range. */
export async function getEarliestEventDate(): Promise<Date | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    await ensureSchema(sql);
    const rows = (await sql`SELECT MIN(ts) AS min_ts FROM analytics_events`) as Array<{
      min_ts: string | null;
    }>;
    return rows[0]?.min_ts ? new Date(rows[0].min_ts) : null;
  } catch {
    return null;
  }
}

async function countInWindow(
  sql: Sql,
  range: DateRange,
  event: string,
  distinct: 'session' | 'visitor' | 'event'
): Promise<number> {
  let rows: Array<{ n: number }>;
  if (distinct === 'session') {
    rows = (await sql`
      SELECT COUNT(DISTINCT session_id)::int AS n FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end}
        AND event = ${event} AND session_id <> 'server'
    `) as Array<{ n: number }>;
  } else if (distinct === 'visitor') {
    rows = (await sql`
      SELECT COUNT(DISTINCT visitor_id)::int AS n FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end}
        AND event = ${event} AND visitor_id <> 'server'
    `) as Array<{ n: number }>;
  } else {
    rows = (await sql`
      SELECT COUNT(*)::int AS n FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end} AND event = ${event}
    `) as Array<{ n: number }>;
  }
  return rows[0]?.n ?? 0;
}

async function revenueInWindow(sql: Sql, range: DateRange): Promise<number> {
  const rows = (await sql`
    SELECT COALESCE(SUM((params->>'value')::numeric), 0)::float AS total
    FROM analytics_events
    WHERE ts >= ${range.start} AND ts < ${range.end} AND event = 'purchase'
  `) as Array<{ total: number }>;
  return rows[0]?.total ?? 0;
}

async function timeSeries(
  sql: Sql,
  range: DateRange,
  granularity: 'hour' | 'day' | 'week',
  event: string,
  agg: 'sessions' | 'events' | 'revenue'
): Promise<TimePoint[]> {
  const trunc = granularity;
  const fmt = granularity === 'hour' ? 'YYYY-MM-DD"T"HH24:00' : 'YYYY-MM-DD';
  let rows: Array<{ bucket: string; value: number }>;
  if (agg === 'sessions') {
    rows = (await sql`
      SELECT to_char(date_trunc(${trunc}, ts), ${fmt}) AS bucket,
             COUNT(DISTINCT session_id)::int AS value
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end}
        AND event = ${event} AND session_id <> 'server'
      GROUP BY 1 ORDER BY 1
    `) as Array<{ bucket: string; value: number }>;
  } else if (agg === 'revenue') {
    rows = (await sql`
      SELECT to_char(date_trunc(${trunc}, ts), ${fmt}) AS bucket,
             COALESCE(SUM((params->>'value')::numeric), 0)::float AS value
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end} AND event = ${event}
      GROUP BY 1 ORDER BY 1
    `) as Array<{ bucket: string; value: number }>;
  } else {
    rows = (await sql`
      SELECT to_char(date_trunc(${trunc}, ts), ${fmt}) AS bucket,
             COUNT(*)::int AS value
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end} AND event = ${event}
      GROUP BY 1 ORDER BY 1
    `) as Array<{ bucket: string; value: number }>;
  }
  return fillBuckets(rows, range, granularity);
}

/** Fill gaps so charts don't skip empty periods. */
function fillBuckets(
  rows: Array<{ bucket: string; value: number }>,
  range: DateRange,
  granularity: 'hour' | 'day' | 'week'
): TimePoint[] {
  const byBucket = new Map(rows.map((r) => [r.bucket, Number(r.value)]));
  const points: TimePoint[] = [];
  const start = new Date(range.start);
  const end = new Date(range.end);
  const cursor = new Date(start);

  const pad = (n: number) => String(n).padStart(2, '0');
  const keyOf = (d: Date) =>
    granularity === 'hour'
      ? `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`
      : `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

  // Align weekly cursor to Postgres date_trunc('week') (Monday) is complex;
  // for week granularity we simply emit whatever buckets exist, sorted.
  if (granularity === 'week') {
    return rows
      .map((r) => ({ bucket: r.bucket, value: Number(r.value) }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));
  }

  let guard = 0;
  while (cursor < end && guard < 5000) {
    const key = keyOf(cursor);
    points.push({ bucket: key, value: byBucket.get(key) ?? 0 });
    if (granularity === 'hour') cursor.setUTCHours(cursor.getUTCHours() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard++;
  }
  return points;
}

async function seriesMetric(
  sql: Sql,
  range: DateRange,
  prev: DateRange,
  granularity: 'hour' | 'day' | 'week',
  event: string,
  agg: 'sessions' | 'events' | 'revenue'
): Promise<SeriesMetric> {
  const distinct = agg === 'sessions' ? 'session' : 'event';
  const [value, previous, series] =
    agg === 'revenue'
      ? await Promise.all([
          revenueInWindow(sql, range),
          revenueInWindow(sql, prev),
          timeSeries(sql, range, granularity, event, 'revenue'),
        ])
      : await Promise.all([
          countInWindow(sql, range, event, distinct),
          countInWindow(sql, prev, event, distinct),
          timeSeries(sql, range, granularity, event, agg),
        ]);
  return { value, previous, deltaPct: pctChange(value, previous), series };
}

async function breakdown(
  sql: Sql,
  range: DateRange,
  dimension: 'source' | 'device' | 'country' | 'landing'
): Promise<BreakdownRow[]> {
  let rows: Array<{ label: string; sessions: number }>;
  if (dimension === 'device') {
    rows = (await sql`
      SELECT COALESCE(NULLIF(device, ''), 'unknown') AS label,
             COUNT(DISTINCT session_id)::int AS sessions
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end} AND session_id <> 'server'
      GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    `) as Array<{ label: string; sessions: number }>;
  } else if (dimension === 'country') {
    rows = (await sql`
      SELECT COALESCE(NULLIF(country, ''), 'Unknown') AS label,
             COUNT(DISTINCT session_id)::int AS sessions
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end} AND session_id <> 'server'
      GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    `) as Array<{ label: string; sessions: number }>;
  } else if (dimension === 'landing') {
    rows = (await sql`
      SELECT COALESCE(NULLIF(landing_path, ''), path, '/') AS label,
             COUNT(DISTINCT session_id)::int AS sessions
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end} AND session_id <> 'server'
      GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    `) as Array<{ label: string; sessions: number }>;
  } else {
    rows = (await sql`
      SELECT COALESCE(
               NULLIF(utm_source, ''),
               CASE WHEN referrer IS NULL OR referrer = '' THEN 'Direct' ELSE 'Referral' END
             ) AS label,
             COUNT(DISTINCT session_id)::int AS sessions
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end} AND session_id <> 'server'
      GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    `) as Array<{ label: string; sessions: number }>;
  }
  const total = rows.reduce((sum, r) => sum + r.sessions, 0) || 1;
  return rows.map((r) => ({ label: r.label, sessions: r.sessions, share: r.sessions / total }));
}

export async function getDashboardReport(range: DateRange): Promise<DashboardReport> {
  const empty: DashboardReport = {
    available: false,
    range,
    granularity: 'day',
    sessions: emptySeries(),
    visitors: emptySeries(),
    productViews: emptySeries(),
    addToCarts: emptySeries(),
    checkouts: emptySeries(),
    orders: emptySeries(),
    revenue: emptySeries(),
    averageOrderValue: emptyMetric(),
    conversionRate: emptyMetric(),
    returningRate: emptyMetric(),
    checkoutErrors: emptyMetric(),
    overview: { sessions: [], orders: [], revenue: [] },
    funnel: [],
    sources: [],
    devices: [],
    countries: [],
    landingPages: [],
    topProducts: [],
    searchTerms: [],
    newVsReturning: { newSessions: 0, returningSessions: 0 },
    recentCheckoutErrors: [],
  };

  const sql = getSql();
  if (!sql) {
    warnMissingDb();
    return empty;
  }

  try {
    await ensureSchema(sql);
    const prev = previousWindow(range);
    const rangeMs = new Date(range.end).getTime() - new Date(range.start).getTime();
    const granularity = chooseGranularity(rangeMs);

    const [
      sessions,
      visitors,
      productViews,
      addToCarts,
      checkouts,
      orders,
      revenue,
      sources,
      devices,
      countries,
      landingPages,
    ] = await Promise.all([
      seriesMetric(sql, range, prev, granularity, 'page_view', 'sessions'),
      seriesMetric(sql, range, prev, granularity, 'page_view', 'sessions').then(async () => {
        // visitors = distinct visitor_id on page_view
        const [value, previous, series] = await Promise.all([
          countInWindow(sql, range, 'page_view', 'visitor'),
          countInWindow(sql, prev, 'page_view', 'visitor'),
          timeSeries(sql, range, granularity, 'page_view', 'sessions'),
        ]);
        return { value, previous, deltaPct: pctChange(value, previous), series };
      }),
      seriesMetric(sql, range, prev, granularity, 'view_item', 'events'),
      seriesMetric(sql, range, prev, granularity, 'add_to_cart', 'events'),
      seriesMetric(sql, range, prev, granularity, 'begin_checkout', 'events'),
      seriesMetric(sql, range, prev, granularity, 'purchase', 'events'),
      seriesMetric(sql, range, prev, granularity, 'purchase', 'revenue'),
      breakdown(sql, range, 'source'),
      breakdown(sql, range, 'device'),
      breakdown(sql, range, 'country'),
      breakdown(sql, range, 'landing'),
    ]);

    // Funnel (event counts within the window)
    const funnelCounts = await Promise.all(
      FUNNEL_DEF.map(async ({ key }) =>
        key === 'page_view'
          ? countInWindow(sql, range, 'page_view', 'session')
          : countInWindow(sql, range, key, 'event')
      )
    );
    const top = funnelCounts[0] || 0;
    const funnel: FunnelStage[] = FUNNEL_DEF.map((def, i) => {
      const count = funnelCounts[i];
      const prevCount = i > 0 ? funnelCounts[i - 1] : null;
      return {
        key: def.key,
        label: def.label,
        count,
        fromPrevious: prevCount && prevCount > 0 ? count / prevCount : i === 0 ? null : 0,
        fromTop: top > 0 ? count / top : 0,
      };
    });

    // Derived metrics
    const aovValue = orders.value > 0 ? revenue.value / orders.value : 0;
    const aovPrev = orders.previous > 0 ? revenue.previous / orders.previous : 0;
    const convValue = sessions.value > 0 ? orders.value / sessions.value : 0;
    const convPrev = sessions.previous > 0 ? orders.previous / sessions.previous : 0;

    // Returning rate
    const returningRows = (await sql`
      SELECT
        COUNT(DISTINCT session_id) FILTER (WHERE is_returning IS TRUE)::int AS returning,
        COUNT(DISTINCT session_id)::int AS total
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end} AND session_id <> 'server'
    `) as Array<{ returning: number; total: number }>;
    const returningRowsPrev = (await sql`
      SELECT
        COUNT(DISTINCT session_id) FILTER (WHERE is_returning IS TRUE)::int AS returning,
        COUNT(DISTINCT session_id)::int AS total
      FROM analytics_events
      WHERE ts >= ${prev.start} AND ts < ${prev.end} AND session_id <> 'server'
    `) as Array<{ returning: number; total: number }>;
    const retTotal = returningRows[0]?.total ?? 0;
    const retReturning = returningRows[0]?.returning ?? 0;
    const retTotalPrev = returningRowsPrev[0]?.total ?? 0;
    const retReturningPrev = returningRowsPrev[0]?.returning ?? 0;
    const returningRateValue = retTotal > 0 ? retReturning / retTotal : 0;
    const returningRatePrev = retTotalPrev > 0 ? retReturningPrev / retTotalPrev : 0;

    // Checkout errors
    const errValue = await countInWindow(sql, range, 'checkout_error', 'event');
    const errPrev = await countInWindow(sql, prev, 'checkout_error', 'event');

    // Top products (views/add-to-cart from client events; units/revenue from purchase items)
    const productViewRows = (await sql`
      SELECT params->>'handle' AS handle,
             COUNT(*) FILTER (WHERE event = 'view_item')::int AS views,
             COUNT(*) FILTER (WHERE event = 'add_to_cart')::int AS add_to_carts
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end}
        AND event IN ('view_item', 'add_to_cart')
        AND params->>'handle' IS NOT NULL
      GROUP BY 1
    `) as Array<{ handle: string; views: number; add_to_carts: number }>;
    const purchaseItemRows = (await sql`
      SELECT item->>'title' AS title,
             SUM((item->>'quantity')::int)::int AS units,
             SUM((item->>'quantity')::int * (item->>'price')::numeric)::float AS revenue,
             COUNT(DISTINCT id)::int AS orders
      FROM analytics_events, jsonb_array_elements(params->'items') AS item
      WHERE ts >= ${range.start} AND ts < ${range.end}
        AND event = 'purchase' AND params ? 'items'
      GROUP BY 1
    `) as Array<{ title: string; units: number; revenue: number; orders: number }>;

    // Views/carts are keyed by handle; purchase items by title. Normalize both
    // to a slug so a product is a single row combining its funnel + sales.
    const productMap = new Map<string, ProductRow>();
    for (const r of productViewRows) {
      const key = slugify(r.handle);
      productMap.set(key, {
        handle: prettifyHandle(r.handle),
        views: r.views,
        addToCarts: r.add_to_carts,
        purchases: 0,
        unitsSold: 0,
        revenue: 0,
      });
    }
    for (const r of purchaseItemRows) {
      const key = slugify(r.title || 'unknown');
      const existing = productMap.get(key);
      if (existing) {
        existing.purchases = r.orders;
        existing.unitsSold = r.units;
        existing.revenue = r.revenue;
        // Prefer the human title from the order.
        if (r.title) existing.handle = r.title;
      } else {
        productMap.set(key, {
          handle: r.title || 'Unknown',
          views: 0,
          addToCarts: 0,
          purchases: r.orders,
          unitsSold: r.units,
          revenue: r.revenue,
        });
      }
    }
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.revenue - a.revenue || b.views - a.views)
      .slice(0, 15);

    // Search terms
    const searchRows = (await sql`
      SELECT params->>'query' AS term,
             COUNT(*)::int AS count,
             COUNT(*) FILTER (WHERE (params->>'resultCount')::int = 0)::int AS zero_results
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end}
        AND event = 'search' AND params->>'query' IS NOT NULL AND params->>'query' <> ''
      GROUP BY 1 ORDER BY 2 DESC LIMIT 15
    `) as Array<{ term: string; count: number; zero_results: number }>;

    // Recent checkout errors
    const recentErrorRows = (await sql`
      SELECT to_char(ts, 'YYYY-MM-DD HH24:MI') AS ts, path,
             params->>'code' AS code, params->>'message' AS message
      FROM analytics_events
      WHERE event = 'checkout_error' AND ts >= ${range.start} AND ts < ${range.end}
      ORDER BY ts DESC LIMIT 25
    `) as Array<{ ts: string; path: string | null; code: string | null; message: string | null }>;

    return {
      available: true,
      range,
      granularity,
      sessions,
      visitors,
      productViews,
      addToCarts,
      checkouts,
      orders,
      revenue,
      averageOrderValue: { value: aovValue, previous: aovPrev, deltaPct: pctChange(aovValue, aovPrev) },
      conversionRate: { value: convValue, previous: convPrev, deltaPct: pctChange(convValue, convPrev) },
      returningRate: {
        value: returningRateValue,
        previous: returningRatePrev,
        deltaPct: pctChange(returningRateValue, returningRatePrev),
      },
      checkoutErrors: { value: errValue, previous: errPrev, deltaPct: pctChange(errValue, errPrev) },
      overview: {
        sessions: sessions.series,
        orders: orders.series,
        revenue: revenue.series,
      },
      funnel,
      sources,
      devices,
      countries,
      landingPages,
      topProducts,
      searchTerms: searchRows.map((r) => ({
        term: r.term,
        count: r.count,
        zeroResults: r.zero_results,
      })),
      newVsReturning: {
        newSessions: Math.max(retTotal - retReturning, 0),
        returningSessions: retReturning,
      },
      recentCheckoutErrors: recentErrorRows,
    };
  } catch (error) {
    console.error('Analytics: dashboard report failed', error);
    return empty;
  }
}

function emptySeries(): SeriesMetric {
  return { value: 0, previous: 0, deltaPct: null, series: [] };
}
function emptyMetric(): MetricWithDelta {
  return { value: 0, previous: 0, deltaPct: null };
}

// ============================================
// Abandonment report
// ============================================
//
// Definitions (session-scoped, within the selected window):
//   Abandoned cart     = a session with add_to_cart but no begin_checkout.
//   Abandoned checkout = a session with begin_checkout but no purchase.
// "Recovered" counts sessions that reached the next stage; the recovery rate is
// the complement of the abandonment rate.

export interface AbandonmentStage {
  /** Sessions that entered this stage. */
  entered: number;
  /** Sessions that advanced to the next stage. */
  advanced: number;
  /** Sessions that abandoned (entered but did not advance). */
  abandoned: MetricWithDelta;
  /** abandoned / entered (0..1). */
  rate: number;
  /** Total potential value left behind, from the stage's events. */
  lostValue: number;
}

export interface AbandonedSessionRow {
  sessionId: string;
  lastSeen: string;
  device: string | null;
  country: string | null;
  source: string;
  itemCount: number | null;
  cartValue: number | null;
  /** Product handles seen in the session's cart events. */
  products: string[];
}

export interface AbandonmentReport {
  available: boolean;
  range: DateRange;
  cart: AbandonmentStage;
  checkout: AbandonmentStage;
  /** Abandonment by traffic source (checkout stage). */
  bySource: { label: string; abandoned: number; rate: number }[];
  /** Abandonment by device (checkout stage). */
  byDevice: { label: string; abandoned: number; rate: number }[];
  abandonedCarts: AbandonedSessionRow[];
  abandonedCheckouts: AbandonedSessionRow[];
}

/** Distinct sessions that fired `event` but never fired `notEvent`, in-window. */
async function abandonedSessionCount(
  sql: Sql,
  range: DateRange,
  event: string,
  notEvent: string
): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS n FROM (
      SELECT DISTINCT session_id
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end}
        AND event = ${event} AND session_id <> 'server'
    ) entered
    WHERE session_id NOT IN (
      SELECT DISTINCT session_id FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end}
        AND event = ${notEvent} AND session_id <> 'server'
    )
  `) as Array<{ n: number }>;
  return rows[0]?.n ?? 0;
}

/** Sessions that fired `event` at all (distinct), in-window. */
async function stageEnteredCount(sql: Sql, range: DateRange, event: string): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(DISTINCT session_id)::int AS n FROM analytics_events
    WHERE ts >= ${range.start} AND ts < ${range.end}
      AND event = ${event} AND session_id <> 'server'
  `) as Array<{ n: number }>;
  return rows[0]?.n ?? 0;
}

/** Detail rows for abandoned sessions (entered `event`, never `notEvent`). */
async function abandonedSessionRows(
  sql: Sql,
  range: DateRange,
  event: string,
  notEvent: string
): Promise<AbandonedSessionRow[]> {
  const rows = (await sql`
    WITH abandoned AS (
      SELECT DISTINCT session_id
      FROM analytics_events
      WHERE ts >= ${range.start} AND ts < ${range.end}
        AND event = ${event} AND session_id <> 'server'
        AND session_id NOT IN (
          SELECT DISTINCT session_id FROM analytics_events
          WHERE ts >= ${range.start} AND ts < ${range.end}
            AND event = ${notEvent} AND session_id <> 'server'
        )
    )
    SELECT
      e.session_id,
      to_char(MAX(e.ts), 'YYYY-MM-DD HH24:MI') AS last_seen,
      (ARRAY_AGG(e.device ORDER BY e.ts DESC) FILTER (WHERE e.device IS NOT NULL))[1] AS device,
      (ARRAY_AGG(e.country ORDER BY e.ts DESC) FILTER (WHERE e.country IS NOT NULL))[1] AS country,
      (ARRAY_AGG(e.utm_source ORDER BY e.ts DESC) FILTER (WHERE e.utm_source IS NOT NULL))[1] AS utm_source,
      (ARRAY_AGG(e.referrer ORDER BY e.ts DESC) FILTER (WHERE e.referrer IS NOT NULL))[1] AS referrer,
      -- Item count: from a real itemCount if present, else the number of
      -- add_to_cart events in the session.
      COALESCE(
        MAX((e.params->>'itemCount')::int),
        NULLIF(COUNT(*) FILTER (WHERE e.event = 'add_to_cart')::int, 0)
      ) AS item_count,
      -- Prefer a real cartValue (begin_checkout/view_cart); otherwise sum the
      -- per-item add_to_cart prices so cart-stage rows still show a value.
      COALESCE(
        MAX((e.params->>'cartValue')::numeric),
        SUM((e.params->>'price')::numeric) FILTER (WHERE e.event = 'add_to_cart')
      ) AS cart_value,
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT e.params->>'handle'), NULL) AS products
    FROM analytics_events e
    JOIN abandoned a ON a.session_id = e.session_id
    WHERE e.ts >= ${range.start} AND e.ts < ${range.end}
    GROUP BY e.session_id
    ORDER BY MAX(e.ts) DESC
    LIMIT 100
  `) as Array<{
    session_id: string;
    last_seen: string;
    device: string | null;
    country: string | null;
    utm_source: string | null;
    referrer: string | null;
    item_count: number | null;
    cart_value: number | null;
    products: string[] | null;
  }>;

  return rows.map((r) => ({
    sessionId: r.session_id,
    lastSeen: r.last_seen,
    device: r.device,
    country: r.country,
    source: r.utm_source || (r.referrer ? 'Referral' : 'Direct'),
    itemCount: r.item_count,
    cartValue: r.cart_value != null ? Number(r.cart_value) : null,
    products: (r.products ?? []).filter(Boolean),
  }));
}

/**
 * Sum of value left behind by abandoned sessions of a stage.
 * - Cart stage (add_to_cart): sum each session's per-item `price` across its
 *   add-to-cart events (no running cart total is carried on those events).
 * - Checkout stage (begin_checkout): take each session's max `cartValue`.
 */
async function abandonedLostValue(
  sql: Sql,
  range: DateRange,
  event: string,
  notEvent: string
): Promise<number> {
  let rows: Array<{ total: number }>;
  if (event === 'add_to_cart') {
    rows = (await sql`
      WITH abandoned AS (
        SELECT DISTINCT session_id
        FROM analytics_events
        WHERE ts >= ${range.start} AND ts < ${range.end}
          AND event = ${event} AND session_id <> 'server'
          AND session_id NOT IN (
            SELECT DISTINCT session_id FROM analytics_events
            WHERE ts >= ${range.start} AND ts < ${range.end}
              AND event = ${notEvent} AND session_id <> 'server'
          )
      )
      SELECT COALESCE(SUM((e.params->>'price')::numeric), 0)::float AS total
      FROM analytics_events e
      JOIN abandoned a ON a.session_id = e.session_id
      WHERE e.ts >= ${range.start} AND e.ts < ${range.end}
        AND e.event = 'add_to_cart'
    `) as Array<{ total: number }>;
  } else {
    rows = (await sql`
      WITH abandoned AS (
        SELECT DISTINCT session_id
        FROM analytics_events
        WHERE ts >= ${range.start} AND ts < ${range.end}
          AND event = ${event} AND session_id <> 'server'
          AND session_id NOT IN (
            SELECT DISTINCT session_id FROM analytics_events
            WHERE ts >= ${range.start} AND ts < ${range.end}
              AND event = ${notEvent} AND session_id <> 'server'
          )
      )
      SELECT COALESCE(SUM(max_val), 0)::float AS total FROM (
        SELECT e.session_id, MAX((e.params->>'cartValue')::numeric) AS max_val
        FROM analytics_events e
        JOIN abandoned a ON a.session_id = e.session_id
        WHERE e.ts >= ${range.start} AND e.ts < ${range.end}
          AND e.event = ${event}
        GROUP BY e.session_id
      ) s
    `) as Array<{ total: number }>;
  }
  return rows[0]?.total ?? 0;
}

/** Abandonment broken down by a session dimension (source or device). */
async function abandonmentByDimension(
  sql: Sql,
  range: DateRange,
  event: string,
  notEvent: string,
  dimension: 'source' | 'device'
): Promise<{ label: string; abandoned: number; rate: number }[]> {
  // Attribute each session to its latest dimension value, then bucket.
  // Two static queries (rather than an interpolated column expression) keep the
  // SQL parameterized safely and match the pattern used elsewhere in this file.
  let rows: Array<{ label: string; abandoned: number; entered: number }>;
  if (dimension === 'device') {
    rows = (await sql`
      WITH stage AS (
        SELECT
          session_id,
          (ARRAY_AGG(device ORDER BY ts DESC) FILTER (WHERE device IS NOT NULL))[1] AS latest_device,
          BOOL_OR(event = ${notEvent}) AS advanced
        FROM analytics_events
        WHERE ts >= ${range.start} AND ts < ${range.end} AND session_id <> 'server'
          AND event IN (${event}, ${notEvent})
        GROUP BY session_id
        HAVING BOOL_OR(event = ${event})
      )
      SELECT COALESCE(NULLIF(latest_device, ''), 'unknown') AS label,
             COUNT(*) FILTER (WHERE NOT advanced)::int AS abandoned,
             COUNT(*)::int AS entered
      FROM stage
      GROUP BY 1 ORDER BY 2 DESC LIMIT 8
    `) as Array<{ label: string; abandoned: number; entered: number }>;
  } else {
    rows = (await sql`
      WITH stage AS (
        SELECT
          session_id,
          (ARRAY_AGG(utm_source ORDER BY ts DESC) FILTER (WHERE utm_source IS NOT NULL))[1] AS latest_source,
          (ARRAY_AGG(referrer ORDER BY ts DESC) FILTER (WHERE referrer IS NOT NULL))[1] AS latest_referrer,
          BOOL_OR(event = ${notEvent}) AS advanced
        FROM analytics_events
        WHERE ts >= ${range.start} AND ts < ${range.end} AND session_id <> 'server'
          AND event IN (${event}, ${notEvent})
        GROUP BY session_id
        HAVING BOOL_OR(event = ${event})
      )
      SELECT COALESCE(
               NULLIF(latest_source, ''),
               CASE WHEN latest_referrer IS NULL OR latest_referrer = '' THEN 'Direct' ELSE 'Referral' END
             ) AS label,
             COUNT(*) FILTER (WHERE NOT advanced)::int AS abandoned,
             COUNT(*)::int AS entered
      FROM stage
      GROUP BY 1 ORDER BY 2 DESC LIMIT 8
    `) as Array<{ label: string; abandoned: number; entered: number }>;
  }

  return rows.map((r) => ({
    label: r.label,
    abandoned: r.abandoned,
    rate: r.entered > 0 ? r.abandoned / r.entered : 0,
  }));
}

export async function getAbandonmentReport(range: DateRange): Promise<AbandonmentReport> {
  const emptyStage = (): AbandonmentStage => ({
    entered: 0,
    advanced: 0,
    abandoned: emptyMetric(),
    rate: 0,
    lostValue: 0,
  });
  const empty: AbandonmentReport = {
    available: false,
    range,
    cart: emptyStage(),
    checkout: emptyStage(),
    bySource: [],
    byDevice: [],
    abandonedCarts: [],
    abandonedCheckouts: [],
  };

  const sql = getSql();
  if (!sql) {
    warnMissingDb();
    return empty;
  }

  try {
    await ensureSchema(sql);
    const prev = previousWindow(range);

    const [
      cartEntered,
      cartAdvanced,
      cartAbandoned,
      cartAbandonedPrev,
      cartLost,
      cartRows,
      checkoutEntered,
      checkoutAdvanced,
      checkoutAbandoned,
      checkoutAbandonedPrev,
      checkoutLost,
      checkoutRows,
      bySource,
      byDevice,
    ] = await Promise.all([
      stageEnteredCount(sql, range, 'add_to_cart'),
      stageEnteredCount(sql, range, 'begin_checkout'),
      abandonedSessionCount(sql, range, 'add_to_cart', 'begin_checkout'),
      abandonedSessionCount(sql, prev, 'add_to_cart', 'begin_checkout'),
      abandonedLostValue(sql, range, 'add_to_cart', 'begin_checkout'),
      abandonedSessionRows(sql, range, 'add_to_cart', 'begin_checkout'),
      stageEnteredCount(sql, range, 'begin_checkout'),
      stageEnteredCount(sql, range, 'purchase'),
      abandonedSessionCount(sql, range, 'begin_checkout', 'purchase'),
      abandonedSessionCount(sql, prev, 'begin_checkout', 'purchase'),
      abandonedLostValue(sql, range, 'begin_checkout', 'purchase'),
      abandonedSessionRows(sql, range, 'begin_checkout', 'purchase'),
      abandonmentByDimension(sql, range, 'begin_checkout', 'purchase', 'source'),
      abandonmentByDimension(sql, range, 'begin_checkout', 'purchase', 'device'),
    ]);

    return {
      available: true,
      range,
      cart: {
        entered: cartEntered,
        advanced: cartAdvanced,
        abandoned: {
          value: cartAbandoned,
          previous: cartAbandonedPrev,
          deltaPct: pctChange(cartAbandoned, cartAbandonedPrev),
        },
        rate: cartEntered > 0 ? cartAbandoned / cartEntered : 0,
        lostValue: cartLost,
      },
      checkout: {
        entered: checkoutEntered,
        advanced: checkoutAdvanced,
        abandoned: {
          value: checkoutAbandoned,
          previous: checkoutAbandonedPrev,
          deltaPct: pctChange(checkoutAbandoned, checkoutAbandonedPrev),
        },
        rate: checkoutEntered > 0 ? checkoutAbandoned / checkoutEntered : 0,
        lostValue: checkoutLost,
      },
      bySource,
      byDevice,
      abandonedCarts: cartRows,
      abandonedCheckouts: checkoutRows,
    };
  } catch (error) {
    console.error('Analytics: abandonment report failed', error);
    return empty;
  }
}

// ============================================
// Session detail (for "View details" on an abandoned row)
// ============================================

export interface SessionEvent {
  ts: string;
  event: string;
  path: string | null;
  params: Record<string, unknown> | null;
}

export interface SessionSummary {
  sessionId: string;
  visitorId: string;
  firstSeen: string;
  lastSeen: string;
  device: string | null;
  country: string | null;
  city: string | null;
  landingPath: string | null;
  referrer: string | null;
  source: string;
  isReturning: boolean;
  reachedCheckout: boolean;
  purchased: boolean;
}

export interface SessionProduct {
  handle: string;
  name: string;
  url: string;
  viewed: boolean;
  addedToCart: boolean;
  purchased: boolean;
  /** Latest known price for this product in the session, if any. */
  price: number | null;
  quantity: number | null;
}

export interface SessionDetail {
  available: boolean;
  found: boolean;
  summary: SessionSummary | null;
  products: SessionProduct[];
  events: SessionEvent[];
}

/** Derive the distinct products a session touched, in first-seen order. */
function deriveSessionProducts(
  events: Array<{ event: string; params: Record<string, unknown> | null }>
): SessionProduct[] {
  const byHandle = new Map<string, SessionProduct>();

  for (const e of events) {
    const params = e.params ?? {};
    const rawHandle = typeof params.handle === 'string' ? params.handle : null;

    if (rawHandle && (e.event === 'view_item' || e.event === 'add_to_cart' || e.event === 'price_calculated')) {
      const existing = byHandle.get(rawHandle) ?? {
        handle: rawHandle,
        name: prettifyHandle(rawHandle),
        url: `/product/${rawHandle}`,
        viewed: false,
        addedToCart: false,
        purchased: false,
        price: null,
        quantity: null,
      };
      if (e.event === 'view_item') existing.viewed = true;
      if (e.event === 'add_to_cart') {
        existing.addedToCart = true;
        existing.quantity = (existing.quantity ?? 0) + 1;
      }
      const price = params.price ?? params.priceFrom;
      if (typeof price === 'number') existing.price = price;
      byHandle.set(rawHandle, existing);
    }

    // A purchase carries a line-item title (see orders-paid webhook), not a
    // handle — match it to a product already seen in-session by slugified name.
    if (e.event === 'purchase' && Array.isArray(params.items)) {
      for (const item of params.items as Array<{ title?: string; quantity?: number; price?: number }>) {
        const title = item.title;
        if (!title) continue;
        const key = slugify(title);
        const match = [...byHandle.values()].find((p) => slugify(p.handle) === key || slugify(p.name) === key);
        if (match) {
          match.purchased = true;
          if (item.quantity) match.quantity = item.quantity;
          if (item.price) match.price = item.price;
        } else {
          byHandle.set(key, {
            handle: key,
            name: title,
            url: `/product/${key}`,
            viewed: false,
            addedToCart: false,
            purchased: true,
            price: item.price ?? null,
            quantity: item.quantity ?? null,
          });
        }
      }
    }
  }

  return [...byHandle.values()];
}

/**
 * Full event timeline for one session, for the abandonment tables' "View
 * details" link. Looks across all time (not just the report's date range) so
 * a session spanning a range boundary still shows completely.
 */
export async function getSessionTimeline(sessionId: string): Promise<SessionDetail> {
  const empty: SessionDetail = { available: false, found: false, summary: null, products: [], events: [] };

  const sql = getSql();
  if (!sql) {
    warnMissingDb();
    return empty;
  }
  if (!sessionId || sessionId === 'server') {
    return { ...empty, available: true, found: false };
  }

  try {
    await ensureSchema(sql);

    const eventRows = (await sql`
      SELECT to_char(ts, 'YYYY-MM-DD HH24:MI:SS') AS ts, event, path, params
      FROM analytics_events
      WHERE session_id = ${sessionId}
      ORDER BY ts ASC
      LIMIT 200
    `) as Array<{ ts: string; event: string; path: string | null; params: Record<string, unknown> | null }>;

    if (eventRows.length === 0) {
      return { ...empty, available: true, found: false };
    }

    const summaryRows = (await sql`
      SELECT
        MIN(ts) AS first_ts, MAX(ts) AS last_ts,
        (ARRAY_AGG(visitor_id ORDER BY ts DESC))[1] AS visitor_id,
        (ARRAY_AGG(device ORDER BY ts DESC) FILTER (WHERE device IS NOT NULL))[1] AS device,
        (ARRAY_AGG(country ORDER BY ts DESC) FILTER (WHERE country IS NOT NULL))[1] AS country,
        (ARRAY_AGG(city ORDER BY ts DESC) FILTER (WHERE city IS NOT NULL))[1] AS city,
        (ARRAY_AGG(landing_path ORDER BY ts ASC) FILTER (WHERE landing_path IS NOT NULL))[1] AS landing_path,
        (ARRAY_AGG(referrer ORDER BY ts DESC) FILTER (WHERE referrer IS NOT NULL))[1] AS referrer,
        (ARRAY_AGG(utm_source ORDER BY ts DESC) FILTER (WHERE utm_source IS NOT NULL))[1] AS utm_source,
        BOOL_OR(is_returning) AS is_returning,
        BOOL_OR(event = 'begin_checkout') AS reached_checkout
      FROM analytics_events
      WHERE session_id = ${sessionId}
    `) as Array<{
      first_ts: string;
      last_ts: string;
      visitor_id: string;
      device: string | null;
      country: string | null;
      city: string | null;
      landing_path: string | null;
      referrer: string | null;
      utm_source: string | null;
      is_returning: boolean | null;
      reached_checkout: boolean;
    }>;

    // A purchase carries this session_id directly only when the checkout
    // successfully threaded it through (see order.service.ts); check for that.
    const purchaseRows = (await sql`
      SELECT COUNT(*)::int AS n FROM analytics_events
      WHERE session_id = ${sessionId} AND event = 'purchase'
    `) as Array<{ n: number }>;

    const s = summaryRows[0];
    const summary: SessionSummary = {
      sessionId,
      visitorId: s.visitor_id,
      firstSeen: new Date(s.first_ts).toISOString(),
      lastSeen: new Date(s.last_ts).toISOString(),
      device: s.device,
      country: s.country,
      city: s.city,
      landingPath: s.landing_path,
      referrer: s.referrer,
      source: s.utm_source || (s.referrer ? 'Referral' : 'Direct'),
      isReturning: Boolean(s.is_returning),
      reachedCheckout: s.reached_checkout,
      purchased: (purchaseRows[0]?.n ?? 0) > 0,
    };

    return {
      available: true,
      found: true,
      summary,
      products: deriveSessionProducts(eventRows),
      events: eventRows.map((r) => ({
        ts: r.ts,
        event: r.event,
        path: r.path,
        params: r.params,
      })),
    };
  } catch (error) {
    console.error('Analytics: session timeline failed', error);
    return { ...empty, available: true };
  }
}
