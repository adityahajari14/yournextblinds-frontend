import Link from 'next/link';
import { getSessionTimeline } from '@/lib/server/analytics.service';
import { hasValidAdminSession, isAdminConfigured } from '@/lib/server/admin-session';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import AdminLogoutButton from '@/components/admin/AdminLogoutButton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Session detail | Analytics | Your Next Blinds',
  robots: { index: false, follow: false },
};

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Page view',
  view_item: 'Viewed product',
  view_item_list: 'Viewed collection',
  select_item: 'Selected product',
  search: 'Searched',
  filter_used: 'Used filter',
  sort_used: 'Changed sort',
  price_calculated: 'Price calculated',
  add_to_cart: 'Added to cart',
  remove_from_cart: 'Removed from cart',
  view_cart: 'Viewed cart',
  begin_checkout: 'Started checkout',
  buy_now_click: 'Clicked Buy Now',
  checkout_error: 'Checkout error',
  sample_request: 'Requested samples',
  newsletter_signup: 'Signed up for newsletter',
  purchase: 'Purchased',
  refund: 'Refunded',
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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function money(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatParamValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString('en-US');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return value.map(formatParamValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default async function SessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;

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

  const detail = await getSessionTimeline(decodeURIComponent(sessionId));

  const backQuery = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();
  const backHref = `/admin/analytics/abandonment${backQuery ? `?${backQuery}` : ''}`;

  if (!detail.available) {
    return (
      <GateMessage
        title="Analytics Dashboard"
        body="The analytics database is not reachable. Check that DATABASE_URL is set and the Neon database is running."
      />
    );
  }

  if (!detail.found || !detail.summary) {
    return (
      <div className="min-h-screen bg-[#f6f6f4] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[720px]">
          <Link href={backHref} className="text-sm text-[#00473c] hover:underline">
            ← Back to Abandonment
          </Link>
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-lg font-semibold text-[#1a1a1a]">Session not found</h1>
            <p className="mt-2 text-sm text-gray-500">
              No events were found for this session. It may have fallen outside the data retention
              window, or the ID no longer matches a stored session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { summary, products, events } = detail;

  const status = summary.purchased
    ? { label: 'Purchased', tone: 'bg-green-50 text-green-700 border-green-200' }
    : summary.reachedCheckout
      ? { label: 'Abandoned checkout', tone: 'bg-amber-50 text-amber-700 border-amber-200' }
      : { label: 'Abandoned cart', tone: 'bg-gray-50 text-gray-600 border-gray-200' };

  return (
    <div className="min-h-screen bg-[#f6f6f4]">
      <div className="mx-auto max-w-[900px] px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={backHref} className="text-sm text-[#00473c] hover:underline">
            ← Back to Abandonment
          </Link>
          <AdminLogoutButton />
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#1a1a1a]">Session detail</h1>
              <p className="mt-0.5 text-xs text-gray-400">{summary.sessionId}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.tone}`}>
              {status.label}
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">First seen</dt>
              <dd className="mt-0.5 text-[#3a3a3a]">{formatDateTime(summary.firstSeen)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Last activity</dt>
              <dd className="mt-0.5 text-[#3a3a3a]">{formatDateTime(summary.lastSeen)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Visitor</dt>
              <dd className="mt-0.5 text-[#3a3a3a]">
                {summary.isReturning ? 'Returning' : 'New'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Device</dt>
              <dd className="mt-0.5 text-[#3a3a3a]">{summary.device ?? 'unknown'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Location</dt>
              <dd className="mt-0.5 text-[#3a3a3a]">
                {[summary.city, summary.country].filter(Boolean).join(', ') || 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Source</dt>
              <dd className="mt-0.5 text-[#3a3a3a]">{summary.source}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Landing page</dt>
              <dd className="mt-0.5 truncate text-[#3a3a3a]" title={summary.landingPath ?? undefined}>
                {summary.landingPath ?? '—'}
              </dd>
            </div>
            {summary.referrer && (
              <div className="md:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-gray-400">Referrer</dt>
                <dd className="mt-0.5 truncate text-[#3a3a3a]" title={summary.referrer}>
                  {summary.referrer}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Products */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">
            Products
            <span className="ml-2 text-sm font-normal text-gray-400">
              {products.length === 0 ? 'none seen' : `${products.length} in this session`}
            </span>
          </h2>

          {products.length === 0 ? (
            <p className="text-sm text-gray-400">
              No product was viewed or added to cart in this session.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {products.map((p) => (
                <li key={p.handle} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link
                      href={p.url}
                      target="_blank"
                      className="font-medium text-[#00473c] hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {p.purchased && (
                        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          Purchased
                        </span>
                      )}
                      {!p.purchased && p.addedToCart && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          Added to cart
                        </span>
                      )}
                      {p.viewed && (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          Viewed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm tabular-nums text-gray-600">
                    {p.quantity != null && <div>Qty {p.quantity}</div>}
                    {p.price != null && <div className="font-medium text-[#1a1a1a]">{money(p.price)}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Timeline */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-[#1a1a1a]">
            Activity timeline
            <span className="ml-2 text-sm font-normal text-gray-400">{events.length} events</span>
          </h2>

          <ol className="space-y-0">
            {events.map((e, i) => {
              const rawHandle = typeof e.params?.handle === 'string' ? e.params.handle : null;
              // The handle is shown as the product name inline; drop the raw
              // key from the param dump below so it isn't shown twice.
              const paramEntries = e.params
                ? Object.entries(e.params).filter(([key]) => key !== 'handle')
                : [];
              return (
                <li key={i} className="relative border-l-2 border-gray-100 py-3 pl-5 last:pb-0">
                  <span className="absolute -left-[7px] top-4 h-3 w-3 rounded-full border-2 border-white bg-[#00473c]" />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-[#1a1a1a]">
                      {EVENT_LABELS[e.event] ?? e.event}
                      {rawHandle && (
                        <>
                          {' — '}
                          <Link href={`/product/${rawHandle}`} target="_blank" className="text-[#00473c] hover:underline">
                            {products.find((p) => p.handle === rawHandle)?.name ?? rawHandle}
                          </Link>
                        </>
                      )}
                    </span>
                    <span className="text-xs tabular-nums text-gray-400">{formatDateTime(e.ts)}</span>
                  </div>
                  {e.path && <p className="mt-0.5 text-xs text-gray-500">{e.path}</p>}
                  {paramEntries.length > 0 && (
                    <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      {paramEntries.map(([key, value]) => (
                        <div key={key} className="flex items-baseline gap-1 text-xs">
                          <dt className="text-gray-400">{key}:</dt>
                          <dd className="max-w-[280px] truncate text-gray-600" title={formatParamValue(value)}>
                            {formatParamValue(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
