import { getDashboardReport, resolveRange } from '@/lib/server/analytics.service';
import { hasValidAdminSession, isAdminConfigured } from '@/lib/server/admin-session';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import AdminLogoutButton from '@/components/admin/AdminLogoutButton';
import DateRangePicker from '@/components/admin/DateRangePicker';
import AdminNav from '@/components/admin/AdminNav';
import MetricCard from '@/components/admin/MetricCard';
import { LineChart, BarList, FunnelChart } from '@/components/admin/charts';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics Dashboard | Your Next Blinds',
  robots: { index: false, follow: false },
};

function GateMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-[#f6f6f4] flex items-center justify-center px-4">
      <div className="bg-white rounded-lg p-8 max-w-md text-center border border-gray-200">
        <h1 className="text-xl font-bold text-[#3a3a3a] mb-2">{title}</h1>
        <p className="text-sm text-gray-600">{body}</p>
      </div>
    </div>
  );
}

export default async function AnalyticsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const { range, start, end } = await searchParams;

  if (!isAdminConfigured()) {
    return (
      <GateMessage
        title="Analytics Dashboard"
        body="Set ANALYTICS_ADMIN_ID and ANALYTICS_ADMIN_PASSWORD in the environment to enable this dashboard."
      />
    );
  }

  if (!(await hasValidAdminSession())) {
    return <AdminLoginForm />;
  }

  const resolved = await resolveRange(range, start, end);
  const data = await getDashboardReport(resolved.range);

  if (!data.available) {
    return (
      <GateMessage
        title="Analytics Dashboard"
        body="The analytics database is not reachable. Check that DATABASE_URL is set and the Neon database is running."
      />
    );
  }

  const money = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalBreakdownSessions = data.newVsReturning.newSessions + data.newVsReturning.returningSessions;
  const newShare = totalBreakdownSessions > 0 ? data.newVsReturning.newSessions / totalBreakdownSessions : 0;

  return (
    <div className="min-h-screen bg-[#f6f6f4]">
      <div className="mx-auto max-w-[1180px] px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Analytics</h1>
            <p className="text-sm text-gray-500">{resolved.label} · compared to previous period</p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker activeRange={resolved.key} activeLabel={resolved.label} />
            <AdminLogoutButton />
          </div>
        </div>

        <AdminNav />

        {/* Headline metric cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Sessions" value={data.sessions.value} deltaPct={data.sessions.deltaPct} series={data.sessions.series} />
          <MetricCard label="Visitors" value={data.visitors.value} deltaPct={data.visitors.deltaPct} series={data.visitors.series} />
          <MetricCard label="Orders" value={data.orders.value} deltaPct={data.orders.deltaPct} series={data.orders.series} />
          <MetricCard label="Total sales" value={data.revenue.value} deltaPct={data.revenue.deltaPct} series={data.revenue.series} format="currency" />
          <MetricCard label="Conversion rate" value={data.conversionRate.value} deltaPct={data.conversionRate.deltaPct} format="percent" compact />
          <MetricCard label="Avg order value" value={data.averageOrderValue.value} deltaPct={data.averageOrderValue.deltaPct} format="currency" compact />
          <MetricCard label="Returning visitor rate" value={data.returningRate.value} deltaPct={data.returningRate.deltaPct} format="percent" compact />
          <MetricCard label="Checkout errors" value={data.checkoutErrors.value} deltaPct={data.checkoutErrors.deltaPct} invertDelta compact />
        </div>

        {/* Overview: sessions over time */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-[#1a1a1a]">Sessions over time</h2>
            <span className="text-sm tabular-nums text-gray-500">{data.sessions.value.toLocaleString()} total</span>
          </div>
          <LineChart
            primary={data.sessions.series}
            secondary={data.orders.series}
            primaryLabel="Sessions"
            secondaryLabel="Orders"
            valueFormat="number"
          />
        </div>

        {/* Sales over time */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-[#1a1a1a]">Total sales over time</h2>
            <span className="text-sm tabular-nums text-gray-500">{money(data.revenue.value)}</span>
          </div>
          <LineChart primary={data.revenue.series} primaryLabel="Sales" valueFormat="currency" />
        </div>

        {/* Funnel + New vs returning */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5 lg:col-span-2">
            <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">Conversion funnel</h2>
            <FunnelChart stages={data.funnel} />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">New vs returning</h2>
            <div className="flex h-5 overflow-hidden rounded">
              <div className="bg-[#00473c]" style={{ width: `${newShare * 100}%` }} />
              <div className="bg-[#7fb8ac]" style={{ width: `${(1 - newShare) * 100}%` }} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#3a3a3a]">
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#00473c]" /> New
                </span>
                <span className="tabular-nums text-gray-600">{data.newVsReturning.newSessions.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#3a3a3a]">
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#7fb8ac]" /> Returning
                </span>
                <span className="tabular-nums text-gray-600">{data.newVsReturning.returningSessions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdowns */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">Sessions by traffic source</h2>
            <BarList rows={data.sources} />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">Sessions by device</h2>
            <BarList rows={data.devices} />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">Sessions by location</h2>
            <BarList rows={data.countries} />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">Top landing pages</h2>
            <BarList rows={data.landingPages} />
          </div>
        </div>

        {/* Top products */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 overflow-x-auto">
          <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">Top products</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No product activity in this period.</p>
          ) : (
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4 text-right">Views</th>
                  <th className="py-2 pr-4 text-right">Added to cart</th>
                  <th className="py-2 pr-4 text-right">Units sold</th>
                  <th className="py-2 text-right">Sales</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p.handle} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-[#3a3a3a]">{p.handle}</td>
                    <td className="py-2 pr-4 text-right">{p.views.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{p.addToCarts.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{p.unitsSold.toLocaleString()}</td>
                    <td className="py-2 text-right">{money(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Search terms + recent checkout errors */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">Top searches</h2>
            {data.searchTerms.length === 0 ? (
              <p className="text-sm text-gray-400">No searches in this period.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {data.searchTerms.map((s) => (
                  <li key={s.term} className="flex items-center justify-between gap-2">
                    <span className="truncate text-[#3a3a3a]">{s.term}</span>
                    <span className="tabular-nums text-gray-500">
                      {s.count.toLocaleString()}
                      {s.zeroResults > 0 && (
                        <span className="ml-2 text-xs text-amber-600">{s.zeroResults} no-result</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">Recent checkout errors</h2>
            {data.recentCheckoutErrors.length === 0 ? (
              <p className="text-sm text-gray-400">None recorded. Good.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.recentCheckoutErrors.map((e, i) => (
                  <li key={i} className="flex flex-wrap gap-x-3 border-b border-gray-100 pb-2 text-gray-700">
                    <span className="tabular-nums text-gray-400">{e.ts}</span>
                    <span className="font-medium text-red-700">{e.code ?? 'unknown'}</span>
                    <span className="truncate max-w-[320px] text-gray-500">{e.message ?? ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          First-party analytics · figures reflect events captured on this store.
        </p>
      </div>
    </div>
  );
}
