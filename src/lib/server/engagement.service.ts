import { ensureSchema, sql } from './db';

/**
 * Time-on-site reporting, built on the `page_views` table.
 *
 * Two clocks are tracked per page view:
 *  - `engaged_seconds` counts only while the tab was visible AND the visitor
 *    interacted within the last minute. This is the headline "time on site".
 *  - `active_seconds` is wall clock from page entry to the last heartbeat,
 *    which includes time the tab sat in the background.
 *
 * A "session" is a visit: the client rolls its session id after 30 minutes of
 * inactivity, so session-level numbers here are per-visit, not per-browser.
 */

/** A session shorter than this with a single page view counts as a bounce. */
const BOUNCE_ENGAGED_SECONDS = 10;

export interface EngagementFilters {
  days?: number;
  from?: string;
  to?: string;
  deviceType?: string;
  source?: string;
}

export interface EngagementStats {
  sessions: number;
  visitors: number;
  pageViews: number;
  totalEngagedSeconds: number;
  avgSessionSeconds: number;
  medianSessionSeconds: number;
  avgPageSeconds: number;
  pagesPerSession: number;
  bounceRate: number;
  engagementRate: number;
}

export interface DurationBucket {
  label: string;
  sessions: number;
}

export interface PageEngagementRow {
  path: string;
  pageType: string | null;
  pageViews: number;
  sessions: number;
  avgEngagedSeconds: number;
  totalEngagedSeconds: number;
  avgScrollPercent: number | null;
  exitRate: number;
}

export interface BreakdownRow {
  label: string;
  sessions: number;
  pageViews: number;
  avgSessionSeconds: number;
  totalEngagedSeconds: number;
}

export interface DailyEngagementRow {
  date: string;
  sessions: number;
  visitors: number;
  pageViews: number;
  avgSessionSeconds: number;
  totalEngagedSeconds: number;
  bounceRate: number;
}

export interface SessionRow {
  sessionId: string;
  visitorId: string | null;
  startedAt: string;
  endedAt: string;
  engagedSeconds: number;
  activeSeconds: number;
  pageViews: number;
  entryPath: string;
  exitPath: string;
  deviceType: string | null;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  addedToCart: boolean;
  reachedCheckout: boolean;
}

export interface PageViewRow {
  createdAt: string;
  updatedAt: string;
  sessionId: string;
  visitorId: string | null;
  path: string;
  pageTitle: string | null;
  pageType: string | null;
  engagedSeconds: number;
  activeSeconds: number;
  maxScrollPercent: number | null;
  isExit: boolean;
  deviceType: string | null;
  utmSource: string | null;
  referrer: string | null;
}

export interface PageViewInput {
  pageViewId: string;
  sessionId: string;
  visitorId?: string | null;
  path: string;
  pageTitle?: string | null;
  pageType?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  deviceType?: string | null;
  engagedSeconds: number;
  activeSeconds: number;
  maxScrollPercent?: number | null;
  isExit?: boolean;
}

/**
 * Upserts a page view from a heartbeat. Heartbeats carry cumulative totals, and
 * every counter is merged with GREATEST, so a duplicated, retried or
 * out-of-order beacon can never inflate or roll back the numbers.
 */
export async function recordPageView(input: PageViewInput): Promise<void> {
  await ensureSchema();
  const db = sql();

  await db.query(
    `INSERT INTO page_views
      (page_view_id, session_id, visitor_id, path, page_title, page_type, referrer,
       utm_source, utm_medium, utm_campaign, device_type,
       engaged_seconds, active_seconds, max_scroll_percent, is_exit)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (page_view_id) DO UPDATE SET
       engaged_seconds = GREATEST(page_views.engaged_seconds, EXCLUDED.engaged_seconds),
       active_seconds = GREATEST(page_views.active_seconds, EXCLUDED.active_seconds),
       max_scroll_percent = GREATEST(
         COALESCE(page_views.max_scroll_percent, 0),
         COALESCE(EXCLUDED.max_scroll_percent, 0)
       ),
       is_exit = page_views.is_exit OR EXCLUDED.is_exit,
       updated_at = now()`,
    [
      input.pageViewId,
      input.sessionId,
      input.visitorId || null,
      input.path,
      input.pageTitle || null,
      input.pageType || null,
      input.referrer || null,
      input.utmSource || null,
      input.utmMedium || null,
      input.utmCampaign || null,
      input.deviceType || null,
      input.engagedSeconds,
      input.activeSeconds,
      input.maxScrollPercent ?? null,
      input.isExit ?? false,
    ]
  );
}

/**
 * Builds the shared WHERE clause. Mirrors the date convention used by
 * events.service / abandoned-cart.service: an explicit from/to pair is
 * inclusive of the whole `to` day, otherwise it's a rolling N-day window.
 */
function buildWhere(filters: EngagementFilters): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.from && filters.to) {
    params.push(filters.from, filters.to);
    conditions.push(
      `created_at >= $${params.length - 1}::timestamptz AND created_at < ($${params.length}::timestamptz + interval '1 day')`
    );
  } else {
    params.push(filters.days ?? 30);
    conditions.push(`created_at >= now() - ($${params.length} || ' days')::interval`);
  }

  if (filters.deviceType) {
    params.push(filters.deviceType);
    conditions.push(`device_type = $${params.length}`);
  }

  if (filters.source) {
    params.push(filters.source);
    conditions.push(`COALESCE(NULLIF(utm_source, ''), 'direct') = $${params.length}`);
  }

  return { clause: `WHERE ${conditions.join(' AND ')}`, params };
}

/** Per-session rollup, the basis of every session-level metric below. */
function sessionCte(where: string): string {
  return `
    WITH session_totals AS (
      SELECT session_id,
             MAX(visitor_id) AS visitor_id,
             SUM(engaged_seconds)::int AS engaged_seconds,
             SUM(active_seconds)::int AS active_seconds,
             COUNT(*)::int AS page_views,
             MIN(created_at) AS started_at,
             MAX(updated_at) AS ended_at
        FROM page_views
        ${where}
       GROUP BY session_id
    )`;
}

export async function getEngagementStats(filters: EngagementFilters): Promise<EngagementStats> {
  await ensureSchema();
  const db = sql();
  const { clause, params } = buildWhere(filters);

  const rows = (await db.query(
    `${sessionCte(clause)}
     SELECT
       COUNT(*)::int AS sessions,
       COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS visitors,
       COALESCE(SUM(page_views), 0)::int AS page_views,
       COALESCE(SUM(engaged_seconds), 0)::bigint AS total_engaged_seconds,
       COALESCE(AVG(engaged_seconds), 0) AS avg_session_seconds,
       COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY engaged_seconds), 0) AS median_session_seconds,
       COUNT(*) FILTER (WHERE page_views = 1 AND engaged_seconds < ${BOUNCE_ENGAGED_SECONDS})::int AS bounced,
       COUNT(*) FILTER (WHERE page_views > 1 OR engaged_seconds >= ${BOUNCE_ENGAGED_SECONDS})::int AS engaged
       FROM session_totals`,
    params
  )) as Array<{
    sessions: number;
    visitors: number;
    page_views: number;
    total_engaged_seconds: string;
    avg_session_seconds: string;
    median_session_seconds: string;
    bounced: number;
    engaged: number;
  }>;

  const row = rows[0];
  const sessions = row?.sessions ?? 0;
  const pageViews = row?.page_views ?? 0;
  const totalEngagedSeconds = Number(row?.total_engaged_seconds ?? 0);

  return {
    sessions,
    visitors: row?.visitors ?? 0,
    pageViews,
    totalEngagedSeconds,
    avgSessionSeconds: Math.round(Number(row?.avg_session_seconds ?? 0)),
    medianSessionSeconds: Math.round(Number(row?.median_session_seconds ?? 0)),
    avgPageSeconds: pageViews > 0 ? Math.round(totalEngagedSeconds / pageViews) : 0,
    pagesPerSession: sessions > 0 ? pageViews / sessions : 0,
    bounceRate: sessions > 0 ? (row?.bounced ?? 0) / sessions : 0,
    engagementRate: sessions > 0 ? (row?.engaged ?? 0) / sessions : 0,
  };
}

const DURATION_BUCKETS: Array<{ label: string; max: number | null }> = [
  { label: '0–10s', max: 10 },
  { label: '10–30s', max: 30 },
  { label: '30s–1m', max: 60 },
  { label: '1–3m', max: 180 },
  { label: '3–10m', max: 600 },
  { label: '10–30m', max: 1800 },
  { label: '30m+', max: null },
];

export async function getDurationDistribution(filters: EngagementFilters): Promise<DurationBucket[]> {
  await ensureSchema();
  const db = sql();
  const { clause, params } = buildWhere(filters);

  const cases = DURATION_BUCKETS.filter((bucket) => bucket.max !== null)
    .map((bucket) => `WHEN engaged_seconds < ${bucket.max} THEN '${bucket.label}'`)
    .join(' ');

  const rows = (await db.query(
    `${sessionCte(clause)}
     SELECT CASE ${cases} ELSE '30m+' END AS bucket, COUNT(*)::int AS sessions
       FROM session_totals
      GROUP BY bucket`,
    params
  )) as Array<{ bucket: string; sessions: number }>;

  // Rendered as a fixed ladder so empty buckets still occupy their slot.
  return DURATION_BUCKETS.map((bucket) => ({
    label: bucket.label,
    sessions: rows.find((row) => row.bucket === bucket.label)?.sessions ?? 0,
  }));
}

export async function getTimeByPage(filters: EngagementFilters, limit = 20): Promise<PageEngagementRow[]> {
  await ensureSchema();
  const db = sql();
  const { clause, params } = buildWhere(filters);
  params.push(limit);

  // Exit rate is derived from which page view was last in its session rather
  // than from the client's is_exit flag: a visitor who switches tabs mid-visit
  // fires a hidden-flush that must not count as leaving the site.
  const rows = (await db.query(
    `WITH scoped AS (
       SELECT * FROM page_views ${clause}
     ),
     last_views AS (
       SELECT DISTINCT ON (session_id) id FROM scoped ORDER BY session_id, created_at DESC
     )
     SELECT s.path,
            MAX(s.page_type) AS page_type,
            COUNT(*)::int AS page_views,
            COUNT(DISTINCT s.session_id)::int AS sessions,
            COALESCE(AVG(s.engaged_seconds), 0) AS avg_engaged_seconds,
            COALESCE(SUM(s.engaged_seconds), 0)::bigint AS total_engaged_seconds,
            AVG(s.max_scroll_percent) AS avg_scroll_percent,
            (COUNT(*) FILTER (WHERE lv.id IS NOT NULL))::numeric / NULLIF(COUNT(*), 0) AS exit_rate
       FROM scoped s
       LEFT JOIN last_views lv ON lv.id = s.id
      GROUP BY s.path
      ORDER BY total_engaged_seconds DESC
      LIMIT $${params.length}`,
    params
  )) as Array<{
    path: string;
    page_type: string | null;
    page_views: number;
    sessions: number;
    avg_engaged_seconds: string;
    total_engaged_seconds: string;
    avg_scroll_percent: string | null;
    exit_rate: string | null;
  }>;

  return rows.map((row) => ({
    path: row.path,
    pageType: row.page_type,
    pageViews: row.page_views,
    sessions: row.sessions,
    avgEngagedSeconds: Math.round(Number(row.avg_engaged_seconds)),
    totalEngagedSeconds: Number(row.total_engaged_seconds),
    avgScrollPercent: row.avg_scroll_percent === null ? null : Math.round(Number(row.avg_scroll_percent)),
    exitRate: row.exit_rate === null ? 0 : Number(row.exit_rate),
  }));
}

/** Shared shape for the device and source breakdowns. */
async function getBreakdown(
  filters: EngagementFilters,
  groupExpression: string,
  limit: number
): Promise<BreakdownRow[]> {
  await ensureSchema();
  const db = sql();
  const { clause, params } = buildWhere(filters);
  params.push(limit);

  const rows = (await db.query(
    `WITH session_totals AS (
       SELECT session_id,
              ${groupExpression} AS label,
              SUM(engaged_seconds)::int AS engaged_seconds,
              COUNT(*)::int AS page_views
         FROM page_views
         ${clause}
        GROUP BY session_id, label
     )
     SELECT label,
            COUNT(*)::int AS sessions,
            SUM(page_views)::int AS page_views,
            COALESCE(AVG(engaged_seconds), 0) AS avg_session_seconds,
            COALESCE(SUM(engaged_seconds), 0)::bigint AS total_engaged_seconds
       FROM session_totals
      GROUP BY label
      ORDER BY sessions DESC
      LIMIT $${params.length}`,
    params
  )) as Array<{
    label: string;
    sessions: number;
    page_views: number;
    avg_session_seconds: string;
    total_engaged_seconds: string;
  }>;

  return rows.map((row) => ({
    label: row.label,
    sessions: row.sessions,
    pageViews: row.page_views,
    avgSessionSeconds: Math.round(Number(row.avg_session_seconds)),
    totalEngagedSeconds: Number(row.total_engaged_seconds),
  }));
}

export function getTimeByDevice(filters: EngagementFilters): Promise<BreakdownRow[]> {
  return getBreakdown(filters, `COALESCE(NULLIF(device_type, ''), 'unknown')`, 10);
}

// Row-level (non-aggregate) so it can be used in GROUP BY. Falls back to the
// referrer's host, so organic/social traffic without UTM tags gets attributed
// to something more useful than "direct".
const SOURCE_EXPRESSION = `COALESCE(
  NULLIF(utm_source, ''),
  NULLIF(regexp_replace(referrer, '^https?://(www\\.)?([^/]+).*$', '\\2'), ''),
  'direct'
)`;

export function getTimeBySource(filters: EngagementFilters): Promise<BreakdownRow[]> {
  return getBreakdown(filters, SOURCE_EXPRESSION, 15);
}

export async function getDailyEngagement(filters: EngagementFilters): Promise<DailyEngagementRow[]> {
  await ensureSchema();
  const db = sql();
  const { clause, params } = buildWhere(filters);

  const rows = (await db.query(
    `WITH session_totals AS (
       SELECT session_id,
              date_trunc('day', MIN(created_at)) AS day,
              MAX(visitor_id) AS visitor_id,
              SUM(engaged_seconds)::int AS engaged_seconds,
              COUNT(*)::int AS page_views
         FROM page_views
         ${clause}
        GROUP BY session_id
     )
     SELECT to_char(day, 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS sessions,
            COUNT(DISTINCT COALESCE(visitor_id, session_id))::int AS visitors,
            SUM(page_views)::int AS page_views,
            COALESCE(AVG(engaged_seconds), 0) AS avg_session_seconds,
            COALESCE(SUM(engaged_seconds), 0)::bigint AS total_engaged_seconds,
            (COUNT(*) FILTER (WHERE page_views = 1 AND engaged_seconds < ${BOUNCE_ENGAGED_SECONDS}))::numeric
              / NULLIF(COUNT(*), 0) AS bounce_rate
       FROM session_totals
      GROUP BY day
      ORDER BY day DESC`,
    params
  )) as Array<{
    date: string;
    sessions: number;
    visitors: number;
    page_views: number;
    avg_session_seconds: string;
    total_engaged_seconds: string;
    bounce_rate: string | null;
  }>;

  return rows.map((row) => ({
    date: row.date,
    sessions: row.sessions,
    visitors: row.visitors,
    pageViews: row.page_views,
    avgSessionSeconds: Math.round(Number(row.avg_session_seconds)),
    totalEngagedSeconds: Number(row.total_engaged_seconds),
    bounceRate: row.bounce_rate === null ? 0 : Number(row.bounce_rate),
  }));
}

export async function listSessions(
  filters: EngagementFilters,
  limit = 20,
  offset = 0
): Promise<{ sessions: SessionRow[]; total: number }> {
  await ensureSchema();
  const db = sql();
  const { clause, params } = buildWhere(filters);

  const countRows = (await db.query(
    `SELECT COUNT(DISTINCT session_id)::int AS total FROM page_views ${clause}`,
    params
  )) as Array<{ total: number }>;

  params.push(limit, offset);

  // Paged before the entry/exit/outcome joins, so those only run against the 20
  // sessions actually being rendered rather than the whole date range.
  const rows = (await db.query(
    `WITH scoped AS (
       SELECT * FROM page_views ${clause}
     ),
     paged AS (
       SELECT session_id,
              MAX(visitor_id) AS visitor_id,
              MIN(created_at) AS started_at,
              MAX(updated_at) AS ended_at,
              SUM(engaged_seconds)::int AS engaged_seconds,
              SUM(active_seconds)::int AS active_seconds,
              COUNT(*)::int AS page_views,
              MAX(device_type) AS device_type,
              MIN(utm_source) AS utm_source,
              MIN(utm_medium) AS utm_medium,
              MIN(utm_campaign) AS utm_campaign,
              MIN(referrer) AS referrer,
              MIN(${SOURCE_EXPRESSION}) AS source
         FROM scoped
        GROUP BY session_id
        ORDER BY started_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
     ),
     entry AS (
       SELECT DISTINCT ON (session_id) session_id, path
         FROM scoped WHERE session_id IN (SELECT session_id FROM paged)
        ORDER BY session_id, created_at ASC
     ),
     exits AS (
       SELECT DISTINCT ON (session_id) session_id, path
         FROM scoped WHERE session_id IN (SELECT session_id FROM paged)
        ORDER BY session_id, created_at DESC
     ),
     outcomes AS (
       SELECT session_id,
              bool_or(event_type = 'add_to_cart') AS added_to_cart,
              bool_or(event_type = 'checkout_initiated') AS reached_checkout
         FROM storefront_events
        WHERE session_id IN (SELECT session_id FROM paged)
        GROUP BY session_id
     )
     SELECT p.*,
            entry.path AS entry_path,
            exits.path AS exit_path,
            COALESCE(o.added_to_cart, false) AS added_to_cart,
            COALESCE(o.reached_checkout, false) AS reached_checkout
       FROM paged p
       JOIN entry ON entry.session_id = p.session_id
       JOIN exits ON exits.session_id = p.session_id
       LEFT JOIN outcomes o ON o.session_id = p.session_id
      ORDER BY p.started_at DESC`,
    params
  )) as Array<{
    session_id: string;
    visitor_id: string | null;
    started_at: string;
    ended_at: string;
    engaged_seconds: number;
    active_seconds: number;
    page_views: number;
    device_type: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    referrer: string | null;
    source: string;
    entry_path: string;
    exit_path: string;
    added_to_cart: boolean;
    reached_checkout: boolean;
  }>;

  return {
    sessions: rows.map((row) => ({
      sessionId: row.session_id,
      visitorId: row.visitor_id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      engagedSeconds: row.engaged_seconds,
      activeSeconds: row.active_seconds,
      pageViews: row.page_views,
      entryPath: row.entry_path,
      exitPath: row.exit_path,
      deviceType: row.device_type,
      source: row.source,
      utmSource: row.utm_source,
      utmMedium: row.utm_medium,
      utmCampaign: row.utm_campaign,
      referrer: row.referrer,
      addedToCart: row.added_to_cart,
      reachedCheckout: row.reached_checkout,
    })),
    total: countRows[0]?.total ?? 0,
  };
}

export async function listPageViewRows(
  filters: EngagementFilters,
  limit = 20,
  offset = 0
): Promise<PageViewRow[]> {
  await ensureSchema();
  const db = sql();
  const { clause, params } = buildWhere(filters);
  params.push(limit, offset);

  const rows = (await db.query(
    `SELECT created_at, updated_at, session_id, visitor_id, path, page_title, page_type,
            engaged_seconds, active_seconds, max_scroll_percent, is_exit,
            device_type, utm_source, referrer
       FROM page_views
       ${clause}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )) as Array<{
    created_at: string;
    updated_at: string;
    session_id: string;
    visitor_id: string | null;
    path: string;
    page_title: string | null;
    page_type: string | null;
    engaged_seconds: number;
    active_seconds: number;
    max_scroll_percent: number | null;
    is_exit: boolean;
    device_type: string | null;
    utm_source: string | null;
    referrer: string | null;
  }>;

  return rows.map((row) => ({
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sessionId: row.session_id,
    visitorId: row.visitor_id,
    path: row.path,
    pageTitle: row.page_title,
    pageType: row.page_type,
    engagedSeconds: row.engaged_seconds,
    activeSeconds: row.active_seconds,
    maxScrollPercent: row.max_scroll_percent,
    isExit: row.is_exit,
    deviceType: row.device_type,
    utmSource: row.utm_source,
    referrer: row.referrer,
  }));
}

/** Distinct values powering the dashboard's device / source filter dropdowns. */
export async function getFilterOptions(
  filters: EngagementFilters
): Promise<{ devices: string[]; sources: string[] }> {
  await ensureSchema();
  const db = sql();
  // Deliberately ignores the device/source filters so the dropdowns don't
  // collapse to the single value you just selected.
  const { clause, params } = buildWhere({ days: filters.days, from: filters.from, to: filters.to });

  const [deviceRows, sourceRows] = await Promise.all([
    db.query(
      `SELECT DISTINCT device_type AS value FROM page_views ${clause} AND device_type IS NOT NULL ORDER BY value`,
      params
    ),
    db.query(
      `SELECT COALESCE(NULLIF(utm_source, ''), 'direct') AS value, COUNT(*)::int AS count
         FROM page_views ${clause}
        GROUP BY value ORDER BY count DESC LIMIT 20`,
      params
    ),
  ]);

  return {
    devices: (deviceRows as Array<{ value: string }>).map((row) => row.value),
    sources: (sourceRows as Array<{ value: string }>).map((row) => row.value),
  };
}
