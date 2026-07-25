import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/server/admin-auth';
import LogoutButton from './LogoutButton';
import FilterBar from './FilterBar';
import Pagination from './Pagination';
import ExportButton from './ExportButton';
import { CartItemCard, CheckoutItemCard } from './ItemDetails';
import {
  listAbandonedCheckouts,
  type AbandonedCheckoutRecord,
  type CheckoutFilters,
} from '@/lib/server/abandoned-checkout.service';
import {
  listAbandonedCarts,
  type AbandonedCartRecord,
  type CartFilters,
} from '@/lib/server/abandoned-cart.service';
import {
  getDashboardStats,
  listRecentEvents,
  type StorefrontEventRecord,
} from '@/lib/server/events.service';

const CHECKOUT_TABS = ['all', 'pending', 'abandoned', 'converted'] as const;
const CART_TABS = ['all', 'active', 'abandoned', 'converted'] as const;
const TYPE_TABS = ['checkouts', 'carts'] as const;
const PAGE_SIZE = 20;

type TypeTab = (typeof TYPE_TABS)[number];

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const number = new Intl.NumberFormat('en-US');

function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase()}`;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatConfiguration(config: Record<string, unknown> | undefined | null): string {
  if (!config) return '';
  return Object.entries(config)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
      return `${label}: ${value}`;
    })
    .join(' · ');
}

function Badge({ tone, children }: { tone: 'success' | 'critical' | 'attention' | 'info' | 'default'; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    success: 'bg-[#cdfee1] text-[#0c5132]',
    critical: 'bg-[#fed1cf] text-[#8e1f0b]',
    attention: 'bg-[#ffd6a4] text-[#5e4200]',
    info: 'bg-[#eaf4ff] text-[#00527c]',
    default: 'bg-[#e3e3e3] text-[#303030]',
  };
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function checkoutStatusBadge(status: AbandonedCheckoutRecord['status']) {
  if (status === 'converted') return <Badge tone="success">Converted</Badge>;
  if (status === 'abandoned') return <Badge tone="critical">Abandoned</Badge>;
  return <Badge tone="attention">Pending</Badge>;
}

function cartStatusBadge(status: AbandonedCartRecord['status']) {
  if (status === 'converted') return <Badge tone="success">Converted</Badge>;
  if (status === 'abandoned') return <Badge tone="critical">Abandoned</Badge>;
  return <Badge tone="info">Active</Badge>;
}

const EVENT_LABELS: Record<StorefrontEventRecord['eventType'], { label: string; tone: 'success' | 'critical' | 'attention' | 'info' | 'default' }> = {
  product_view: { label: 'Product view', tone: 'info' },
  add_to_cart: { label: 'Add to cart', tone: 'success' },
  cart_view: { label: 'Cart view', tone: 'default' },
  checkout_initiated: { label: 'Checkout initiated', tone: 'attention' },
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-[0_1px_0_rgba(0,0,0,0.05)] px-4 py-3.5 flex flex-col gap-1">
      <span className="text-[13px] font-medium text-[#616161] underline decoration-dotted decoration-[#c9c9c9] underline-offset-4 w-fit">
        {label}
      </span>
      <span className="text-[20px] font-semibold text-[#202223] leading-7">{value}</span>
      {sub && <span className="text-xs text-[#6d7175]">{sub}</span>}
    </div>
  );
}

function FunnelRow({ label, count, maxCount, rate }: { label: string; count: number; maxCount: number; rate: string | null }) {
  const width = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 2 : 0) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-40 shrink-0 text-[13px] text-[#303030]">{label}</span>
      <div className="flex-1 h-6 bg-[#f1f1f1] rounded overflow-hidden">
        <div className="h-full bg-[#0b6bcb] rounded" style={{ width: `${width}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-[13px] font-semibold text-[#202223]">{number.format(count)}</span>
      <span className="w-16 shrink-0 text-right text-xs text-[#6d7175]">{rate ?? '—'}</span>
    </div>
  );
}

function AttributionLine({
  record,
}: {
  record: Pick<AbandonedCheckoutRecord, 'utmSource' | 'utmMedium' | 'utmCampaign' | 'referrer' | 'deviceType' | 'sessionDurationSeconds'>;
}) {
  const parts = [
    record.utmSource ? `${record.utmSource}${record.utmMedium ? `/${record.utmMedium}` : ''}` : null,
    record.utmCampaign,
    record.deviceType,
    formatDuration(record.sessionDurationSeconds) ? `${formatDuration(record.sessionDurationSeconds)} on site` : null,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return <div className="text-xs text-[#8c9196] mt-1">{parts.join(' · ')}</div>;
}

interface PageSearchParams {
  type?: string;
  tab?: string;
  range?: string;
  from?: string;
  to?: string;
  search?: string;
  product?: string;
  minPrice?: string;
  maxPrice?: string;
  checkoutPage?: string;
  cartPage?: string;
  eventPage?: string;
}

export default async function AbandonedCheckoutsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?returnTo=/admin/abandoned-checkouts');
  }

  const params = await searchParams;

  const type: TypeTab = TYPE_TABS.includes(params.type as TypeTab) ? (params.type as TypeTab) : 'checkouts';
  const tab = params.tab || 'all';
  const useCustomDates = Boolean(params.from && params.to);
  const days = useCustomDates ? undefined : Number(params.range) || 30;

  const sharedFilters = {
    days,
    from: useCustomDates ? params.from : undefined,
    to: useCustomDates ? params.to : undefined,
    search: params.search || undefined,
    productHandle: params.product || undefined,
    minSubtotal: params.minPrice ? Number(params.minPrice) : undefined,
    maxSubtotal: params.maxPrice ? Number(params.maxPrice) : undefined,
  };

  const checkoutPage = Math.max(1, Number(params.checkoutPage) || 1);
  const cartPage = Math.max(1, Number(params.cartPage) || 1);
  const eventPage = Math.max(1, Number(params.eventPage) || 1);

  let dashboardError: string | null = null;
  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;
  let checkoutsResult: { checkouts: AbandonedCheckoutRecord[]; total: number } = { checkouts: [], total: 0 };
  let cartsResult: { carts: AbandonedCartRecord[]; total: number } = { carts: [], total: 0 };
  let eventsResult: { events: StorefrontEventRecord[]; total: number } = { events: [], total: 0 };

  try {
    const checkoutFilters: CheckoutFilters = {
      ...sharedFilters,
      status: tab !== 'all' ? (tab as CheckoutFilters['status']) : undefined,
    };
    const cartFilters: CartFilters = {
      ...sharedFilters,
      status: tab !== 'all' ? (tab as CartFilters['status']) : undefined,
    };

    [stats, checkoutsResult, cartsResult, eventsResult] = await Promise.all([
      getDashboardStats(days ?? 30),
      listAbandonedCheckouts(
        type === 'checkouts' ? checkoutFilters : { days, from: sharedFilters.from, to: sharedFilters.to },
        PAGE_SIZE,
        (checkoutPage - 1) * PAGE_SIZE
      ),
      listAbandonedCarts(
        type === 'carts' ? cartFilters : { days, from: sharedFilters.from, to: sharedFilters.to },
        PAGE_SIZE,
        (cartPage - 1) * PAGE_SIZE
      ),
      listRecentEvents({ days: days ?? 30, from: sharedFilters.from, to: sharedFilters.to }, PAGE_SIZE, (eventPage - 1) * PAGE_SIZE),
    ]);
  } catch (error) {
    dashboardError = error instanceof Error ? error.message : 'Failed to load dashboard data.';
    console.error('[AdminDashboard]', error);
  }

  if (dashboardError || !stats) {
    return (
      <div className="w-full min-h-screen bg-[#f1f1f1] py-8">
        <div className="max-w-[998px] mx-auto px-4">
          <div className="bg-white rounded-xl border border-[#fed1cf] p-8 flex flex-col gap-2">
            <h1 className="text-[16px] font-semibold text-[#8e1f0b]">Couldn&apos;t load dashboard data</h1>
            <p className="text-[13px] text-[#6d7175]">
              {dashboardError || 'Something went wrong talking to the database.'} Try refreshing the page — if this
              keeps happening, check the database connection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const conversionRate =
    stats.checkoutsInitiated > 0
      ? `${((stats.checkoutsConverted / stats.checkoutsInitiated) * 100).toFixed(1)}%`
      : '—';
  const abandonmentRate =
    stats.checkoutsInitiated > 0
      ? `${((stats.checkoutsAbandoned / stats.checkoutsInitiated) * 100).toFixed(1)}%`
      : '—';
  const cartAbandonmentRate =
    stats.cartsActive + stats.cartsAbandoned + stats.cartsConverted > 0
      ? `${((stats.cartsAbandoned / (stats.cartsActive + stats.cartsAbandoned + stats.cartsConverted)) * 100).toFixed(1)}%`
      : '—';

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      type: params.type,
      tab: params.tab,
      range: params.range,
      from: params.from,
      to: params.to,
      search: params.search,
      product: params.product,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
    };
    const merged = { ...base, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    return `/admin/abandoned-checkouts?${next.toString()}`;
  };

  const pctOf = (count: number, base: number) => (base > 0 ? `${((count / base) * 100).toFixed(1)}%` : null);
  const funnelMax = Math.max(stats.productViews, stats.addToCarts, stats.checkoutsInitiated, stats.checkoutsConverted);

  const currentTabs = type === 'checkouts' ? CHECKOUT_TABS : CART_TABS;

  return (
    <div className="w-full min-h-screen bg-[#f1f1f1] py-8">
      <div className="max-w-[1180px] mx-auto px-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold text-[#202223]">Store analytics</h1>
            <p className="text-[13px] text-[#6d7175] mt-0.5">
              Custom storefront tracking — events Shopify&apos;s native analytics can&apos;t see for this store
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Product views" value={number.format(stats.productViews)} sub={`${number.format(stats.uniqueSessions)} sessions`} />
          <StatCard label="Added to cart" value={number.format(stats.addToCarts)} sub={pctOf(stats.addToCarts, stats.productViews) ? `${pctOf(stats.addToCarts, stats.productViews)} of views` : undefined} />
          <StatCard label="Cart views" value={number.format(stats.cartViews)} />
          <StatCard label="Checkouts initiated" value={number.format(stats.checkoutsInitiated)} sub={pctOf(stats.checkoutsInitiated, stats.addToCarts) ? `${pctOf(stats.checkoutsInitiated, stats.addToCarts)} of add to carts` : undefined} />
          <StatCard label="Carts abandoned" value={number.format(stats.cartsAbandoned)} sub={cartAbandonmentRate === '—' ? undefined : `${cartAbandonmentRate} of tracked carts`} />
          <StatCard label="Abandoned cart value" value={money.format(stats.abandonedCartValue)} sub="Never reached checkout" />
          <StatCard label="Checkouts abandoned" value={number.format(stats.checkoutsAbandoned)} sub={abandonmentRate === '—' ? undefined : `${abandonmentRate} abandonment rate`} />
          <StatCard label="Abandoned checkout value" value={money.format(stats.abandonedValue)} sub="Recoverable revenue" />
          <StatCard label="Checkouts converted" value={number.format(stats.checkoutsConverted)} sub={conversionRate === '—' ? undefined : `${conversionRate} conversion rate`} />
          <StatCard label="Converted value" value={money.format(stats.convertedValue)} />
          <StatCard label="Active carts" value={number.format(stats.cartsActive)} sub="Still shopping" />
          <StatCard label="Carts converted" value={number.format(stats.cartsConverted)} sub="Reached checkout" />
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-[0_1px_0_rgba(0,0,0,0.05)]">
          <div className="px-4 py-3 border-b border-[#e3e3e3]">
            <h2 className="text-[13px] font-semibold text-[#202223]">Conversion funnel</h2>
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
            <FunnelRow label="Product views" count={stats.productViews} maxCount={funnelMax} rate="100%" />
            <FunnelRow label="Added to cart" count={stats.addToCarts} maxCount={funnelMax} rate={pctOf(stats.addToCarts, stats.productViews)} />
            <FunnelRow label="Checkout initiated" count={stats.checkoutsInitiated} maxCount={funnelMax} rate={pctOf(stats.checkoutsInitiated, stats.productViews)} />
            <FunnelRow label="Converted" count={stats.checkoutsConverted} maxCount={funnelMax} rate={pctOf(stats.checkoutsConverted, stats.productViews)} />
          </div>
        </div>

        {/* Filters */}
        <FilterBar />

        {/* Type + status tabs, export */}
        <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-[0_1px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-4 pt-3 border-b border-[#e3e3e3] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {TYPE_TABS.map((t) => (
                  <Link
                    key={t}
                    href={buildHref({ type: t, tab: 'all' })}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                      t === type ? 'bg-[#202223] text-white' : 'bg-[#f1f1f1] text-[#6d7175] hover:text-[#202223]'
                    }`}
                  >
                    {t === 'checkouts' ? 'Abandoned checkouts' : 'Abandoned carts'}
                  </Link>
                ))}
              </div>
              <div className="flex gap-1 -mb-px">
                {currentTabs.map((t) => (
                  <Link
                    key={t}
                    href={buildHref({ tab: t })}
                    className={`px-3 py-2 text-[13px] font-medium rounded-t-lg border-b-2 transition-colors ${
                      t === tab
                        ? 'border-[#303030] text-[#202223]'
                        : 'border-transparent text-[#6d7175] hover:text-[#202223]'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Link>
                ))}
              </div>
            </div>
            <div className="pb-3">
              <ExportButton type={type} status={tab} />
            </div>
          </div>

          {type === 'checkouts' ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#e3e3e3]">
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Date</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Customer</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Items</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175] text-right">Total</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Status</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkoutsResult.checkouts.map((checkout) => (
                      <tr key={checkout.id} className="border-b border-[#e3e3e3] last:border-b-0 hover:bg-[#fafbfb] align-top">
                        <td className="px-4 py-3 text-[13px] text-[#202223] whitespace-nowrap">
                          {formatDateTime(checkout.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#202223]">
                          <div>{checkout.customerName || checkout.customerEmail || <span className="text-[#8c9196]">No email</span>}</div>
                          {checkout.customerName && checkout.customerEmail && (
                            <div className="text-xs text-[#8c9196]">{checkout.customerEmail}</div>
                          )}
                          {checkout.customerPhone && <div className="text-xs text-[#8c9196]">{checkout.customerPhone}</div>}
                          <AttributionLine record={checkout} />
                        </td>
                        <td className="px-4 py-3 min-w-[280px]">
                          <div className="flex flex-col">
                            {checkout.items.map((item, idx) => (
                              <CheckoutItemCard key={idx} item={item} isLast={idx === checkout.items.length - 1} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-medium text-[#202223] text-right whitespace-nowrap">
                          {money.format(checkout.subtotal)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{checkoutStatusBadge(checkout.status)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {checkout.checkoutUrl && (
                            <a
                              href={checkout.checkoutUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[13px] text-[#005bd3] hover:underline"
                            >
                              View invoice
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                    {checkoutsResult.checkouts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-[#6d7175]">
                          No {tab === 'all' ? '' : `${tab} `}checkouts match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={checkoutPage} pageSize={PAGE_SIZE} total={checkoutsResult.total} pageParam="checkoutPage" />
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#e3e3e3]">
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Date</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Customer</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Items</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175] text-right">Total</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartsResult.carts.map((cart) => (
                      <tr key={cart.id} className="border-b border-[#e3e3e3] last:border-b-0 hover:bg-[#fafbfb] align-top">
                        <td className="px-4 py-3 text-[13px] text-[#202223] whitespace-nowrap">
                          {formatDateTime(cart.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#202223]">
                          <div>{cart.customerName || cart.customerEmail || <span className="text-[#8c9196]">Anonymous</span>}</div>
                          <AttributionLine record={cart} />
                        </td>
                        <td className="px-4 py-3 min-w-[280px]">
                          <div className="flex flex-col">
                            {cart.items.map((item, idx) => (
                              <CartItemCard key={idx} item={item} isLast={idx === cart.items.length - 1} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-medium text-[#202223] text-right whitespace-nowrap">
                          {money.format(cart.subtotal)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{cartStatusBadge(cart.status)}</td>
                      </tr>
                    ))}
                    {cartsResult.carts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-[#6d7175]">
                          No {tab === 'all' ? '' : `${tab} `}carts match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={cartPage} pageSize={PAGE_SIZE} total={cartsResult.total} pageParam="cartPage" />
            </>
          )}
        </div>

        {/* Recent events */}
        <div className="bg-white rounded-xl border border-[#e3e3e3] shadow-[0_1px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e3e3e3]">
            <h2 className="text-[13px] font-semibold text-[#202223]">Live events</h2>
            <p className="text-xs text-[#6d7175] mt-0.5">Raw storefront event stream</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e3e3e3]">
                  <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Time</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Event</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Details</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175] text-right">Qty</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175] text-right">Value</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Source</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-[#6d7175]">Session</th>
                </tr>
              </thead>
              <tbody>
                {eventsResult.events.map((event) => {
                  const eventMeta = EVENT_LABELS[event.eventType];
                  return (
                    <tr key={event.id} className="border-b border-[#e3e3e3] last:border-b-0 hover:bg-[#fafbfb] align-top">
                      <td className="px-4 py-2.5 text-[13px] text-[#202223] whitespace-nowrap">
                        {formatDateTime(event.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Badge tone={eventMeta.tone}>{eventMeta.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-[13px] text-[#202223]">{event.productTitle || '—'}</div>
                        {event.configuration && (
                          <div className="text-xs text-[#6d7175] mt-0.5 max-w-md">
                            {formatConfiguration(event.configuration)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right">{event.quantity ?? '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[#202223] text-right whitespace-nowrap">
                        {event.value === null ? '—' : money.format(event.value)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#6d7175] whitespace-nowrap">
                        {event.utmSource ? `${event.utmSource}${event.utmMedium ? `/${event.utmMedium}` : ''}` : event.deviceType || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#6d7175] font-mono whitespace-nowrap">
                        {event.sessionId.slice(0, 8)}
                      </td>
                    </tr>
                  );
                })}
                {eventsResult.events.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-[#6d7175]">
                      No events match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={eventPage} pageSize={PAGE_SIZE} total={eventsResult.total} pageParam="eventPage" />
        </div>
      </div>
    </div>
  );
}
