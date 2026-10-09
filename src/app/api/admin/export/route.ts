import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/server/admin-auth';
import { listAbandonedCheckouts, type CheckoutFilters } from '@/lib/server/abandoned-checkout.service';
import { listAbandonedCarts, type CartFilters } from '@/lib/server/abandoned-cart.service';
import { csvResponse, EXPORT_ROW_LIMIT, toCsv } from '@/lib/server/csv';

function parseSharedFilters(searchParams: URLSearchParams): {
  days?: number;
  from?: string;
  to?: string;
  search?: string;
  productHandle?: string;
  minSubtotal?: number;
  maxSubtotal?: number;
} {
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const days = from && to ? undefined : Number(searchParams.get('range')) || 30;
  const search = searchParams.get('search') || undefined;
  const productHandle = searchParams.get('product') || undefined;
  const minSubtotal = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxSubtotal = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  return { days, from, to, search, productHandle, minSubtotal, maxSubtotal };
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const shared = parseSharedFilters(searchParams);
  const status = searchParams.get('status') || undefined;

  if (type === 'carts') {
    const filters: CartFilters = { ...shared, status: status as CartFilters['status'] };
    const { carts } = await listAbandonedCarts(filters, EXPORT_ROW_LIMIT, 0);

    const csv = toCsv(
      ['Created At', 'Status', 'Email', 'Items', 'Subtotal', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Device', 'Session Duration (s)'],
      carts.map((cart) => [
        cart.createdAt,
        cart.status,
        cart.customerEmail ?? '',
        cart.items.map((item) => `${item.quantity}x ${item.title}`).join('; '),
        cart.subtotal.toFixed(2),
        cart.utmSource ?? '',
        cart.utmMedium ?? '',
        cart.utmCampaign ?? '',
        cart.deviceType ?? '',
        cart.sessionDurationSeconds ?? '',
      ])
    );

    return csvResponse(csv, 'abandoned-carts');
  }

  const filters: CheckoutFilters = { ...shared, status: status as CheckoutFilters['status'] };
  const { checkouts } = await listAbandonedCheckouts(filters, EXPORT_ROW_LIMIT, 0);

  const csv = toCsv(
    ['Created At', 'Status', 'Email', 'Items', 'Subtotal', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Device', 'Session Duration (s)', 'Invoice URL'],
    checkouts.map((checkout) => [
      checkout.createdAt,
      checkout.status,
      checkout.customerEmail ?? '',
      checkout.items.map((item) => `${item.quantity}x ${item.title} (${item.widthInches}"x${item.heightInches}")`).join('; '),
      checkout.subtotal.toFixed(2),
      checkout.utmSource ?? '',
      checkout.utmMedium ?? '',
      checkout.utmCampaign ?? '',
      checkout.deviceType ?? '',
      checkout.sessionDurationSeconds ?? '',
      checkout.checkoutUrl ?? '',
    ])
  );

  return csvResponse(csv, 'abandoned-checkouts');
}
