import type { CartItem, Product, ProductConfiguration } from "@/types";

const SESSION_STORAGE_KEY = "store_session_id";
const SESSION_START_STORAGE_KEY = "store_session_started_at";
const SESSION_ATTRIBUTION_STORAGE_KEY = "store_session_attribution";

type StoreEventType = "product_view" | "add_to_cart" | "cart_view" | "checkout_initiated";

interface StoreEventPayload {
  productHandle?: string;
  productTitle?: string;
  quantity?: number;
  value?: number;
  configuration?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface SessionAttribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
}

function getSessionId(): string {
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

function getSessionStartedAt(): number {
  const existing = localStorage.getItem(SESSION_START_STORAGE_KEY);
  if (existing) return Number(existing);

  const startedAt = Date.now();
  localStorage.setItem(SESSION_START_STORAGE_KEY, String(startedAt));
  return startedAt;
}

// Captured once per session (first touch), so later events keep attributing to
// the campaign/referrer that actually brought the visitor in.
function getSessionAttribution(): SessionAttribution {
  const existing = localStorage.getItem(SESSION_ATTRIBUTION_STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // fall through and re-derive
    }
  }

  const params = new URLSearchParams(window.location.search);
  const attribution: SessionAttribution = {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    referrer: document.referrer || null,
  };

  localStorage.setItem(SESSION_ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  return attribution;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

function sendStoreEvent(eventType: StoreEventType, payload: StoreEventPayload) {
  if (typeof window === "undefined") return;

  try {
    const attribution = getSessionAttribution();
    const sessionDurationSeconds = Math.round((Date.now() - getSessionStartedAt()) / 1000);

    const body = JSON.stringify({
      eventType,
      sessionId: getSessionId(),
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      referrer: attribution.referrer,
      deviceType: getDeviceType(),
      userAgent: navigator.userAgent,
      sessionDurationSeconds,
      ...payload,
    });
    // keepalive lets the request survive navigation (e.g. redirect to checkout)
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

function configurationSummary(configuration: ProductConfiguration): Record<string, unknown> {
  const entries = Object.entries(configuration).filter(
    ([, value]) => value !== null && value !== undefined && value !== "" && value !== 0
  );
  return Object.fromEntries(entries);
}

export function trackStoreProductView(product: Product) {
  sendStoreEvent("product_view", {
    productHandle: product.slug,
    productTitle: product.name,
    value: product.price,
  });
}

export function trackStoreAddToCart(product: Product, configuration: ProductConfiguration) {
  sendStoreEvent("add_to_cart", {
    productHandle: product.slug,
    productTitle: product.name,
    quantity: 1,
    value: product.price,
    configuration: configurationSummary(configuration),
  });
}

export function trackStoreCartView(items: CartItem[], total: number) {
  sendStoreEvent("cart_view", {
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    value: total,
    meta: {
      items: items.map((item) => ({
        handle: item.product.slug,
        title: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        configuration: configurationSummary(item.configuration),
      })),
    },
  });
}

export function trackStoreCheckoutInitiated(items: CartItem[], total: number) {
  sendStoreEvent("checkout_initiated", {
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    value: total,
    meta: {
      items: items.map((item) => ({
        handle: item.product.slug,
        title: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        configuration: configurationSummary(item.configuration),
      })),
    },
  });
}

export interface StoreSessionContext {
  sessionId: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  deviceType: string;
  userAgent: string;
  sessionDurationSeconds: number;
}

// Exposed so the checkout request can carry the same session/attribution data
// as the tracked events, letting an abandoned checkout be attributed the same
// way an abandoned cart is.
export function getStoreSessionContext(): StoreSessionContext | null {
  if (typeof window === "undefined") return null;

  const attribution = getSessionAttribution();
  return {
    sessionId: getSessionId(),
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    referrer: attribution.referrer,
    deviceType: getDeviceType(),
    userAgent: navigator.userAgent,
    sessionDurationSeconds: Math.round((Date.now() - getSessionStartedAt()) / 1000),
  };
}
