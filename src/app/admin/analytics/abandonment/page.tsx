import Link from 'next/link';
import { getAbandonmentReport, resolveRange } from '@/lib/server/analytics.service';
import { hasValidAdminSession, isAdminConfigured } from '@/lib/server/admin-session';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import AdminLogoutButton from '@/components/admin/AdminLogoutButton';
import DateRangePicker from '@/components/admin/DateRangePicker';
import AdminNav from '@/components/admin/AdminNav';
import MetricCard from '@/components/admin/MetricCard';
import { BarList } from '@/components/admin/charts';
import type { AbandonedSessionRow } from '@/lib/server/analytics.service';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Abandonment | Analytics | Your Next Blinds',
  robots: { index: false, follow: false },
};

function money(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

function AbandonedTable({
  rows,
  emptyLabel,
  backQuery,
}: {
  rows: AbandonedSessionRow[];
  emptyLabel: string;
  backQuery: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">{emptyLabel}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2 pr-4">Last activity</th>
            <th className="py-2 pr-4">Products</th>
            <th className="py-2 pr-4 text-right">Items</th>
            <th className="py-2 pr-4 text-right">Cart value</th>
            <th className="py-2 pr-4">Source</th>
            <th className="py-2 pr-4">Device</th>
            <th className="py-2 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sessionId} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-500">{r.lastSeen}</td>
              <td className="py-2 pr-4 text-[#3a3a3a]">
                {r.products.length > 0 ? (
                  <span className="line-clamp-1 max-w-[220px]" title={r.products.join(', ')}>
                    {r.products.join(', ')}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="py-2 pr-4 text-right">{r.itemCount ?? '—'}</td>
              <td className="py-2 pr-4 text-right">{r.cartValue != null ? money(r.cartValue) : '—'}</td>
              <td className="py-2 pr-4 text-gray-600">{r.source}</td>
              <td className="py-2 pr-4 text-gray-600">
                {r.device ?? 'unknown'}
                {r.country ? <span className="text-gray-400"> · {r.country}</span> : null}
              </td>
              <td className="py-2 text-right">
                <Link
                  href={`/admin/analytics/abandonment/session/${encodeURIComponent(r.sessionId)}${backQuery ? `?${backQuery}` : ''}`}
                  className="font-medium text-[#00473c] hover:underline"
                >
                  View details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AbandonmentPage({
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
  const data = await getAbandonmentReport(resolved.range);

  const backQuery = new URLSearchParams(
    Object.entries({ range, start, end }).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();

  if (!data.available) {
    return (
      <GateMessage
        title="Analytics Dashboard"
        body="The analytics database is not reachable. Check that DATABASE_URL is set and the Neon database is running."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f4]">
      <div className="mx-auto max-w-[1180px] px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Abandonment</h1>
            <p className="text-sm text-gray-500">{resolved.label} · compared to previous period</p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker activeRange={resolved.key} activeLabel={resolved.label} />
            <AdminLogoutButton />
          </div>
        </div>

        <AdminNav />

        {/* Explanation */}
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Abandoned carts</p>
            <p className="mt-1 text-xs text-gray-400">
              Sessions that added an item to the cart but never started checkout.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Abandoned checkouts</p>
            <p className="mt-1 text-xs text-gray-400">
              Sessions that started checkout but never completed a purchase.
            </p>
          </div>
        </div>

        {/* Cart abandonment metrics */}
        <h2 className="mb-3 text-base font-semibold text-[#1a1a1a]">Cart abandonment</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            label="Abandoned carts"
            value={data.cart.abandoned.value}
            deltaPct={data.cart.abandoned.deltaPct}
            invertDelta
            compact
          />
          <MetricCard label="Abandonment rate" value={data.cart.rate} deltaPct={null} format="percent" compact />
          <MetricCard label="Value left in carts" value={data.cart.lostValue} deltaPct={null} format="currency" compact />
        </div>

        {/* Checkout abandonment metrics */}
        <h2 className="mb-3 mt-6 text-base font-semibold text-[#1a1a1a]">Checkout abandonment</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            label="Abandoned checkouts"
            value={data.checkout.abandoned.value}
            deltaPct={data.checkout.abandoned.deltaPct}
            invertDelta
            compact
          />
          <MetricCard label="Abandonment rate" value={data.checkout.rate} deltaPct={null} format="percent" compact />
          <MetricCard label="Value left at checkout" value={data.checkout.lostValue} deltaPct={null} format="currency" compact />
        </div>

        {/* Breakdowns */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-1 text-base font-semibold text-[#1a1a1a]">Checkout abandonment by source</h2>
            <p className="mb-4 text-xs text-gray-400">Abandoned checkouts per traffic source</p>
            <BarList
              rows={data.bySource.map((r) => ({ label: r.label, sessions: r.abandoned, share: r.rate }))}
              valueLabel="abandoned checkouts"
            />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-1 text-base font-semibold text-[#1a1a1a]">Checkout abandonment by device</h2>
            <p className="mb-4 text-xs text-gray-400">Abandoned checkouts per device type</p>
            <BarList
              rows={data.byDevice.map((r) => ({ label: r.label, sessions: r.abandoned, share: r.rate }))}
              valueLabel="abandoned checkouts"
            />
          </div>
        </div>

        {/* Detail tables */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">
            Recently abandoned checkouts
            <span className="ml-2 text-sm font-normal text-gray-400">
              highest-intent — recover these first
            </span>
          </h2>
          <AbandonedTable
            rows={data.abandonedCheckouts}
            emptyLabel="No abandoned checkouts in this period."
            backQuery={backQuery}
          />
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">Recently abandoned carts</h2>
          <AbandonedTable
            rows={data.abandonedCarts}
            emptyLabel="No abandoned carts in this period."
            backQuery={backQuery}
          />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Abandonment is session-scoped over the selected window. Because carts are stored locally,
          the same shopper returning later starts a new session.
        </p>
      </div>
    </div>
  );
}
