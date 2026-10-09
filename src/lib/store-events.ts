import type { CartItem, Product, ProductConfiguration } from "@/types";

const VISITOR_STORAGE_KEY = "store_visitor_id";
const SESSION_STORAGE_KEY = "store_session_id";
const SESSION_START_STORAGE_KEY = "store_session_started_at";
const SESSION_ACTIVITY_STORAGE_KEY = "store_session_last_activity_at";
const SESSION_ATTRIBUTION_STORAGE_KEY = "store_session_attribution";

// A visit ends after this much inactivity; the next event starts a new session.
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pingdom|gtmetrix|phantomjs|puppeteer|playwright|semrush|ahrefs|screaming frog/i;

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

export interface StoreSessionContext {
  sessionId: string;
  visitorId: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  deviceType: string;
  userAgent: string;
  sessionDurationSeconds: number;
}

// Crawlers and automated browsers would otherwise skew every average on the
// engagement dashboard, and each one costs a tracking request.
export function isLikelyBot(): boolean {
  if (typeof navigator === "undefined") return true;
  if (navigator.webdriver) return true;
  return BOT_UA_PATTERN.test(navigator.userAgent);
}

function newId(): string {
  // randomUUID needs a secure context; older Safari over plain http falls back.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// Permanent, survives across visits — this is what "unique visitors" counts and
// what the abandoned-cart row is keyed on.
function getVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;

  const visitorId = newId();
  localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  return visitorId;
}

function startSession(now: number): string {
  const sessionId = newId();
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  localStorage.setItem(SESSION_START_STORAGE_KEY, String(now));
  localStorage.setItem(SESSION_ACTIVITY_STORAGE_KEY, String(now));
  return sessionId;
}

// Rolls over after SESSION_TIMEOUT_MS of inactivity so a "session" means one
// visit. Before this rotated, session ids were permanent and session duration
// was measured from the visitor's very first visit ever.
function getSessionId(): string {
  const now = Date.now();
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  const lastActivity = Number(localStorage.getItem(SESSION_ACTIVITY_STORAGE_KEY));

  if (!existing || !Number.isFinite(lastActivity) || !lastActivity || now - lastActivity > SESSION_TIMEOUT_MS) {
    return startSession(now);
  }

  localStorage.setItem(SESSION_ACTIVITY_STORAGE_KEY, String(now));
  return existing;
}

function getSessionStartedAt(): number {
  const existing = Number(localStorage.getItem(SESSION_START_STORAGE_KEY));
  if (Number.isFinite(existing) && existing > 0) return existing;

  const startedAt = Date.now();
  localStorage.setItem(SESSION_START_STORAGE_KEY, String(startedAt));
  return startedAt;
}

// Keeps the current session alive without emitting an event — used by the
// engagement heartbeat so a long read doesn't get split into two sessions.
export function touchSession(): void {
  if (typeof window === "undefined") return;
  try {
    getSessionId();
  } catch {}
}

// Captured at the first touch of each session, so later events in the visit keep
// attributing to the campaign/referrer that actually brought the visitor in. It
// is stored against the session id so a returning visitor arriving from a new
// campaign gets re-attributed instead of inheriting their first visit forever.
function getSessionAttribution(sessionId: string): SessionAttribution {
  const existing = localStorage.getItem(SESSION_ATTRIBUTION_STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as SessionAttribution & { sessionId?: string };
      if (parsed.sessionId === sessionId) return parsed;
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

  localStorage.setItem(SESSION_ATTRIBUTION_STORAGE_KEY, JSON.stringify({ ...attribution, sessionId }));
  return attribution;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

// Resolving the session id first matters: it may roll the session over, which
// resets the start timestamp and invalidates the stored attribution.
function resolveSession(): StoreSessionContext {
  const sessionId = getSessionId();
  const attribution = getSessionAttribution(sessionId);

  return {
    sessionId,
    visitorId: getVisitorId(),
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    referrer: attribution.referrer,
    deviceType: getDeviceType(),
    userAgent: navigator.userAgent,
    sessionDurationSeconds: Math.round((Date.now() - getSessionStartedAt()) / 1000),
  };
}

function sendStoreEvent(eventType: StoreEventType, payload: StoreEventPayload) {
  if (typeof window === "undefined" || isLikelyBot()) return;

  try {
    const body = JSON.stringify({
      eventType,
      ...resolveSession(),
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

// sendBeacon is the only delivery that reliably survives pagehide (keepalive
// fetch is unreliable there in Safari), and it can't be aborted by the unload.
export function sendEngagementBeacon(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify(payload);

    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track/engagement", blob)) return;
    }

    fetch("/api/track/engagement", {
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

// Exposed so the checkout request can carry the same session/attribution data
// as the tracked events, letting an abandoned checkout be attributed the same
// way an abandoned cart is.
export function getStoreSessionContext(): StoreSessionContext | null {
  if (typeof window === "undefined") return null;

  try {
    return resolveSession();
  } catch {
    return null;
  }
}
