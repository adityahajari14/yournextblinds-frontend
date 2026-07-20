// First-party analytics event taxonomy.
// Shared by the client tracker (src/lib/track.ts) and the ingest API
// (src/app/api/track/route.ts) so only known events are ever stored.

export const ANALYTICS_EVENTS = [
  'page_view',
  'view_item',
  'view_item_list',
  'select_item',
  'search',
  'filter_used',
  'sort_used',
  'price_calculated',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'begin_checkout',
  'buy_now_click',
  'checkout_error',
  'sample_request',
  'newsletter_signup',
  // Server-side (recorded by Shopify webhooks, never sent by the browser)
  'purchase',
  'refund',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsEventPayload {
  event: AnalyticsEventName;
  visitorId: string;
  sessionId: string;
  path?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device?: string;
  /** Landing path for the session (first page seen). Client-supplied. */
  landingPath?: string;
  /** True the first time a returning visitor is seen in a new session. */
  isReturning?: boolean;
  /** Country/city are resolved server-side from request geo headers. */
  country?: string;
  city?: string;
  params?: Record<string, unknown>;
}
