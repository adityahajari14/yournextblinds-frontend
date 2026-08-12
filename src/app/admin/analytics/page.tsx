import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/server/admin-auth';
import LogoutButton from '../abandoned-checkouts/LogoutButton';
import AnalyticsFilterBar from './AnalyticsFilterBar';
import Pagination from '@/components/admin/Pagination';
import ExportButton from '@/components/admin/ExportButton';
import {
  AdminNav,
  Badge,
  BarRow,
  Card,
  EmptyRow,
  StatCard,
  Th,
  formatDateTime,
  formatDuration,
  formatPercent,
  number,
} from '@/components/admin/ui';
import {
  getDailyEngagement,
  getDurationDistribution,
  getEngagementStats,
  getFilterOptions,
  getTimeByDevice,
  getTimeByPage,
  getTimeBySource,
  listSessions,
  type BreakdownRow,
  type EngagementFilters,
} from '@/lib/server/engagement.service';

const PAGE_SIZE = 20;

// There is no middleware in this app — every admin surface guards itself.
const LOGIN_REDIRECT = '/admin/login?returnTo=/admin/analytics';

interface PageSearchParams {
  range?: string;
  from?: string;
  to?: string;
  device?: string;
  source?: string;
  sessionPage?: string;
}

function duration(seconds: number): string {
  return formatDuration(seconds) ?? '0s';
}

function BreakdownTable({ title, rows, unit }: { title: string; rows: BreakdownRow[]; unit: string }) {
  return (
    <Card title={title}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#e3e3e3]">
              <Th>{unit}</Th>
              <Th align="right">Sessions</Th>
              <Th align="right">Avg time</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-[#e3e3e3] last:border-b-0 hover:bg-[#fafbfb]">
                <td className="px-4 py-2.5 text-[13px] text-[#202223] truncate max-w-[180px]">{row.label}</td>
                <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right">{number.format(row.sessions)}</td>
                <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right whitespace-nowrap">
                  {duration(row.avgSessionSeconds)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={3}>No data yet.</EmptyRow>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  if (!(await isAdminAuthenticated())) {
    redirect(LOGIN_REDIRECT);
  }

  const params = await searchParams;
  const useCustomDates = Boolean(params.from && params.to);

  const filters: EngagementFilters = {
    days: useCustomDates ? undefined : Number(params.range) || 30,
    from: useCustomDates ? params.from : undefined,
    to: useCustomDates ? params.to : undefined,
    deviceType: params.device || undefined,
    source: params.source || undefined,
  };

  const sessionPage = Math.max(1, Number(params.sessionPage) || 1);

  let error: string | null = null;
  let stats: Awaited<ReturnType<typeof getEngagementStats>> | null = null;
  let distribution: Awaited<ReturnType<typeof getDurationDistribution>> = [];
  let pages: Awaited<ReturnType<typeof getTimeByPage>> = [];
  let devices: BreakdownRow[] = [];
  let sources: BreakdownRow[] = [];
  let daily: Awaited<ReturnType<typeof getDailyEngagement>> = [];
  let sessionList: Awaited<ReturnType<typeof listSessions>> = { sessions: [], total: 0 };
  let options: Awaited<ReturnType<typeof getFilterOptions>> = { devices: [], sources: [] };

  try {
    [stats, distribution, pages, devices, sources, daily, sessionList, options] = await Promise.all([
      getEngagementStats(filters),
      getDurationDistribution(filters),
      getTimeByPage(filters),
      getTimeByDevice(filters),
      getTimeBySource(filters),
      getDailyEngagement(filters),
      listSessions(filters, PAGE_SIZE, (sessionPage - 1) * PAGE_SIZE),
      getFilterOptions(filters),
    ]);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'Failed to load engagement data.';
    console.error('[AdminAnalytics]', caught);
  }

  if (error || !stats) {
    return (
      <div className="w-full min-h-screen bg-[#f1f1f1] py-8">
        <div className="max-w-[998px] mx-auto px-4">
          <div className="bg-white rounded-xl border border-[#fed1cf] p-8 flex flex-col gap-2">
            <h1 className="text-[16px] font-semibold text-[#8e1f0b]">Couldn&apos;t load engagement data</h1>
            <p className="text-[13px] text-[#6d7175]">
              {error || 'Something went wrong talking to the database.'} Try refreshing the page — if this keeps
              happening, check the database connection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxBucket = Math.max(...distribution.map((bucket) => bucket.sessions), 0);
  const maxDaily = Math.max(...daily.map((day) => day.sessions), 0);
  const maxPageTime = Math.max(...pages.map((page) => page.totalEngagedSeconds), 0);

  return (
    <div className="w-full min-h-screen bg-[#f1f1f1] py-8">
      <div className="max-w-[1180px] mx-auto px-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold text-[#202223]">Engagement &amp; time on site</h1>
            <p className="text-[13px] text-[#6d7175] mt-0.5">
              Engaged time counts only while the tab was visible and the visitor was active. A session is one visit —
              it ends after 30 minutes of inactivity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AdminNav current="engagement" />
            <LogoutButton />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Sessions" value={number.format(stats.sessions)} sub={`${number.format(stats.visitors)} unique visitors`} />
          <StatCard label="Avg session duration" value={duration(stats.avgSessionSeconds)} sub="Engaged time per visit" />
          <StatCard label="Median session" value={duration(stats.medianSessionSeconds)} sub="Half of visits are shorter" />
          <StatCard label="Total time on site" value={duration(stats.totalEngagedSeconds)} sub="All visitors combined" />
          <StatCard label="Page views" value={number.format(stats.pageViews)} sub={`${stats.pagesPerSession.toFixed(1)} per session`} />
          <StatCard label="Avg time per page" value={duration(stats.avgPageSeconds)} />
          <StatCard label="Bounce rate" value={formatPercent(stats.bounceRate)} sub="1 page, under 10s" />
          <StatCard label="Engaged sessions" value={formatPercent(stats.engagementRate)} sub="10s+ or 2+ pages" />
          <StatCard label="Pages per session" value={stats.pagesPerSession.toFixed(2)} />
          <StatCard label="Unique visitors" value={number.format(stats.visitors)} sub="Distinct browsers" />
        </div>

        {/* Filters */}
        <AnalyticsFilterBar devices={options.devices} sources={options.sources} />

        {/* Duration distribution */}
        <Card
          title="Session duration distribution"
          subtitle="How long each visit lasted"
          action={
            <ExportButton
              endpoint="/api/admin/analytics/export"
              filename="sessions"
              label="Export sessions"
              params={{ dataset: 'sessions' }}
            />
          }
        >
          <div className="px-4 py-4 flex flex-col gap-3">
            {distribution.map((bucket) => (
              <BarRow
                key={bucket.label}
                label={bucket.label}
                count={bucket.sessions}
                maxCount={maxBucket}
                labelWidth="w-24"
                rate={stats.sessions > 0 ? formatPercent(bucket.sessions / stats.sessions) : null}
              />
            ))}
          </div>
        </Card>

        {/* Daily trend */}
        <Card
          title="Daily trend"
          subtitle="Sessions and average time per day"
          action={
            <ExportButton
              endpoint="/api/admin/analytics/export"
              filename="daily-engagement"
              label="Export daily"
              params={{ dataset: 'daily' }}
            />
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e3e3e3]">
                  <Th>Date</Th>
                  <Th>Sessions</Th>
                  <Th align="right">Visitors</Th>
                  <Th align="right">Page views</Th>
                  <Th align="right">Avg session</Th>
                  <Th align="right">Total time</Th>
                  <Th align="right">Bounce</Th>
                </tr>
              </thead>
              <tbody>
                {daily.map((day) => (
                  <tr key={day.date} className="border-b border-[#e3e3e3] last:border-b-0 hover:bg-[#fafbfb]">
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] whitespace-nowrap">{day.date}</td>
                    <td className="px-4 py-2.5 w-[240px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-4 bg-[#f1f1f1] rounded overflow-hidden">
                          <div
                            className="h-full bg-[#0b6bcb] rounded"
                            style={{ width: `${maxDaily > 0 ? Math.max((day.sessions / maxDaily) * 100, 2) : 0}%` }}
                          />
                        </div>
                        <span className="text-[13px] font-semibold text-[#202223] w-10 text-right">
                          {number.format(day.sessions)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right">{number.format(day.visitors)}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right">{number.format(day.pageViews)}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right whitespace-nowrap">
                      {duration(day.avgSessionSeconds)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right whitespace-nowrap">
                      {duration(day.totalEngagedSeconds)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#6d7175] text-right">{formatPercent(day.bounceRate, 0)}</td>
                  </tr>
                ))}
                {daily.length === 0 && <EmptyRow colSpan={7}>No sessions recorded in this range yet.</EmptyRow>}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Time by page */}
        <Card
          title="Time by page"
          subtitle="Where visitors actually spend their time"
          action={
            <div className="flex gap-2">
              <ExportButton
                endpoint="/api/admin/analytics/export"
                filename="time-by-page"
                label="Export pages"
                params={{ dataset: 'pages' }}
              />
              <ExportButton
                endpoint="/api/admin/analytics/export"
                filename="page-views"
                label="Export page views"
                params={{ dataset: 'pageviews' }}
              />
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e3e3e3]">
                  <Th>Path</Th>
                  <Th>Total time</Th>
                  <Th align="right">Views</Th>
                  <Th align="right">Sessions</Th>
                  <Th align="right">Avg time</Th>
                  <Th align="right">Avg scroll</Th>
                  <Th align="right">Exit rate</Th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.path} className="border-b border-[#e3e3e3] last:border-b-0 hover:bg-[#fafbfb]">
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] max-w-[280px] truncate" title={page.path}>
                      {page.path}
                    </td>
                    <td className="px-4 py-2.5 w-[220px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-4 bg-[#f1f1f1] rounded overflow-hidden">
                          <div
                            className="h-full bg-[#0b6bcb] rounded"
                            style={{
                              width: `${
                                maxPageTime > 0 ? Math.max((page.totalEngagedSeconds / maxPageTime) * 100, 2) : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#6d7175] whitespace-nowrap w-16 text-right">
                          {duration(page.totalEngagedSeconds)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right">{number.format(page.pageViews)}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right">{number.format(page.sessions)}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right whitespace-nowrap">
                      {duration(page.avgEngagedSeconds)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#6d7175] text-right">
                      {page.avgScrollPercent === null ? '—' : `${page.avgScrollPercent}%`}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#6d7175] text-right">{formatPercent(page.exitRate, 0)}</td>
                  </tr>
                ))}
                {pages.length === 0 && <EmptyRow colSpan={7}>No page views recorded in this range yet.</EmptyRow>}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Device + source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BreakdownTable title="Time by device" rows={devices} unit="Device" />
          <BreakdownTable title="Time by source" rows={sources} unit="Source" />
        </div>

        {/* Session explorer */}
        <Card title="Session explorer" subtitle="Every visit in this range, newest first">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e3e3e3]">
                  <Th>Started</Th>
                  <Th align="right">Engaged</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Pages</Th>
                  <Th>Entry → exit</Th>
                  <Th>Source</Th>
                  <Th>Outcome</Th>
                  <Th>Session</Th>
                </tr>
              </thead>
              <tbody>
                {sessionList.sessions.map((session) => (
                  <tr
                    key={session.sessionId}
                    className="border-b border-[#e3e3e3] last:border-b-0 hover:bg-[#fafbfb] align-top"
                  >
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] whitespace-nowrap">
                      {formatDateTime(session.startedAt)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] font-medium text-[#202223] text-right whitespace-nowrap">
                      {duration(session.engagedSeconds)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#6d7175] text-right whitespace-nowrap">
                      {duration(session.activeSeconds)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right">{session.pageViews}</td>
                    <td className="px-4 py-2.5 text-xs text-[#6d7175] max-w-[240px]">
                      <div className="truncate" title={session.entryPath}>
                        {session.entryPath}
                      </div>
                      {session.exitPath !== session.entryPath && (
                        <div className="truncate" title={session.exitPath}>
                          → {session.exitPath}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#6d7175] whitespace-nowrap">
                      <div>{session.source}</div>
                      {session.deviceType && <div className="text-[#8c9196]">{session.deviceType}</div>}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {session.reachedCheckout ? (
                        <Badge tone="success">Checkout</Badge>
                      ) : session.addedToCart ? (
                        <Badge tone="attention">Added to cart</Badge>
                      ) : (
                        <Badge tone="default">Browsed</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[#6d7175] font-mono whitespace-nowrap">
                      {session.sessionId.slice(0, 8)}
                    </td>
                  </tr>
                ))}
                {sessionList.sessions.length === 0 && (
                  <EmptyRow colSpan={8}>No sessions match these filters.</EmptyRow>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={sessionPage} pageSize={PAGE_SIZE} total={sessionList.total} pageParam="sessionPage" />
        </Card>
      </div>
    </div>
  );
}
