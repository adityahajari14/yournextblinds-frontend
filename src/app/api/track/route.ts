import { recordEvent } from '@/lib/server/analytics.service';
import { ANALYTICS_EVENTS, AnalyticsEventPayload } from '@/lib/analytics-events';

const CLIENT_EVENTS = new Set<string>(
  ANALYTICS_EVENTS.filter((event) => event !== 'purchase' && event !== 'refund')
);

// Resolve visitor geography from platform-provided request headers. These are
// set by the hosting edge (Vercel / Cloudflare) — something the client cannot
// know, so it's a genuine addition over browser-only tracking. Locally these
// are absent and geo is simply left null.
function resolveGeo(request: Request): { country?: string; city?: string } {
  const h = request.headers;
  const country =
    h.get('x-vercel-ip-country') ||
    h.get('cf-ipcountry') ||
    h.get('x-country-code') ||
    undefined;
  const cityRaw = h.get('x-vercel-ip-city') || h.get('cf-ipcity') || undefined;
  // Vercel URL-encodes the city header (e.g. "San%20Francisco").
  let city: string | undefined;
  if (cityRaw) {
    try {
      city = decodeURIComponent(cityRaw);
    } catch {
      city = cityRaw;
    }
  }
  return {
    country: country && country !== 'XX' ? country : undefined,
    city,
  };
}

// Ingest endpoint for the first-party tracker (sendBeacon/fetch).
// Always responds 204 — analytics failures must never surface to the browser.
export async function POST(request: Request) {
  try {
    // sendBeacon may deliver the body without an application/json content type.
    const text = await request.text();
    if (!text || text.length > 16384) return new Response(null, { status: 204 });

    const payload = JSON.parse(text) as AnalyticsEventPayload;
    if (!payload || typeof payload.event !== 'string' || !CLIENT_EVENTS.has(payload.event)) {
      return new Response(null, { status: 204 });
    }
    if (typeof payload.visitorId !== 'string' || typeof payload.sessionId !== 'string') {
      return new Response(null, { status: 204 });
    }

    const geo = resolveGeo(request);
    await recordEvent({ ...payload, country: geo.country, city: geo.city });
  } catch {
    // Swallow — see above.
  }
  return new Response(null, { status: 204 });
}
