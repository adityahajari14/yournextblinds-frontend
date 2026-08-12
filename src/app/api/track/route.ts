import { NextResponse } from 'next/server';
import {
  recordStorefrontEvent,
  STOREFRONT_EVENT_TYPES,
  type StorefrontEventType,
} from '@/lib/server/events.service';
import { markAbandonedCartCheckoutStarted, upsertAbandonedCart } from '@/lib/server/abandoned-cart.service';
import {
  clampDeviceType,
  clampJson,
  clampNumber,
  clampText,
  MAX_REFERRER_LENGTH,
  MAX_USER_AGENT_LENGTH,
} from '@/lib/server/track-validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const eventType = body?.eventType;
    if (!STOREFRONT_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const sessionId = clampText(body?.sessionId);
    if (!sessionId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Session ids roll over after 30 minutes of inactivity, so the durable
    // per-browser identity is the visitor id. Older clients still in the wild
    // send only sessionId, which stays stable for them.
    const visitorId = clampText(body?.visitorId) ?? sessionId;

    const eventInput = {
      eventType: eventType as StorefrontEventType,
      sessionId,
      visitorId,
      productHandle: clampText(body?.productHandle),
      productTitle: clampText(body?.productTitle),
      quantity: clampNumber(body?.quantity),
      value: clampNumber(body?.value),
      configuration: clampJson(body?.configuration),
      meta: clampJson(body?.meta),
      utmSource: clampText(body?.utmSource),
      utmMedium: clampText(body?.utmMedium),
      utmCampaign: clampText(body?.utmCampaign),
      referrer: clampText(body?.referrer, MAX_REFERRER_LENGTH),
      deviceType: clampDeviceType(body?.deviceType),
      userAgent: clampText(body?.userAgent, MAX_USER_AGENT_LENGTH),
      sessionDurationSeconds: clampNumber(body?.sessionDurationSeconds),
    };

    await recordStorefrontEvent(eventInput);

    if (eventType === 'add_to_cart' || eventType === 'cart_view') {
      const meta = eventInput.meta as { items?: unknown } | null;
      const items = Array.isArray(meta?.items) ? meta!.items : null;
      if (items) {
        // Keyed on the visitor, not the session: a shopper who leaves and comes
        // back an hour later gets a new session id but should still update the
        // one cart row rather than creating a duplicate.
        await upsertAbandonedCart({
          sessionId: visitorId,
          subtotal: eventInput.value ?? 0,
          items,
          utmSource: eventInput.utmSource,
          utmMedium: eventInput.utmMedium,
          utmCampaign: eventInput.utmCampaign,
          referrer: eventInput.referrer,
          deviceType: eventInput.deviceType,
          userAgent: eventInput.userAgent,
          sessionDurationSeconds: eventInput.sessionDurationSeconds,
        });
      }
    }

    if (eventType === 'checkout_initiated') {
      await markAbandonedCartCheckoutStarted(visitorId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Track]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
