import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/server/admin-auth';
import { csvDate, csvResponse, EXPORT_ROW_LIMIT, toCsv } from '@/lib/server/csv';
import {
  getDailyEngagement,
  getTimeByPage,
  listPageViewRows,
  listSessions,
  type EngagementFilters,
} from '@/lib/server/engagement.service';

const DATASETS = ['sessions', 'pageviews', 'pages', 'daily'] as const;
type Dataset = (typeof DATASETS)[number];

/** Reads the same query params the dashboard puts in the URL, so an export
 *  always matches whatever the admin is currently looking at. */
function parseFilters(searchParams: URLSearchParams): EngagementFilters {
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  return {
    days: from && to ? undefined : Number(searchParams.get('range')) || 30,
    from,
    to,
    deviceType: searchParams.get('device') || undefined,
    source: searchParams.get('source') || undefined,
  };
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requested = searchParams.get('dataset');
  const dataset: Dataset = DATASETS.includes(requested as Dataset) ? (requested as Dataset) : 'sessions';
  const filters = parseFilters(searchParams);

  if (dataset === 'pageviews') {
    const rows = await listPageViewRows(filters, EXPORT_ROW_LIMIT, 0);
    const csv = toCsv(
      [
        'Entered At',
        'Last Seen At',
        'Session ID',
        'Visitor ID',
        'Path',
        'Page Title',
        'Page Type',
        'Engaged Seconds',
        'Time On Page (s)',
        'Max Scroll %',
        'Exit Page',
        'Device',
        'UTM Source',
        'Referrer',
      ],
      rows.map((row) => [
        csvDate(row.createdAt),
        csvDate(row.updatedAt),
        row.sessionId,
        row.visitorId ?? '',
        row.path,
        row.pageTitle ?? '',
        row.pageType ?? '',
        row.engagedSeconds,
        row.activeSeconds,
        row.maxScrollPercent ?? '',
        row.isExit ? 'yes' : 'no',
        row.deviceType ?? '',
        row.utmSource ?? '',
        row.referrer ?? '',
      ])
    );
    return csvResponse(csv, 'page-views');
  }

  if (dataset === 'pages') {
    const rows = await getTimeByPage(filters, EXPORT_ROW_LIMIT);
    const csv = toCsv(
      [
        'Path',
        'Page Type',
        'Page Views',
        'Unique Sessions',
        'Avg Engaged (s)',
        'Total Engaged (s)',
        'Avg Scroll %',
        'Exit Rate',
      ],
      rows.map((row) => [
        row.path,
        row.pageType ?? '',
        row.pageViews,
        row.sessions,
        row.avgEngagedSeconds,
        row.totalEngagedSeconds,
        row.avgScrollPercent ?? '',
        `${(row.exitRate * 100).toFixed(1)}%`,
      ])
    );
    return csvResponse(csv, 'time-by-page');
  }

  if (dataset === 'daily') {
    const rows = await getDailyEngagement(filters);
    const csv = toCsv(
      [
        'Date',
        'Sessions',
        'Visitors',
        'Page Views',
        'Avg Session Duration (s)',
        'Total Time On Site (s)',
        'Bounce Rate',
      ],
      rows.map((row) => [
        row.date,
        row.sessions,
        row.visitors,
        row.pageViews,
        row.avgSessionSeconds,
        row.totalEngagedSeconds,
        `${(row.bounceRate * 100).toFixed(1)}%`,
      ])
    );
    return csvResponse(csv, 'daily-engagement');
  }

  const { sessions } = await listSessions(filters, EXPORT_ROW_LIMIT, 0);
  const csv = toCsv(
    [
      'Session ID',
      'Visitor ID',
      'Started At',
      'Ended At',
      'Engaged Duration (s)',
      'Total Duration (s)',
      'Page Views',
      'Entry Path',
      'Exit Path',
      'Device',
      'Source',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Referrer',
      'Added To Cart',
      'Reached Checkout',
    ],
    sessions.map((session) => [
      session.sessionId,
      session.visitorId ?? '',
      csvDate(session.startedAt),
      csvDate(session.endedAt),
      session.engagedSeconds,
      session.activeSeconds,
      session.pageViews,
      session.entryPath,
      session.exitPath,
      session.deviceType ?? '',
      session.source,
      session.utmSource ?? '',
      session.utmMedium ?? '',
      session.utmCampaign ?? '',
      session.referrer ?? '',
      session.addedToCart ? 'yes' : 'no',
      session.reachedCheckout ? 'yes' : 'no',
    ])
  );
  return csvResponse(csv, 'sessions');
}
